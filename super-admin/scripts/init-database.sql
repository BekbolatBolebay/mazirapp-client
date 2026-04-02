-- Create cafes table
CREATE TABLE IF NOT EXISTS public.cafes (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  logo TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  workHours TEXT,
  plan TEXT NOT NULL DEFAULT 'Basic',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'expired', 'blocked')),
  expiry TEXT NOT NULL,
  blockUntil TEXT,
  blockReason TEXT,
  notifications JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price BIGINT NOT NULL,
  period TEXT NOT NULL DEFAULT 'month' CHECK (period IN ('month', 'year')),
  status BOOLEAN DEFAULT true,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data into cafes
INSERT INTO public.cafes (name, logo, city, address, description, workHours, plan, status, expiry)
VALUES
  ('Green Garden Cafe', 'https://picsum.photos/seed/cafe1/100/100', 'Алматы', 'Абай даңғылы, 15', 'Уютное кафе с фокусом на завтраки и сезонные блюда.', 'Пн-Вс: 08:00 – 22:00', 'Premium', 'active', '2025-12-20'),
  ('Urban Brew', 'https://picsum.photos/seed/cafe2/100/100', 'Астана', 'Мәңгілік Ел, 42', 'Современный городской кофе-бар в центре бизнес-квартала.', 'Пн-Пт: 07:30 – 21:00, Сб-Вс: 09:00 – 20:00', 'Standard', 'active', '2026-11-15'),
  ('Morning Dew', 'https://picsum.photos/seed/cafe3/100/100', 'Шымкент', 'Тәуке хан даңғылы, 8', 'Место для неспешных встреч и утреннего кофе.', 'Пн-Вс: 09:00 – 23:00', 'Basic', 'expired', '2024-02-10'),
  ('The Espresso Hub', 'https://picsum.photos/seed/cafe4/100/100', 'Ақтау', '12-ші шағын аудан, 22', 'Сеть для любителей спешиалти-эспрессо и десертов.', 'Пн-Вс: 08:00 – 23:30', 'Premium', 'active', '2025-06-05'),
  ('Cozy Corner', 'https://picsum.photos/seed/cafe5/100/100', 'Атырау', 'Сәтпаев көшесі, 31', 'Небольшое семейное кафе с домашней кухней.', 'Пн-Вс: 10:00 – 21:00', 'Standard', 'warning', '2026-04-12')
ON CONFLICT DO NOTHING;

-- Insert sample data into subscriptions
INSERT INTO public.subscriptions (id, name, description, price, period, status)
VALUES
  ('1', 'Basic', 'Базовая аналитика\nДо 500 заказов/мес\nПоддержка по почте', 2900, 'month', true),
  ('2', 'Standard', 'Расширенная аналитика\nБезлимитные заказы\nПриоритетная поддержка\nИнтеграция с кассами', 5500, 'month', true),
  ('3', 'Premium', 'AI прогнозирование\nПерсональный менеджер\nAPI доступ\nМульти-аккаунты', 12000, 'month', false)
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_cafes_status ON public.cafes(status);
CREATE INDEX IF NOT EXISTS idx_cafes_city ON public.cafes(city);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_name ON public.subscriptions(name);

-- Enable RLS (Row Level Security) - optional but recommended for production
-- ALTER TABLE public.cafes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
