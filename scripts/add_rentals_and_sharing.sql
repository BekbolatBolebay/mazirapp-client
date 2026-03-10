-- Add Rental support to menu_items
-- Run this in Supabase SQL Editor

-- 1. Add type column to menu_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'type') THEN
        ALTER TABLE public.menu_items ADD COLUMN type TEXT DEFAULT 'food';
    END IF;
END $$;

-- 2. Add rental_deposit column to menu_items
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'menu_items' AND COLUMN_NAME = 'rental_deposit') THEN
        ALTER TABLE public.menu_items ADD COLUMN rental_deposit NUMERIC(10,2) DEFAULT 0;
    END IF;
END $$;

-- 3. Add check constraint for type (optional but good for data integrity)
-- ALTER TABLE public.menu_items ADD CONSTRAINT menu_item_type_check CHECK (type IN ('food', 'rental', 'service'));
