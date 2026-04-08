import PocketBase from 'pocketbase';

const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://pocketbase:8090');

export const pb = new PocketBase(pbUrl);

// Disable auto cancellation for concurrent requests in Next.js
pb.autoCancellation(false);

export async function getPbAdmin() {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL || 'admin@mazirapp.kz';
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD || 'Admin123456!';
    
    await pb.admins.authWithPassword(adminEmail, adminPassword);
    return pb;
}
