-- Migration to add platform management columns to restaurants
DO $$ 
BEGIN 
    -- 1. Add platform_status if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'platform_status') THEN
        ALTER TABLE public.restaurants ADD COLUMN platform_status TEXT DEFAULT 'active' CHECK (platform_status IN ('active', 'warning', 'expired', 'blocked'));
    END IF;

    -- 2. Add plan if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'plan') THEN
        ALTER TABLE public.restaurants ADD COLUMN plan TEXT DEFAULT 'Basic';
    END IF;

    -- 3. Add expiry_date if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'expiry_date') THEN
        ALTER TABLE public.restaurants ADD COLUMN expiry_date TIMESTAMP;
    END IF;

    -- 4. Add block_until if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'block_until') THEN
        ALTER TABLE public.restaurants ADD COLUMN block_until TIMESTAMP;
    END IF;

    -- 5. Add block_reason if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'block_reason') THEN
        ALTER TABLE public.restaurants ADD COLUMN block_reason TEXT;
    END IF;
END $$;

-- Populate default values for existing records
UPDATE public.restaurants SET platform_status = 'active' WHERE platform_status IS NULL;
UPDATE public.restaurants SET plan = 'Basic' WHERE plan IS NULL;
UPDATE public.restaurants SET expiry_date = NOW() + INTERVAL '1 month' WHERE expiry_date IS NULL;
