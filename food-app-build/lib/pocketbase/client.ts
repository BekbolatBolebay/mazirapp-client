import PocketBase from 'pocketbase';

// Ортақ PocketBase URL-і
const pbUrl = process.env.NEXT_PUBLIC_POCKETBASE_URL || 'https://pb.mazirapp.kz';

export const pb = new PocketBase(pbUrl);

// Next.js-тегі бірнеше сұраныстардың тоқтап қалмауы үшін
pb.autoCancellation(false);

/**
 * PocketBase-ке әкімші ретінде кіру (Сервер жағында деректерді өңдеу үшін қажет)
 */
export async function getPbAdmin() {
    const adminEmail = process.env.POCKETBASE_ADMIN_EMAIL;
    const adminPassword = process.env.POCKETBASE_ADMIN_PASSWORD;
    
    if (adminEmail && adminPassword) {
        try {
            await pb.admins.authWithPassword(adminEmail, adminPassword);
        } catch (error) {
            console.error('PocketBase Admin Auth Error:', error);
        }
    }
    return pb;
}
