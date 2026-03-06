-- Add separate booking payment toggles to restaurants table
ALTER TABLE restaurants 
ADD COLUMN IF NOT EXISTS booking_accept_cash BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_accept_kaspi BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS booking_accept_freedom BOOLEAN DEFAULT true;

-- Update existing records to match existing general settings initially if desired, 
-- but defaulting to true is safer for not breaking current flows.
UPDATE restaurants 
SET 
  booking_accept_cash = accept_cash,
  booking_accept_kaspi = accept_kaspi,
  booking_accept_freedom = accept_freedom;
