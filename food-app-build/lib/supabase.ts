import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function getGeneralData(table: string) {
    const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('is_active', true);
    
    if (error) {
        console.error(`Error fetching from ${table}:`, error);
        return [];
    }
    return data;
}
