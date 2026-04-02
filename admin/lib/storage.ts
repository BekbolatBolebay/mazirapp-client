import pb from '@/utils/pocketbase'

/**
 * Uploads a file to PocketBase
 * @param file The file object to upload
 * @param path Optional path or reference (not used directly in PB, but can be metadata)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, path?: string) {
    // In PocketBase, files are part of a record.
    // We'll use a generic 'files' collection.
    const formData = new FormData()
    formData.append('file', file)
    if (path) formData.append('path', path)

    try {
        const record = await pb.collection('files').create(formData)
        
        // Get public URL: PB_URL/api/files/COLLECTION_ID_OR_NAME/RECORD_ID/FILENAME
        const url = pb.getFileUrl(record, record.file)
        return url
    } catch (error) {
        console.error('PocketBase Storage Upload Error:', error)
        throw error
    }
}
