-- Add Combo support to categories and menu_items
-- Run this in Supabase SQL Editor

-- 1. Add is_combo to categories
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'categories' AND COLUMN_NAME = 'is_combo') THEN
        ALTER TABLE public.categories ADD COLUMN is_combo BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 2. Add combo_items to menu_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'combo_items') THEN
        ALTER TABLE public.menu_items ADD COLUMN combo_items JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. Update RLS policies (just in case, usually ALL covers it, but to be safe)
-- The existing policies usually use * or specific columns. 
-- Since we added columns, SELECT * will automatically include them.
