import { NextRequest, NextResponse } from 'next/server'
import { query } from '@/lib/db'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  try {
    const res = await query(
      'SELECT * FROM public.restaurants WHERE id = $1',
      [id]
    )

    if (res.rows.length === 0) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 })
    }

    return NextResponse.json(res.rows[0])
  } catch (error: any) {
    console.error('Restaurant GET Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
