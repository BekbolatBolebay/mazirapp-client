import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const idsParam = searchParams.get('ids')
  const type = searchParams.get('type') // 'restaurants' or 'food'

  if (!idsParam) {
    return NextResponse.json({ items: [] })
  }

  const ids = idsParam.split(',').filter(id => id.length > 0)
  if (ids.length === 0) {
    return NextResponse.json({ items: [] })
  }

  try {
    if (type === 'restaurants') {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .in('id', ids);

      if (error) throw error;
      return NextResponse.json({ items: data })
    } else if (type === 'food') {
      const { data, error } = await supabase
        .from('menu_items')
        .select(`
          *,
          restaurants:cafe_id (id, name_kk, name_ru, rating)
        `)
        .in('id', ids);

      if (error) throw error;
      return NextResponse.json({ items: data })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    console.error('Favorites GET Error:', error)
    return NextResponse.json({ error: 'Failed to fetch favorite items' }, { status: 500 })
  }
}
