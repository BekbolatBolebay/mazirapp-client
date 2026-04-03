-- Mazir APP: Standalone PostgreSQL Schema Initialization
-- This script reconstructs the schema without Supabase dependencies.

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Users Table (Replacing auth.users + public.users)
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT UNIQUE,
    phone TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin', 'super_admin')),
    is_anonymous BOOLEAN DEFAULT FALSE,
    push_subscription JSONB,
    preferred_language TEXT DEFAULT 'kk',
    theme TEXT DEFAULT 'light',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Restaurants
CREATE TABLE IF NOT EXISTS public.restaurants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    name_kk TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_kk TEXT,
    description_ru TEXT,
    description_en TEXT,
    image_url TEXT,
    banner_url TEXT,
    address TEXT,
    phone TEXT,
    rating NUMERIC DEFAULT 0,
    delivery_time_min INTEGER DEFAULT 20,
    delivery_time_max INTEGER DEFAULT 40,
    delivery_fee NUMERIC DEFAULT 0,
    minimum_order NUMERIC DEFAULT 0,
    is_open BOOLEAN DEFAULT TRUE,
    status TEXT DEFAULT 'open',
    opening_hours JSONB,
    cuisine_types TEXT[],
    total_seats INTEGER,
    kaspi_link TEXT,
    freedom_merchant_id TEXT,
    freedom_payment_secret_key TEXT,
    freedom_receipt_secret_key TEXT,
    payment_type TEXT DEFAULT 'MANUAL',
    accept_cash BOOLEAN DEFAULT TRUE,
    accept_kaspi BOOLEAN DEFAULT TRUE,
    accept_freedom BOOLEAN DEFAULT FALSE,
    is_delivery_enabled BOOLEAN DEFAULT TRUE,
    is_pickup_enabled BOOLEAN DEFAULT TRUE,
    is_booking_enabled BOOLEAN DEFAULT TRUE,
    is_new BOOLEAN DEFAULT TRUE,
    freedom_test_mode BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Categories (Global and Restaurant-specific)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE, -- Null if global
    name_kk TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    icon_url TEXT,
    sort_order INTEGER DEFAULT 0,
    home_visible BOOLEAN DEFAULT TRUE,
    home_sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Menu Items
CREATE TABLE IF NOT EXISTS public.menu_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    name_kk TEXT NOT NULL,
    name_ru TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description_kk TEXT,
    description_ru TEXT,
    description_en TEXT,
    image_url TEXT,
    price NUMERIC NOT NULL,
    original_price NUMERIC,
    is_available BOOLEAN DEFAULT TRUE,
    is_popular BOOLEAN DEFAULT FALSE,
    is_stop_list BOOLEAN DEFAULT FALSE,
    preparation_time INTEGER,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Orders
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending',
    total_amount NUMERIC NOT NULL,
    delivery_fee NUMERIC DEFAULT 0,
    booking_fee NUMERIC DEFAULT 0,
    address TEXT,
    phone TEXT,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    payment_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Order Items
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    name_kk TEXT,
    name_ru TEXT,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);

-- 7. Reservations
CREATE TABLE IF NOT EXISTS public.reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    guests INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    booking_fee NUMERIC DEFAULT 0,
    payment_status TEXT DEFAULT 'pending',
    payment_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7.1. Reservation Items
CREATE TABLE IF NOT EXISTS public.reservation_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE CASCADE,
    menu_item_id UUID REFERENCES public.menu_items(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    price NUMERIC NOT NULL
);

-- 8. Working Hours
CREATE TABLE IF NOT EXISTS public.working_hours (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL,
    open_time TIME,
    close_time TIME,
    is_day_off BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Restaurant Tables
CREATE TABLE IF NOT EXISTS public.restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE
);

-- 10. OTP Codes
CREATE TABLE IF NOT EXISTS public.otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    full_name TEXT,
    phone TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. User Cards
CREATE TABLE IF NOT EXISTS public.user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    pg_card_id TEXT NOT NULL,
    pg_card_hash TEXT NOT NULL,
    pg_card_month TEXT,
    pg_card_year TEXT,
    bank_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pg_card_id)
);

