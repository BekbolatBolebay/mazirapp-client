import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { targetTable, targetId } = body

    if (!targetTable || !targetId) {
      return NextResponse.json({ error: 'Target table and ID are required' }, { status: 400 })
    }

    if (!['orders', 'reservations'].includes(targetTable)) {
      return NextResponse.json({ error: 'Invalid target table' }, { status: 400 })
    }

    const updates: any = {
      payment_status: 'paid',
      updated_at: new Date().toISOString()
    }

    if (targetTable === 'orders') {
      updates.status = 'preparing'
    } else {
      updates.status = 'confirmed'
    }

    const keys = Object.keys(updates)
    const values = keys.map(k => updates[k])
    const setClause = keys.map((k, i) => `${k} = $${i + 2}`).join(', ')

    const res = await query(
      `UPDATE ${targetTable} SET ${setClause} WHERE id = $1 RETURNING *`,
      [targetId, ...values]
    )

    if (res.rowCount === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 })
    }

    // For reservations, we might need cafe_id for redirect
    let cafe_id = null
    if (targetTable === 'reservations') {
      cafe_id = res.rows[0].cafe_id
    }

    return NextResponse.json({ success: true, cafe_id })
  } catch (error: any) {
    console.error('Mock Finalize Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
