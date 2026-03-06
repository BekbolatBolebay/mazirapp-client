-- Migration: Add missing delivery calculation columns to restaurants table
-- Run this in your Supabase SQL Editor

ALTER TABLE public.restaurants 
ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS base_delivery_fee NUMERIC(10,2) DEFAULT 450,
ADD COLUMN IF NOT EXISTS delivery_fee_per_km NUMERIC(10,2) DEFAULT 150,
ADD COLUMN IF NOT EXISTS delivery_surge_multiplier NUMERIC(10,2) DEFAULT 1.0,
ADD COLUMN IF NOT EXISTS delivery_extra_charge NUMERIC(10,2) DEFAULT 0;

-- Optional: Update existing restaurants with some default values if needed
-- UPDATE public.restaurants SET base_delivery_fee = 450, delivery_fee_per_km = 150 WHERE base_delivery_fee IS NULL;
