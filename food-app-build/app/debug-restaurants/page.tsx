import { query } from '@/lib/db'

export default async function DebugPage() {
    try {
        const res = await query(
            'SELECT id, name_ru, is_open, status, rating FROM restaurants ORDER BY created_at DESC',
            []
        )
        const restaurants = res.rows
        
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold mb-4">Debug: All Restaurants (Latest First)</h1>
                <div className="space-y-2">
                    {restaurants?.map((r: any) => (
                        <div key={r.id} className="p-2 border rounded">
                            <p><strong>Name:</strong> {r.name_ru}</p>
                            <p><strong>ID:</strong> {r.id}</p>
                            <p><strong>Open:</strong> {String(r.is_open)}</p>
                            <p><strong>Status:</strong> {r.status}</p>
                        </div>
                    ))}
                </div>
            </div>
        )
    } catch (error: any) {
        return (
            <div className="p-8">
                <h1 className="text-2xl font-bold text-red-500">Debug Error</h1>
                <pre>{error.message}</pre>
            </div>
        )
    }
}
