-- Migration v2: Add role, city, and home visibility
DO $$ 
BEGIN 
    -- 1. Add role to users (admin/super_admin)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin'));
    END IF;

    -- 2. Add city to restaurants
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'city') THEN
        ALTER TABLE public.restaurants ADD COLUMN city TEXT DEFAULT 'Алматы';
    END IF;

    -- 3. Add home_visible to categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'home_visible') THEN
        ALTER TABLE public.categories ADD COLUMN home_visible BOOLEAN DEFAULT true;
    END IF;

    -- 4. Add home_sort_order to categories
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'categories' AND column_name = 'home_sort_order') THEN
        ALTER TABLE public.categories ADD COLUMN home_sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Enable RLS and add policy for super_admin
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Super admins can manage categories" ON public.categories;
CREATE POLICY "Super admins can manage categories" ON public.categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE users.id = auth.uid() AND users.role = 'super_admin'
        )
    );

-- Update existing users to be admin by default if not set
UPDATE public.users SET role = 'admin' WHERE role IS NULL;

-- Note: Ensure at least one super_admin exists for testing if needed
-- UPDATE public.users SET role = 'super_admin' WHERE email = 'your-email@example.com';
