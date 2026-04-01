-- Migration: User Card Storage for Freedom Pay
-- Stores card tokens (pg_card_id) for one-click payments

CREATE TABLE IF NOT EXISTS public.user_cards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pg_card_id TEXT NOT NULL,
    pg_card_hash TEXT NOT NULL, -- Masked card number (e.g., 411111XXXXXX1111)
    pg_card_month TEXT,
    pg_card_year TEXT,
    bank_name TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, pg_card_id)
);

-- RLS Policies
ALTER TABLE public.user_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own cards" 
ON public.user_cards FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cards" 
ON public.user_cards FOR DELETE 
USING (auth.uid() = user_id);

-- Owners/Admins cannot see user cards (privacy)
-- Webhooks run as service_role, so they bypass RLS to insert/update.

-- Trigger for updated_at
CREATE TRIGGER update_user_cards_updated_at 
BEFORE UPDATE ON public.user_cards 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
