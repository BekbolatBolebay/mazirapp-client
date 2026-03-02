-- Comprehensive Food Categories and Sample Items

-- 1. Insert Categories
INSERT INTO public.categories (name_kk, name_ru, name_en, sort_order) VALUES
('Таңғы ас', 'Завтраки', 'Breakfast', 1),
('Ыстық тамақтар', 'Горячие блюда', 'Hot Dishes', 2),
('Сорпалар', 'Супы', 'Soups', 3),
('Салаттар', 'Салаты', 'Salads', 4),
('Фаст-фуд', 'Фаст-фуд', 'Fast Food', 5),
('Пицца және Паста', 'Пицца и Паста', 'Pizza & Pasta', 6),
('Тәттілер', 'Десерты', 'Desserts', 7),
('Сусындар', 'Напитки', 'Drinks', 8),
('Жеңіл тамақтар', 'Закуски', 'Snacks', 9),
('Балалар мәзірі', 'Детское меню', 'Kids Menu', 10),
('Гарнирлер', 'Гарниры', 'Garnish', 11)
ON CONFLICT DO NOTHING;

-- 2. Sample Menu Items (Linking to Burger King as an example)
-- Note: Replace 'Burger King' with the actual restaurant name if needed.

DO $$
DECLARE
    bk_id UUID;
    cat_breakfast UUID;
    cat_hot UUID;
    cat_soup UUID;
    cat_salad UUID;
    cat_fast UUID;
    cat_dessert UUID;
    cat_drink UUID;
BEGIN
    -- Get Restaurant ID
    SELECT id INTO bk_id FROM public.restaurants WHERE name_en = 'Burger King' LIMIT 1;
    
    -- If Burger King doesn't exist, use the first available restaurant
    IF bk_id IS NULL THEN
        SELECT id INTO bk_id FROM public.restaurants LIMIT 1;
    END IF;

    -- Get Category IDs
    SELECT id INTO cat_breakfast FROM public.categories WHERE name_en = 'Breakfast' LIMIT 1;
    SELECT id INTO cat_hot FROM public.categories WHERE name_en = 'Hot Dishes' LIMIT 1;
    SELECT id INTO cat_soup FROM public.categories WHERE name_en = 'Soups' LIMIT 1;
    SELECT id INTO cat_salad FROM public.categories WHERE name_en = 'Salads' LIMIT 1;
    SELECT id INTO cat_fast FROM public.categories WHERE name_en = 'Fast Food' LIMIT 1;
    SELECT id INTO cat_dessert FROM public.categories WHERE name_en = 'Desserts' LIMIT 1;
    SELECT id INTO cat_drink FROM public.categories WHERE name_en = 'Drinks' LIMIT 1;

    IF bk_id IS NOT NULL THEN
        -- Breakfast
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available) VALUES
        (bk_id, cat_breakfast, 'Сұлы ботқасы', 'Овсяная каша', 'Oatmeal', 'Жемістермен', 'С фруктами', 'With fruits', 1200, 'https://images.unsplash.com/photo-1517673400267-0251440c45dc', true),
        (bk_id, cat_breakfast, 'Құймақтар', 'Блины', 'Pancakes', 'Балмен', 'С медом', 'With honey', 1500, 'https://images.unsplash.com/photo-1528207776546-365bb710ee93', true);

        -- Hot Dishes
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available, is_popular) VALUES
        (bk_id, cat_hot, 'Қазақша ет', 'Мясо по-казахски', 'Beshbarmak', 'Дәстүрлі тағам', 'Традиционное блюдо', 'Traditional dish', 4500, 'https://images.unsplash.com/photo-1547928576-a4a33237cbc3', true, true),
        (bk_id, cat_hot, 'Палау', 'Плов', 'Plov', 'Сиыр етімен', 'С говядиной', 'With beef', 2800, 'https://images.unsplash.com/photo-1541518763669-27fef04b14ea', true, true);

        -- Soups
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available) VALUES
        (bk_id, cat_soup, 'Жасымық сорпасы', 'Чечевичный суп', 'Lentil Soup', 'Нанмен бірге', 'С гренками', 'With croutons', 1200, 'https://images.unsplash.com/photo-1547592166-23ac45744acd', true);

        -- Salads
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available) VALUES
        (bk_id, cat_salad, 'Шұбат', 'Шубат', 'Shubat', 'Түйе сүті', 'Верблюжье молоко', 'Camel milk', 1800, '', true);

        -- Desserts
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available) VALUES
        (bk_id, cat_dessert, 'Чизкейк', 'Чизкейк', 'Cheesecake', 'Жидек соусымен', 'С ягодным соусом', 'With berry sauce', 1800, 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad', true);

        -- Drinks
        INSERT INTO public.menu_items (restaurant_id, category_id, name_kk, name_ru, name_en, description_kk, description_ru, description_en, price, image_url, is_available) VALUES
        (bk_id, cat_drink, 'Американо', 'Американо', 'Americano', '200мл', '200мл', '200ml', 800, 'https://images.unsplash.com/photo-1509042239860-f550ce710b93', true);
    END IF;
END $$;