-- 12. Promotions
CREATE TABLE IF NOT EXISTS public.promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    title_kk TEXT NOT NULL,
    title_ru TEXT NOT NULL,
    title_en TEXT NOT NULL,
    description_kk TEXT,
    description_ru TEXT,
    description_en TEXT,
    discount_amount NUMERIC,
    min_order_amount NUMERIC,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    cafe_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    reservation_id UUID REFERENCES public.reservations(id) ON DELETE SET NULL,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Helper function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON public.restaurants FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_menu_items_updated_at BEFORE UPDATE ON public.menu_items FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON public.reservations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_working_hours_updated_at BEFORE UPDATE ON public.working_hours FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_user_cards_updated_at BEFORE UPDATE ON public.user_cards FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- Standardized Seed Data for Mazir App
-- Uses 'cafe_id' and aligns with the Master Consolidated Setup

-- 1. Insert Sample Restaurant
INSERT INTO public.restaurants (
  name_kk, name_ru, name_en, 
  description_kk, description_ru, description_en,
  address, phone, rating, 
  delivery_time_min, delivery_time_max, delivery_fee, 
  is_open, is_new, cuisine_types,
  accept_cash, accept_kaspi, accept_freedom
) VALUES (
  'Mazir Cafe',
  'Мазир Кафе',
  'Mazir Cafe',
  'Ең дәмді тағамдар бізде',
  'Самая вкусная еда у нас',
  'The most delicious food is here',
  'Abai Ave 1, Almaty',
  '+77001234567',
  5.0,
  20,
  45,
  500,
  true,
  true,
  ARRAY['Национальная', 'Европейская'],
  true,
  true,
  false
) ON CONFLICT DO NOTHING;

-- 2. Insert Categories
DO $$
DECLARE
    target_cafe_id UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        INSERT INTO public.categories (cafe_id, name_kk, name_ru, name_en, sort_order) VALUES
        (target_cafe_id, 'Фаст-фуд', 'Фаст-фуд', 'Fast Food', 1),
        (target_cafe_id, 'Сусындар', 'Напитки', 'Drinks', 2),
        (target_cafe_id, 'Десерттер', 'Десерты', 'Desserts', 3)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. Insert Menu Items
DO $$
DECLARE
    target_cafe_id UUID;
    cat_fast_food UUID;
    cat_drinks UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    SELECT id INTO cat_fast_food FROM public.categories WHERE cafe_id = target_cafe_id AND name_en = 'Fast Food' LIMIT 1;
    SELECT id INTO cat_drinks FROM public.categories WHERE cafe_id = target_cafe_id AND name_en = 'Drinks' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        -- Burgers
        INSERT INTO public.menu_items (cafe_id, category_id, name_kk, name_ru, name_en, price, is_popular) VALUES
        (target_cafe_id, cat_fast_food, 'Классикалық Бургер', 'Классический Бургер', 'Classic Burger', 1500, true),
        (target_cafe_id, cat_fast_food, 'Чизбургер', 'Чизбургер', 'Cheeseburger', 1800, false);
        
        -- Drinks
        INSERT INTO public.menu_items (cafe_id, category_id, name_kk, name_ru, name_en, price) VALUES
        (target_cafe_id, cat_drinks, 'Кофе', 'Кофе', 'Coffee', 800),
        (target_cafe_id, cat_drinks, 'Шай', 'Чай', 'Tea', 500);
    END IF;
END $$;

-- 4. Insert Sample Tables
DO $$
DECLARE
    target_cafe_id UUID;
BEGIN
    SELECT id INTO target_cafe_id FROM public.restaurants WHERE name_en = 'Mazir Cafe' LIMIT 1;
    
    IF target_cafe_id IS NOT NULL THEN
        INSERT INTO public.restaurant_tables (cafe_id, table_number, capacity) VALUES
        (target_cafe_id, '1', 2),
        (target_cafe_id, '2', 4),
        (target_cafe_id, '3', 6);
    END IF;
END $$;
