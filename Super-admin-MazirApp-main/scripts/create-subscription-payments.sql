-- Create subscription_payments table to track transactions from Cafe Admins to Super Admin
CREATE TABLE IF NOT EXISTS public.subscription_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    restaurant_id UUID REFERENCES public.restaurants(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- references subscriptions.id or name
    plan_name TEXT NOT NULL,
    amount BIGINT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failure')),
    freedom_payment_id TEXT, -- pg_payment_id from Freedom Pay
    pg_sig TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Allow Super Admin (service role) full access
CREATE POLICY "Service role has full access to subscription_payments" 
ON public.subscription_payments 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sub_payments_restaurant ON public.subscription_payments(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_sub_payments_status ON public.subscription_payments(status);
