import { NextRequest } from 'next/server'
import { getPbAdmin } from '@/lib/pocketbase/client'
import { supabase } from '@/lib/supabase'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET dashboard statistics
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    const adminPb = await getPbAdmin()
    
    // 1. Get fundamental counts from PocketBase (Sensitive Data)
    const activeOrders = await adminPb.collection('orders').getList(1, 1, {
      filter: 'status = "pending" || status = "preparing" || status = "on_the_way"'
    });

    const allOrders = await adminPb.collection('orders').getFullList({
      sort: '-created'
    });

    const totalRevenue = allOrders
      .filter(o => ['delivered', 'paid', 'accepted'].includes(o.status))
      .reduce((sum, o) => sum + (parseFloat(o.total_amount) || 0), 0);

    const totalClients = await adminPb.collection('users').getList(1, 1);
    
    // 2. Get counts from Supabase (Public Data)
    const { count: totalRestaurants } = await supabase
      .from('restaurants')
      .select('*', { count: 'exact', head: true });

    // 3. Get recent orders with expanded data
    const recentOrders = await adminPb.collection('orders').getList(1, 10, {
      sort: '-created',
      expand: 'user_id, cafe_id'
    });

    const formattedRecentOrders = recentOrders.items.map(order => ({
      ...order,
      clients: order.expand?.user_id || {},
      restaurants: order.expand?.cafe_id || {}
    }));

    // 4. Calculate top restaurants locally since data is partitioned
    const restaurantCounts: any = {};
    allOrders.forEach(order => {
      if (['delivered', 'paid', 'accepted'].includes(order.status)) {
        restaurantCounts[order.cafe_id] = (restaurantCounts[order.cafe_id] || 0) + 1;
      }
    });

    const stats = {
      totalOrders: allOrders.length,
      activeOrders: activeOrders.totalItems,
      totalRevenue: totalRevenue,
      totalClients: totalClients.totalItems,
      totalStaff: 0, // Migrated separately if needed
      totalRestaurants: totalRestaurants || 0,
      todayOrders: allOrders.filter(o => new Date(o.created).toDateString() === new Date().toDateString()).length,
      recentOrders: formattedRecentOrders,
      restaurantCounts: restaurantCounts,
    }

    return createAdminResponse({ stats })
  } catch (error: any) {
    console.error('Stats API Error:', error);
    return createAdminError(error.message, 500)
  }
}
