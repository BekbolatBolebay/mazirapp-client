-- Update Reservation Statuses
-- This script adds 'preparing' and 'waiting_arrival' to the allowed statuses for reservations.

-- 1. Remove the old check constraint (need to find its name or use a broad drop)
-- Usually it's named something like 'reservations_status_check'
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;

-- 2. Add the updated check constraint
ALTER TABLE public.reservations ADD CONSTRAINT reservations_status_check 
CHECK (status IN ('pending', 'confirmed', 'preparing', 'waiting_arrival', 'cancelled', 'completed', 'awaiting_payment'));

-- 3. Ensure any existing 'preparing' or 'waiting_arrival' notes (if any were forced) are consistent
-- (No action needed here, but helpful to document)

COMMENT ON COLUMN public.reservations.status IS 'Status of the reservation: pending, confirmed, preparing, waiting_arrival, cancelled, completed, awaiting_payment';
