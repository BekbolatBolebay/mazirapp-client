import { NextRequest, NextResponse } from 'next/server'
import { uploadFile } from '@/lib/storage'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('pb_auth')?.value || cookieStore.get('auth_token')?.value

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '_')}`
    const folder = formData.get('folder') as string || 'images'
    const key = `${folder}/${fileName}`

    console.log('--- Uploading to MinIO Storage (Dokploy) ---')
    const url = await uploadFile(file, key)
    console.log('Upload Success:', url)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('[Upload] error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
