import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

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

    const { data, error } = await supabase
      .from('reviews')
      .insert({
        cafe_id,
        customer_name: customer_name || 'Anonymous',
        rating,
        comment: comment || '',
        order_id: order_id || null,
        reservation_id: reservation_id || null
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ review: data }, { status: 201 })
  } catch (error: any) {
    console.error('Review Submission Error:', error)
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 })
  }
}
