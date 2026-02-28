-- Cafe Admin Panel - Full Schema

-- Fix: Drop restrictive trigger and function with CASCADE to handle dependencies (from previous versions)
DROP TRIGGER IF EXISTS trigger_validate_order_status ON public.orders;
DROP TRIGGER IF EXISTS validate_status_trigger ON public.orders;
DROP FUNCTION IF EXISTS validate_status_for_order_type() CASCADE;

-- 1. Cafe profile / settings
CREATE TABLE IF NOT EXISTS public.cafe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Ароматный уголок',
  description TEXT DEFAULT 'Лучшее кафе в городе',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  logo_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  is_open BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
  language TEXT DEFAULT 'kk' CHECK (language IN ('kk', 'ru')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Working hours
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_day_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Menu categories
CREATE TABLE IF NOT EXISTS public.menu_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Menu items
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID REFERENCES public.menu_categories(id) ON DELETE SET NULL,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  image_url TEXT DEFAULT '',
  is_available BOOLEAN DEFAULT TRUE,
  is_stop_list BOOLEAN DEFAULT FALSE,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL,
  customer_name TEXT NOT NULL,
  customer_phone TEXT DEFAULT '',
  customer_avatar TEXT DEFAULT '',
  type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'pickup')),
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'accepted', 'preparing', 'on_the_way', 'delivered', 'cancelled')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  items_count INT DEFAULT 0,
  address TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure necessary columns exist and fix constraints for existing tables
DO $$ 
BEGIN
    -- Fix 'orders' table constraints from previous versions
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='restaurant_id') THEN
        ALTER TABLE public.orders ALTER COLUMN restaurant_id DROP NOT NULL;
    END IF;

    -- Check and add 'type'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='type') THEN
        ALTER TABLE public.orders ADD COLUMN type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'pickup'));
    END IF;

    -- Check and add 'items_count'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='items_count') THEN
        ALTER TABLE public.orders ADD COLUMN items_count INT DEFAULT 0;
    END IF;

    -- Check and add 'customer_phone'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_phone') THEN
        ALTER TABLE public.orders ADD COLUMN customer_phone TEXT DEFAULT '';
    END IF;

    -- Check and add 'address'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='address') THEN
        ALTER TABLE public.orders ADD COLUMN address TEXT DEFAULT '';
    END IF;

    -- Check and add 'customer_avatar'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='orders' AND column_name='customer_avatar') THEN
        ALTER TABLE public.orders ADD COLUMN customer_avatar TEXT DEFAULT '';
    END IF;
END $$;

-- 6. Order items
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Promo codes
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  discount_type TEXT DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value NUMERIC(10,2) NOT NULL DEFAULT 0,
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INT DEFAULT NULL,
  uses_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Banners
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title_kk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name TEXT NOT NULL,
  customer_avatar TEXT DEFAULT '',
  rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  reply TEXT DEFAULT '',
  replied_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.cafe_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Open RLS policies (admin panel - service role or anon can read/write for demo)
CREATE POLICY "allow_all_cafe_settings" ON public.cafe_settings FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_working_hours" ON public.working_hours FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_menu_categories" ON public.menu_categories FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_menu_items" ON public.menu_items FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_orders" ON public.orders FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_order_items" ON public.order_items FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_promo_codes" ON public.promo_codes FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_banners" ON public.banners FOR ALL USING (TRUE) WITH CHECK (TRUE);
CREATE POLICY "allow_all_reviews" ON public.reviews FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Seed: default cafe settings
INSERT INTO public.cafe_settings (name, description, address, phone)
VALUES ('Ароматный уголок', 'Лучшее кафе в городе', 'ул. Пушкина, 10, Алматы', '+7 (700) 123-45-67')
ON CONFLICT DO NOTHING;

-- Seed: default working hours (0=Sun, 1=Mon, ..., 6=Sat)
INSERT INTO public.working_hours (day_of_week, open_time, close_time, is_day_off) VALUES
(0, '09:00', '22:00', FALSE),
(1, '08:00', '22:00', FALSE),
(2, '08:00', '22:00', FALSE),
(3, '08:00', '22:00', FALSE),
(4, '08:00', '22:00', FALSE),
(5, '08:00', '22:00', FALSE),
(6, '09:00', '23:00', FALSE)
ON CONFLICT DO NOTHING;

-- Seed: menu categories
INSERT INTO public.menu_categories (name_kk, name_ru, sort_order) VALUES
('Ыстық тамақтар', 'Горячие блюда', 1),
('Сусындар', 'Напитки', 2),
('Десерттер', 'Десерты', 3),
('Салаттар', 'Салаты', 4)
ON CONFLICT DO NOTHING;

