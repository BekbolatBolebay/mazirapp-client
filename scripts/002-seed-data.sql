-- Insert categories
INSERT INTO public.categories (name_kk, name_ru, name_en, sort_order) VALUES
('Фаст-фуд', 'Фаст-фуд', 'Fast Food', 1),
('Ұлттық тағамдар', 'Национальная кухня', 'National Cuisine', 2),
('Сусындар', 'Напитки', 'Drinks', 3),
('Кешкі аска', 'Ужин', 'Dinner', 4),
('Комболар', 'Комбо', 'Combos', 5),
('Десерттер', 'Десерты', 'Desserts', 6),
('Диеталық тағамдар', 'Диетическое питание', 'Diet Food', 7),
('Барлығы', 'Все', 'All Items', 0);

-- Insert restaurants
INSERT INTO public.restaurants (
  name_kk, name_ru, name_en, 
  description_kk, description_ru, description_en,
  image_url, banner_url, address, phone, rating, 
  delivery_time_min, delivery_time_max, delivery_fee, is_open, is_new, cuisine_types
) VALUES
(
  'Dami Cafe',
  'Dami Cafe',
  'Dami Cafe',
  'Кофе және десерттер',
  'Кофе и десерты',
  'Coffee and Desserts',
  'https://images.unsplash.com/photo-1554118811-1e0d58224f24',
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
  'Dostyk ave, 10',
  '+7 777 123 4567',
  4.8,
  15,
  25,
  500,
  true,
  false,
  ARRAY['Кофе', 'Десерттер']
),
(
  'Burger King',
  'Burger King',
  'Burger King',
  'Классикалық сияқты еті, қырыққабат',
  'Классические сочные бургеры',
  'Classic juicy burgers',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  'https://images.unsplash.com/photo-1550547660-d9450f859349',
  'Abai Avenue, 45',
  '+7 777 234 5678',
  4.5,
  20,
  30,
  0,
  true,
  false,
  ARRAY['Фаст-фуд', 'Бургерлер']
),
(
  'Pizza Roma',
  'Pizza Roma',
  'Pizza Roma',
  'Итальян пиццасы',
  'Итальянская пицца',
  'Italian Pizza',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38',
  'Tole bi street, 82',
  '+7 777 345 6789',
  4.9,
  25,
  35,
  500,
  true,
  false,
  ARRAY['Пицца', 'Итальян']
),
(
  'Cozy Coffee',
  'Cozy Coffee',
  'Cozy Coffee',
  'Жайлы кофе дүкені',
  'Уютная кофейня',
  'Cozy Coffee Shop',
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb',
  'https://images.unsplash.com/photo-1442512595331-e89e73853f31',
  'Satpaev street, 22',
  '+7 777 456 7890',
  4.8,
  10,
  20,
  300,
  true,
  true,
  ARRAY['Кофе', 'Десерттер']
),
(
  'Noodle House',
  'Noodle House',
  'Noodle House',
  'Азиялық лағман',
  'Азиатская лапша',
  'Asian Noodles',
  'https://images.unsplash.com/photo-1569718212165-3a8278d5f624',
  'https://images.unsplash.com/photo-1555126634-323283e090fa',
  'Zheltoksan street, 10',
  '+7 777 567 8901',
  4.6,
  20,
  30,
  400,
  true,
  true,
  ARRAY['Азиялық', 'Лағман']
);

-- Insert menu items for Dami Cafe
INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available, is_popular
) 
SELECT 
  r.id,
  'Люкс Чизбургер',
  'Люкс Чизбургер',
  'Deluxe Cheeseburger',
  'Ет, ірімшік, қырыққабат',
  'Мясо, сыр, свежие овощи',
  'Beef, cheese, fresh vegetables',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  12.50,
  true,
  true
FROM public.restaurants r WHERE r.name_en = 'Dami Cafe';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available, is_popular
) 
SELECT 
  r.id,
  'Пепперони пицца',
  'Пепперони пицца',
  'Pepperoni Pizza',
  'Үлкен өлшем, 30 см',
  'Большой размер, 30 см',
  'Large size, 30 cm',
  'https://images.unsplash.com/photo-1628840042765-356cda07504e',
  18.00,
  true,
  true
