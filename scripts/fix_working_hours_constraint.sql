-- Add unique constraint to working_hours to ensure one schedule per day per cafe
-- And clean up duplicates if they exist

DO $$
BEGIN
    -- 1. Identify and keep only the latest entry for each (cafe_id, day_of_week)
    DELETE FROM public.working_hours a
    USING public.working_hours b
    WHERE a.id < b.id
      AND a.cafe_id = b.cafe_id
      AND a.day_of_week = b.day_of_week;

    -- 2. Add the unique constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'working_hours_cafe_id_day_of_week_key'
    ) THEN
        ALTER TABLE public.working_hours 
        ADD CONSTRAINT working_hours_cafe_id_day_of_week_key UNIQUE (cafe_id, day_of_week);
    END IF;
END $$;
