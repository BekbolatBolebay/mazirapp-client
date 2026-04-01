-- Function to recalculate and update restaurant rating
CREATE OR REPLACE FUNCTION update_restaurant_rating()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the rating in the restaurants table
    UPDATE public.restaurants
    SET rating = (
        SELECT COALESCE(AVG(rating), 0)
        FROM public.reviews
        WHERE cafe_id = COALESCE(NEW.cafe_id, OLD.cafe_id)
    )
    WHERE id = COALESCE(NEW.cafe_id, OLD.cafe_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run the function after any change to the reviews table
DROP TRIGGER IF EXISTS tr_update_restaurant_rating ON public.reviews;
CREATE TRIGGER tr_update_restaurant_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION update_restaurant_rating();

-- Initial sync: Update all restaurant ratings based on current reviews
UPDATE public.restaurants r
SET rating = (
    SELECT COALESCE(AVG(rating), 0)
    FROM public.reviews rev
    WHERE rev.cafe_id = r.id
);
