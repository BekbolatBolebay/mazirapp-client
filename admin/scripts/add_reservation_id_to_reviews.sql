-- Add reservation_id to reviews table to support ratings for bookings
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reservation_id UUID REFERENCES reservations(id);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_reviews_reservation_id ON reviews(reservation_id);
