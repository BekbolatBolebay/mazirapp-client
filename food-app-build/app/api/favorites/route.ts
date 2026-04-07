import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

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
      const res = await query(
        `SELECT * FROM public.restaurants WHERE id = ANY($1::uuid[])`,
        [ids]
      )
      return NextResponse.json({ items: res.rows })
    } else if (type === 'food') {
      const res = await query(
        `SELECT m.*, 
                json_build_object('id', r.id, 'name_kk', r.name_kk, 'name_ru', r.name_ru, 'rating', r.rating) as restaurants
         FROM public.menu_items m
         JOIN public.restaurants r ON m.cafe_id = r.id
         WHERE m.id = ANY($1::uuid[])`,
        [ids]
      )
      return NextResponse.json({ items: res.rows })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    console.error('Favorites GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