FROM public.restaurants r WHERE r.name_en = 'Dami Cafe';

-- Insert menu items for Burger King
INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available, is_popular
) 
SELECT 
  r.id,
  'Classic Burger',
  'Классик Бургер',
  'Classic Burger',
  'Классикалық бифбургер картоп фрилермен',
  'Классический бифбургер с картофелем фри',
  'Classic beef burger with french fries',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  12.99,
  true,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'French Fries',
  'Картофель Фри',
  'French Fries',
  'Қытырлақ алтын картоп фри',
  'Хрустящий золотистый картофель фри',
  'Crispy golden french fries',
  'https://images.unsplash.com/photo-1630384082776-cd08d395fb6f',
  4.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Caesar Salad',
  'Цезарь Салаты',
  'Caesar Salad',
  'Тауық етімен',
  'С курицей',
  'With chicken',
  'https://images.unsplash.com/photo-1546793665-c74683f339c1',
  8.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Cola',
  'Кола',
  'Cola',
  'Мұздалған 500мл',
  'Со льдом 500мл',
  'With ice 500ml',
  'https://images.unsplash.com/photo-1629203851122-3726ecdf080e',
  2.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available, is_popular
) 
SELECT 
  r.id,
  'Double Cheese',
  'Двойной Чизбургер',
  'Double Cheese',
  'Екі еттен және екі ірімшіктен',
  'Два мяса и два сыра',
  'Double beef and double cheese',
  'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9',
  15.99,
  true,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Chicken Deluxe',
  'Чикен Делюкс',
  'Chicken Deluxe',
  'Қытырлақ тауық бургері',
  'Хрустящий куриный бургер',
  'Crispy chicken burger',
  'https://images.unsplash.com/photo-1606755962773-d324e0a13086',
  13.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Orange Juice',
  'Апельсиновый Сок',
  'Orange Juice',
  'Таза сығылған',
  'Свежевыжатый',
  'Freshly squeezed',
  'https://images.unsplash.com/photo-1600271886742-f049cd451bba',
  3.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Iced Coffee',
  'Холодный Кофе',
  'Iced Coffee',
  'Карамель және кремімен',
  'С карамелью и кремом',
  'With caramel and cream',
  'https://images.unsplash.com/photo-1517487881594-2787fef5ebf7',
  4.49,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Greek Salad',
  'Греческий Салат',
  'Greek Salad',
  'Фета сырымен',
  'С сыром фета',
  'With feta cheese',
  'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe',
  9.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available
) 
SELECT 
  r.id,
  'Quinoa Bowl',
  'Киноа Боул',
  'Quinoa Bowl',
  'Көкөністермен',
  'С овощами',
  'With vegetables',
  'https://images.unsplash.com/photo-1512621776951-a57141f2eefd',
  11.99,
  true
FROM public.restaurants r WHERE r.name_en = 'Burger King';

-- Insert menu items for Pizza Roma
INSERT INTO public.menu_items (
  restaurant_id, name_kk, name_ru, name_en,
  description_kk, description_ru, description_en,
  image_url, price, is_available, is_popular
) 
SELECT 
  r.id,
  'Маргарита пицца',
  'Маргарита пицца',
  'Margherita Pizza',
  'Қос пеперонимен',
  'С двойным пепперони',
  'With double pepperoni',
  'https://images.unsplash.com/photo-1574071318508-1cdbab80d002',
  25.00,
  true,
  true
FROM public.restaurants r WHERE r.name_en = 'Pizza Roma';

-- Insert promotions
INSERT INTO public.promotions (
  title_kk, title_ru, title_en,
  description_kk, description_ru, description_en,
  image_url, discount_percentage, is_active
) VALUES
(
  '-20% жеңілдік',
  '-20% скидка',
  '-20% discount',
  'Барлық пиццаларға',
  'На все пиццы',
  'On all pizzas',
  'https://images.unsplash.com/photo-1513104890138-7c749659a591',
  20,
  true
),
(
  '1+1 бургерлер',
  '1+1 бургеры',
  '1+1 burgers',
  'Екінші бургер тегін',
  'Второй бургер бесплатно',
  'Second burger free',
  'https://images.unsplash.com/photo-1568901346375-23c9450c58cd',
  50,
  true
);
