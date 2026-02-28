-- Migration to align database schema with 001-setup-database.sql

-- 1. Fix users table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role') THEN
        ALTER TABLE public.users ADD COLUMN role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin'));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE public.users ADD COLUMN full_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE public.users ADD COLUMN phone TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'avatar_url') THEN
        ALTER TABLE public.users ADD COLUMN avatar_url TEXT;
    END IF;
END $$;

-- 2. Fix restaurants table
DO $$ 
BEGIN 
    -- Rename name to name_en if it exists
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'name') THEN
        ALTER TABLE public.restaurants RENAME COLUMN name TO name_en;
    END IF;
    -- Add name_kk if missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'name_kk') THEN
        ALTER TABLE public.restaurants ADD COLUMN name_kk TEXT;
        UPDATE public.restaurants SET name_kk = name_en WHERE name_kk IS NULL;
        ALTER TABLE public.restaurants ALTER COLUMN name_kk SET NOT NULL;
    END IF;
    -- Ensure name_ru exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'name_ru') THEN
        ALTER TABLE public.restaurants ADD COLUMN name_ru TEXT;
        UPDATE public.restaurants SET name_ru = name_en WHERE name_ru IS NULL;
        ALTER TABLE public.restaurants ALTER COLUMN name_ru SET NOT NULL;
    END IF;

    -- Rename description to description_en
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'description') THEN
        ALTER TABLE public.restaurants RENAME COLUMN description TO description_en;
    END IF;
    -- Add description_ru, description_kk
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'description_ru') THEN
        ALTER TABLE public.restaurants ADD COLUMN description_ru TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'description_kk') THEN
        ALTER TABLE public.restaurants ADD COLUMN description_kk TEXT;
    END IF;

    -- Rename cover_image_url to banner_url
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'cover_image_url') THEN
        ALTER TABLE public.restaurants RENAME COLUMN cover_image_url TO banner_url;
    END IF;

    -- Rename min_order to minimum_order
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'min_order') THEN
        ALTER TABLE public.restaurants RENAME COLUMN min_order TO minimum_order;
    END IF;

    -- Rename categories to cuisine_types
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'categories') THEN
        ALTER TABLE public.restaurants RENAME COLUMN categories TO cuisine_types;
    END IF;

    -- Add banner_url if missing (and didn't rename)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'restaurants' AND column_name = 'banner_url') THEN
        ALTER TABLE public.restaurants ADD COLUMN banner_url TEXT;
    END IF;
END $$;

-- 3. Fix menu_items table
DO $$ 
BEGIN 
    -- Rename name to name_en
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'name') THEN
        ALTER TABLE public.menu_items RENAME COLUMN name TO name_en;
    END IF;
    -- Add name_kk, name_ru
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'name_kk') THEN
        ALTER TABLE public.menu_items ADD COLUMN name_kk TEXT;
        UPDATE public.menu_items SET name_kk = name_en WHERE name_kk IS NULL;
        ALTER TABLE public.menu_items ALTER COLUMN name_kk SET NOT NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'name_ru') THEN
        ALTER TABLE public.menu_items ADD COLUMN name_ru TEXT;
        UPDATE public.menu_items SET name_ru = name_en WHERE name_ru IS NULL;
        ALTER TABLE public.menu_items ALTER COLUMN name_ru SET NOT NULL;
    END IF;

    -- Rename description to description_en
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'description') THEN
        ALTER TABLE public.menu_items RENAME COLUMN description TO description_en;
    END IF;
    -- Add description_ru, description_kk
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'description_ru') THEN
        ALTER TABLE public.menu_items ADD COLUMN description_ru TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'description_kk') THEN
        ALTER TABLE public.menu_items ADD COLUMN description_kk TEXT;
    END IF;

    -- Handle category (string) to category_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'category_id') THEN
        ALTER TABLE public.menu_items ADD COLUMN category_id UUID REFERENCES public.categories(id);
    END IF;

    -- Add is_stop_list
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'menu_items' AND column_name = 'is_stop_list') THEN
        ALTER TABLE public.menu_items ADD COLUMN is_stop_list BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 4. Fix cart_items table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'cart_items' AND column_name = 'restaurant_id') THEN
        ALTER TABLE public.cart_items ADD COLUMN restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE;
        -- Attempt to populate restaurant_id from menu_items
        UPDATE public.cart_items ci
        SET restaurant_id = mi.restaurant_id
        FROM public.menu_items mi
        WHERE ci.menu_item_id = mi.id;
        
        -- If we have items that couldn't be mapped, we might want to alert or just allow NULL for now if not ready
        -- But the schema says NOT NULL in 001-setup.sql
    END IF;
END $$;

-- 5. Add missing indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant_id ON public.menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_cart_items_restaurant_id ON public.cart_items(restaurant_id);
