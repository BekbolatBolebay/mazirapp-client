import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function uploadToR2(
  file: File,
  folder: string = 'images'
): Promise<string> {
  const fileName = `${folder}/${Date.now()}-${file.name}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileName,
    Body: buffer,
    ContentType: file.type,
  })

  await r2Client.send(command)

  return `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${fileName}`
}

export async function deleteFromR2(fileUrl: string): Promise<void> {
  const fileName = fileUrl.split('/').pop()
  if (!fileName) return

  const command = new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileName,
  })

  await r2Client.send(command)
}

export async function getUploadUrl(fileName: string): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: fileName,
  })

  return await getSignedUrl(r2Client, command, { expiresIn: 3600 })
}
