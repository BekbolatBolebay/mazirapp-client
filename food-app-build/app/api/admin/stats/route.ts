import { NextRequest } from 'next/server'
import { query } from '@/lib/db'
import { verifyAdmin, createAdminResponse, createAdminError } from '@/lib/auth/admin'

// GET dashboard statistics
export async function GET(req: NextRequest) {
  const { authorized } = await verifyAdmin()
  if (!authorized) {
    return createAdminError('Unauthorized', 403)
  }

  try {
    // 1. Get fundamental counts and revenue in one query
    const countsRes = await query(`
      SELECT 
        (SELECT count(*) FROM public.orders) as total_orders,
        (SELECT count(*) FROM public.orders WHERE status IN ('pending', 'preparing', 'on_the_way')) as active_orders,
        (SELECT COALESCE(sum(total_amount), 0) FROM public.orders WHERE status IN ('delivered', 'paid', 'accepted')) as total_revenue,
        (SELECT count(*) FROM public.clients) as total_clients,
        (SELECT count(*) FROM public.staff_profiles) as total_staff,
        (SELECT count(*) FROM public.restaurants) as total_restaurants,
        (SELECT count(*) FROM public.orders WHERE created_at >= CURRENT_DATE) as today_orders
    `);
    
    const baseStats = countsRes.rows[0];

    // 2. Get recent orders with joins
    const recentOrdersRes = await query(`
      SELECT o.*, 
             (SELECT json_build_object('full_name', c.full_name) FROM public.clients c WHERE c.id = o.user_id) as clients,
             (SELECT json_build_object('name_en', r.name_en, 'name_ru', r.name_ru) FROM public.restaurants r WHERE r.id = o.cafe_id) as restaurants
      FROM public.orders o
      ORDER BY o.created_at DESC
      LIMIT 10
    `);

    // 3. Get top restaurants by orders
    const topRestaurantsRes = await query(`
      SELECT cafe_id, count(*) as count
      FROM public.orders
      WHERE status IN ('delivered', 'paid', 'accepted')
      GROUP BY cafe_id
    `);

    const restaurantCounts = topRestaurantsRes.rows.reduce((acc: any, row: any) => {
      acc[row.cafe_id] = parseInt(row.count);
      return acc;
    }, {});

    const stats = {
      totalOrders: parseInt(baseStats.total_orders) || 0,
      activeOrders: parseInt(baseStats.active_orders) || 0,
      totalRevenue: parseFloat(baseStats.total_revenue) || 0,
      totalClients: parseInt(baseStats.total_clients) || 0,
      totalStaff: parseInt(baseStats.total_staff) || 0,
      totalRestaurants: parseInt(baseStats.total_restaurants) || 0,
      todayOrders: parseInt(baseStats.today_orders) || 0,
      recentOrders: recentOrdersRes.rows || [],
      restaurantCounts: restaurantCounts || {},
    }

    return createAdminResponse({ stats })
  } catch (error: any) {
    return createAdminError(error.message, 500)
  }
}
