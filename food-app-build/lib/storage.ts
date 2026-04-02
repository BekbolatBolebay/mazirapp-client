import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

const s3Client = new S3Client({
    endpoint: process.env.MINIO_ENDPOINT || "http://mazir-minio-api.traefik.me",
    region: "us-east-1", // MinIO doesn't care much about region but SDK requires it
    credentials: {
        accessKeyId: process.env.MINIO_ACCESS_KEY || "minioadmin",
        secretAccessKey: process.env.MINIO_SECRET_KEY || "rsnfygmo8cmla1mu",
    },
    forcePathStyle: true, // Required for MinIO
});

const BUCKET_NAME = process.env.MINIO_BUCKET || "mazir-assets";
const PUBLIC_URL = process.env.MINIO_PUBLIC_URL || "http://mazir-minio-api.traefik.me";

/**
 * Uploads a file to MinIO Storage
 * @param file The file object to upload
 * @param path The destination path (key)
 * @returns The public URL of the uploaded file
 */
export async function uploadFile(file: File, path: string) {
    console.log('MinIO Upload:', path);

    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: path,
        Body: buffer,
        ContentType: file.type,
    });

    try {
        await s3Client.send(command);
        // Construct the public URL
        return `${PUBLIC_URL}/${BUCKET_NAME}/${path}`;
    } catch (error) {
        console.error("MinIO Upload Error:", error);
        throw error;
    }
}
