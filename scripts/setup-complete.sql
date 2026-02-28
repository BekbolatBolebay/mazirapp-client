-- Consolidated Supabase Setup Script (Client + Admin)
-- Use this script in the Supabase SQL Editor to initialize or update your database.

-- 0. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users table (Extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  preferred_language TEXT DEFAULT 'kk' CHECK (preferred_language IN ('kk', 'ru', 'en')),
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Restaurants table (Combined with cafe_settings)
CREATE TABLE IF NOT EXISTS public.restaurants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  banner_url TEXT DEFAULT '',
  address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  rating DECIMAL(2,1) DEFAULT 0.0,
  delivery_time_min INTEGER DEFAULT 20,
  delivery_time_max INTEGER DEFAULT 40,
  delivery_fee DECIMAL(10,2) DEFAULT 0,
  minimum_order DECIMAL(10,2) DEFAULT 0,
  is_open BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
  opening_hours JSONB,
  cuisine_types TEXT[],
  is_new BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  icon_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Menu Items table
CREATE TABLE IF NOT EXISTS public.menu_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE, -- For compatibility
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name_kk TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  name_en TEXT DEFAULT '',
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  original_price NUMERIC(10,2),
  is_available BOOLEAN DEFAULT TRUE,
  is_popular BOOLEAN DEFAULT FALSE,
  is_stop_list BOOLEAN DEFAULT FALSE,
  preparation_time INTEGER DEFAULT 15,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number SERIAL,
  user_id UUID REFERENCES public.users(id),
  restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE, -- For compatibility
  customer_name TEXT,
  customer_phone TEXT,
  customer_avatar TEXT,
  type TEXT DEFAULT 'delivery' CHECK (type IN ('delivery', 'pickup')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled', 'new', 'accepted', 'on_the_way')),
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  items_count INTEGER DEFAULT 0,
  delivery_fee NUMERIC(10,2) DEFAULT 0,
  address TEXT DEFAULT '',
  delivery_address TEXT, -- For compatibility
  notes TEXT DEFAULT '',
  delivery_notes TEXT, -- For compatibility
  payment_method TEXT DEFAULT 'cash',
  phone TEXT, -- For compatibility
  estimated_delivery_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
  name_kk TEXT,
  name_ru TEXT,
  price NUMERIC(10,2) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Favorites table
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, restaurant_id)
);

-- 8. Promotions table
CREATE TABLE IF NOT EXISTS public.promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title_kk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  description_kk TEXT DEFAULT '',
  description_ru TEXT DEFAULT '',
  description_en TEXT DEFAULT '',
  image_url TEXT DEFAULT '',
  discount_percentage INTEGER,
  discount_amount NUMERIC(10,2),
  promo_code TEXT UNIQUE,
  code TEXT, -- For compatibility
  min_order_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Working hours table
CREATE TABLE IF NOT EXISTS public.working_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  open_time TIME,
  close_time TIME,
  is_day_off BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Banners table
CREATE TABLE IF NOT EXISTS public.banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  title_kk TEXT NOT NULL,
  title_ru TEXT NOT NULL,
  image_url TEXT DEFAULT '',
  link_url TEXT DEFAULT '',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  customer_avatar TEXT DEFAULT '',
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT DEFAULT '',
  reply TEXT DEFAULT '',
  replied_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper: Update updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_restaurants_updated_at') THEN
        CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_menu_items_updated_at') THEN
        CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_orders_updated_at') THEN
        CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Dynamic Ownership Check
CREATE OR REPLACE FUNCTION public.is_cafe_owner(target_cafe_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.restaurants
        WHERE id = target_cafe_id AND owner_id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public Access (Read)
DROP POLICY IF EXISTS "Anyone can view restaurants" ON public.restaurants;
CREATE POLICY "Anyone can view restaurants" ON public.restaurants FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view categories" ON public.categories;
CREATE POLICY "Anyone can view categories" ON public.categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view menu items" ON public.menu_items;
CREATE POLICY "Anyone can view menu items" ON public.menu_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Anyone can view active promotions" ON public.promotions;
CREATE POLICY "Anyone can view active promotions" ON public.promotions FOR SELECT USING (is_active = true);

-- Owner Access (Admin)
DROP POLICY IF EXISTS "owner_restaurants" ON public.restaurants;
CREATE POLICY "owner_restaurants" ON public.restaurants FOR ALL USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "owner_categories" ON public.categories;
CREATE POLICY "owner_categories" ON public.categories FOR ALL USING (public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(cafe_id));

DROP POLICY IF EXISTS "owner_menu_items" ON public.menu_items;
CREATE POLICY "owner_menu_items" ON public.menu_items FOR ALL USING (public.is_cafe_owner(restaurant_id) OR public.is_cafe_owner(cafe_id)) WITH CHECK (public.is_cafe_owner(restaurant_id) OR public.is_cafe_owner(cafe_id));

DROP POLICY IF EXISTS "owner_orders" ON public.orders;
CREATE POLICY "owner_orders" ON public.orders FOR ALL USING (public.is_cafe_owner(restaurant_id) OR auth.uid() = user_id) WITH CHECK (public.is_cafe_owner(restaurant_id) OR auth.uid() = user_id);

-- Seed Data
INSERT INTO public.restaurants (name_kk, name_ru, name_en, description_kk, description_ru, description_en, address, phone)
VALUES ('Ароматный уголок', 'Ароматный уголок', 'Fragrant Corner', 'Лучшее кафе', 'Лучшее кафе', 'Best cafe', 'Almaty', '+7777')
ON CONFLICT DO NOTHING;

DO $$
DECLARE
    default_cafe_id UUID;
BEGIN
    SELECT id INTO default_cafe_id FROM public.restaurants LIMIT 1;
    IF default_cafe_id IS NOT NULL THEN
        INSERT INTO public.categories (cafe_id, name_kk, name_ru, name_en, sort_order) VALUES
        (default_cafe_id, 'Ыстық тамақтар', 'Горячие блюда', 'Main Courses', 1),
        (default_cafe_id, 'Сусындар', 'Напитки', 'Drinks', 2)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;
