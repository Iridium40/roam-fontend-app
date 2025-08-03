-- Updated function to check if a customer has at least one location
-- Uses direct auth.uid() since customer_locations.customer_id references auth.users(id)
CREATE OR REPLACE FUNCTION public.customer_has_location()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
    has_location BOOLEAN;
BEGIN
    -- Check if customer has at least one location using auth.uid() directly
    SELECT EXISTS (
        SELECT 1 
        FROM public.customer_locations 
        WHERE customer_id = auth.uid()
        AND is_active = true
    ) INTO has_location;
    
    RETURN COALESCE(has_location, FALSE);
END;
$$;

-- Updated function to ensure a customer has a default location
-- Corrected to match actual schema: street_address, unit_number, is_primary, location_name, etc.
CREATE OR REPLACE FUNCTION public.ensure_customer_default_location()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    location_id_var UUID;
    user_id_var UUID;
    user_meta JSONB;
    user_email TEXT;
BEGIN
    -- Get the current user's ID
    user_id_var := auth.uid();
    
    IF user_id_var IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Check if customer already has a location
    SELECT id INTO location_id_var 
    FROM public.customer_locations 
    WHERE customer_id = user_id_var
    AND is_active = true
    ORDER BY is_primary DESC, created_at DESC
    LIMIT 1;
    
    -- If location exists, return its ID
    IF location_id_var IS NOT NULL THEN
        RETURN location_id_var;
    END IF;
    
    -- Get user email for default location name
    SELECT email INTO user_email
    FROM auth.users
    WHERE id = user_id_var;
    
    -- Create a default location with minimal required info
    INSERT INTO public.customer_locations (
        customer_id,
        location_name,
        street_address,
        unit_number,
        city,
        state,
        zip_code,
        location_type,
        is_primary,
        is_active,
        access_instructions,
        created_at
    ) VALUES (
        user_id_var,
        'Default Location',
        'Please update your address',
        '',
        'Orlando',
        'FL',
        '32801',
        'Home',
        TRUE,
        TRUE,
        'Please update this location with your actual address',
        NOW()
    )
    RETURNING id INTO location_id_var;
    
    RETURN location_id_var;
END;
$$;

-- Updated SQL query to check customer locations using direct auth.uid()
SELECT 
    auth.uid() AS customer_id,
    u.email,
    CASE 
        WHEN COUNT(cl.id) > 0 THEN TRUE
        ELSE FALSE
    END AS has_location,
    COUNT(cl.id) AS location_count,
    MAX(cl.location_name) AS latest_location_name
FROM 
    auth.users u
LEFT JOIN 
    public.customer_locations cl ON u.id = cl.customer_id AND cl.is_active = true
WHERE 
    u.id = auth.uid()
GROUP BY 
    u.id, u.email;
