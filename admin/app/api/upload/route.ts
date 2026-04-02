import { NextResponse } from 'next/server'
import pb from '@/utils/pocketbase'
import { uploadFile } from '@/lib/storage'

export async function POST(request: Request) {
    try {
        const user = pb.authStore.model

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const formData = await request.formData()
        const file = formData.get('file') as File

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 })
        }

        // Кафе ID-ін алу (папка құрылымы үшін, бірақ PB-де бұл метадерек қана)
        let cafeId = 'unknown'
        try {
            const cafe = await pb.collection('restaurants').getFirstListItem(`owner_id="${user.id}"`)
            cafeId = cafe.id
        } catch (e) {
            console.warn('Could not find restaurant for user during upload')
        }

        const timestamp = Date.now()
        const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_')
        const key = `${cafeId}/${timestamp}-${fileName}`

        console.log('--- Uploading to PocketBase ---')
        const url = await uploadFile(file, key)
        console.log('Upload Success:', url)

        return NextResponse.json({ url })
    } catch (error: any) {
        console.error('Upload Route Error Detail:', error)
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
    }
}
