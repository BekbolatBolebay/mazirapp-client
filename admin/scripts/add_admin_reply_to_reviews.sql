-- Add admin_reply to reviews table to allow restaurants to respond to customer feedback
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS admin_reply TEXT;

-- Add index for consistency
CREATE INDEX IF NOT EXISTS idx_reviews_cafe_id ON reviews(cafe_id);
