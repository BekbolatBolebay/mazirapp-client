import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { 
      cafe_id, 
      customer_name, 
      rating, 
      comment, 
      order_id, 
      reservation_id 
    } = body

    if (!cafe_id || !rating) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const res = await query(
      `INSERT INTO public.reviews (cafe_id, customer_name, rating, comment, order_id, reservation_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING *`,
      [
        cafe_id,
        customer_name || 'Anonymous',
        rating,
        comment || '',
        order_id || null,
        reservation_id || null
      ]
    )

    return NextResponse.json({ review: res.rows[0] }, { status: 201 })
  } catch (error: any) {
    console.error('Review Submission Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
