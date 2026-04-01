-- 1. Create otp_codes table for Custom OTP Auth
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure clients table has all required columns
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_token TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS fcm_token TEXT;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS push_subscription JSONB;
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'ru';
ALTER TABLE public.clients ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ru';

-- Enable RLS
ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;

-- Service role can manage everything (for server actions)
CREATE POLICY "Service role manages OTP" ON public.otp_codes FOR ALL USING (true);


-- 2. Automatic Profile Creation Trigger
-- This function creates a record in public.clients whenever a new user signs up (regular or anonymous)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    is_anon BOOLEAN;
BEGIN
    -- Check if it's an anonymous user
    is_anon := (NEW.raw_app_meta_data->>'provider' = 'anonymous' OR NEW.email IS NULL);
    
    INSERT INTO public.clients (id, full_name, phone, avatar_url, is_anonymous)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'phone', ''),
        NEW.raw_user_meta_data->>'avatar_url',
        is_anon
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = EXCLUDED.phone,
        is_anonymous = EXCLUDED.is_anonymous;
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. Migration: Create profiles for existing users who don't have one
-- We do this in a way that respects the schema
INSERT INTO public.clients (id, full_name, phone, avatar_url, is_anonymous)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', ''),
    COALESCE(raw_user_meta_data->>'phone', ''),
    raw_user_meta_data->>'avatar_url',
    (raw_app_meta_data->>'provider' = 'anonymous' OR email IS NULL)
FROM auth.users
ON CONFLICT (id) DO NOTHING;


-- 4. Ensure RLS for clients table allows users to see/edit their own data
DROP POLICY IF EXISTS "Clients can view own profile" ON public.clients;
DROP POLICY IF EXISTS "Clients can update own profile" ON public.clients;
DROP POLICY IF EXISTS "System can manage profiles" ON public.clients;

CREATE POLICY "Clients can view own profile" ON public.clients FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Clients can update own profile" ON public.clients FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "System can manage profiles" ON public.clients FOR ALL USING (true);