-- Seed: sample orders
INSERT INTO public.orders (customer_name, customer_phone, type, status, total_amount, items_count, address) VALUES
('Александр Смирнов', '+7 (701) 111-22-33', 'delivery', 'new', 2840, 4, 'ул. Абая, 5, кв. 12'),
('Мария Волкова', '+7 (702) 222-33-44', 'pickup', 'new', 950, 2, ''),
('Дмитрий Соколов', '+7 (703) 333-44-55', 'delivery', 'new', 1420, 1, 'ул. Байзакова, 280'),
('Айгерим Бекова', '+7 (704) 444-55-66', 'delivery', 'accepted', 3200, 5, 'мкр Алмагуль, 10'),
('Нурлан Сейткали', '+7 (705) 555-66-77', 'pickup', 'preparing', 1600, 3, '')
ON CONFLICT DO NOTHING;

-- Seed: sample reviews
INSERT INTO public.reviews (customer_name, rating, comment) VALUES
('Айгерим К.', 5, 'Тамаша тамақ, тез жеткізілді! Рахмет.'),
('Иван П.', 4, 'Вкусно, но доставка немного задержалась.'),
('Данияр С.', 5, 'Өте дәмді! Тұрақты тапсырыс беретін боламын.'),
('Анна М.', 3, 'Среднее качество, ожидал лучшего за такую цену.')
ON CONFLICT DO NOTHING;

-- Seed: sample promo codes
INSERT INTO public.promo_codes (code, discount_type, discount_value, min_order_amount, is_active) VALUES
('CAFE10', 'percent', 10, 1000, TRUE),
('WELCOME', 'fixed', 500, 2000, TRUE),
('SUMMER20', 'percent', 20, 3000, FALSE)
ON CONFLICT DO NOTHING;

-- Add owner_id to cafe_settings
ALTER TABLE public.cafe_settings ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add cafe_id to other tables
ALTER TABLE public.working_hours ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.menu_categories ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.banners ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;
ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS cafe_id UUID REFERENCES public.cafe_settings(id) ON DELETE CASCADE;

-- Migrate existing data (link to first cafe if exists)
DO $$
DECLARE
    default_cafe_id UUID;
BEGIN
    SELECT id INTO default_cafe_id FROM public.cafe_settings LIMIT 1;
    IF default_cafe_id IS NOT NULL THEN
        UPDATE public.working_hours SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.menu_categories SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.menu_items SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.orders SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.promo_codes SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.banners SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
        UPDATE public.reviews SET cafe_id = default_cafe_id WHERE cafe_id IS NULL;
    END IF;
END $$;

-- Update RLS Policies
-- First, drop simple allow-all policies
DROP POLICY IF EXISTS "allow_all_cafe_settings" ON public.cafe_settings;
DROP POLICY IF EXISTS "allow_all_working_hours" ON public.working_hours;
DROP POLICY IF EXISTS "allow_all_menu_categories" ON public.menu_categories;
DROP POLICY IF EXISTS "allow_all_menu_items" ON public.menu_items;
DROP POLICY IF EXISTS "allow_all_orders" ON public.orders;
DROP POLICY IF EXISTS "allow_all_order_items" ON public.order_items;
DROP POLICY IF EXISTS "allow_all_promo_codes" ON public.promo_codes;
DROP POLICY IF EXISTS "allow_all_banners" ON public.banners;
DROP POLICY IF EXISTS "allow_all_reviews" ON public.reviews;

-- 1. cafe_settings: Only owner can see/edit
CREATE POLICY "owner_cafe_settings" ON public.cafe_settings
    FOR ALL USING (auth.uid() = owner_id)
    WITH CHECK (auth.uid() = owner_id);

-- 2. Create a helper function to check cafe ownership
CREATE OR REPLACE FUNCTION public.is_cafe_owner(target_cafe_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.cafe_settings
        WHERE id = target_cafe_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Apply policies to all other tables
CREATE POLICY "owner_working_hours" ON public.working_hours FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_menu_categories" ON public.menu_categories FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_menu_items" ON public.menu_items FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_orders" ON public.orders FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_promo_codes" ON public.promo_codes FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_banners" ON public.banners FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));
CREATE POLICY "owner_reviews" ON public.reviews FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));

-- Note: order_items policy should check its parent order's ownership
CREATE POLICY "owner_order_items" ON public.order_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND public.is_cafe_owner(orders.cafe_id)
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND public.is_cafe_owner(orders.cafe_id)
        )
    );
