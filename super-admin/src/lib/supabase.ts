import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon key is missing. Please make sure they are set in the .env file with the VITE_ prefix.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);
