-- Create business_hours table for storing business operating hours
CREATE TABLE IF NOT EXISTS public.business_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday, 1=Monday, etc.
    is_open BOOLEAN NOT NULL DEFAULT true,
    open_time TIME,
    close_time TIME,
    is_24_hours BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(business_id, day_of_week)
);

-- Add RLS policies
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;

-- Policy for public viewing of business hours
CREATE POLICY "Anyone can view business hours"
ON public.business_hours
FOR SELECT
TO public
USING (true);

-- Policy for business owners to manage their hours
CREATE POLICY "Business owners can manage their hours"
ON public.business_hours
FOR ALL
TO authenticated
USING (
    business_id IN (
        SELECT id FROM public.business_profiles 
        WHERE owner_id = auth.uid()
    )
)
WITH CHECK (
    business_id IN (
        SELECT id FROM public.business_profiles 
        WHERE owner_id = auth.uid()
    )
);

-- Create index for faster lookups
CREATE INDEX idx_business_hours_business_id ON public.business_hours(business_id);
CREATE INDEX idx_business_hours_day_of_week ON public.business_hours(day_of_week);

-- Insert sample business hours for existing businesses
INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
SELECT 
    bp.id,
    generate_series(1, 5) as day_of_week, -- Monday to Friday
    true,
    '09:00'::time,
    '17:00'::time
FROM public.business_profiles bp
WHERE bp.is_active = true
ON CONFLICT (business_id, day_of_week) DO NOTHING;

-- Insert weekend hours (closed or different hours)
INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
SELECT 
    bp.id,
    0 as day_of_week, -- Sunday
    false,
    null,
    null
FROM public.business_profiles bp
WHERE bp.is_active = true
ON CONFLICT (business_id, day_of_week) DO NOTHING;

INSERT INTO public.business_hours (business_id, day_of_week, is_open, open_time, close_time)
SELECT 
    bp.id,
    6 as day_of_week, -- Saturday
    true,
    '10:00'::time,
    '16:00'::time
FROM public.business_profiles bp
WHERE bp.is_active = true
ON CONFLICT (business_id, day_of_week) DO NOTHING;

-- Function to get formatted business hours
CREATE OR REPLACE FUNCTION public.get_business_hours_formatted(business_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
    hours_json JSON;
BEGIN
    SELECT json_agg(
        json_build_object(
            'day_of_week', day_of_week,
            'day_name', CASE day_of_week
                WHEN 0 THEN 'Sunday'
                WHEN 1 THEN 'Monday'
                WHEN 2 THEN 'Tuesday'
                WHEN 3 THEN 'Wednesday'
                WHEN 4 THEN 'Thursday'
                WHEN 5 THEN 'Friday'
                WHEN 6 THEN 'Saturday'
            END,
            'is_open', is_open,
            'open_time', CASE WHEN is_open THEN open_time::text ELSE null END,
            'close_time', CASE WHEN is_open THEN close_time::text ELSE null END,
            'is_24_hours', is_24_hours
        ) ORDER BY day_of_week
    ) INTO hours_json
    FROM public.business_hours
    WHERE business_id = business_id_param;
    
    RETURN COALESCE(hours_json, '[]'::json);
END;
$$;
