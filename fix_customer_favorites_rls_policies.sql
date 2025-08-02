-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own favorite services" ON customer_favorite_services;
DROP POLICY IF EXISTS "Users can insert their own favorite services" ON customer_favorite_services;
DROP POLICY IF EXISTS "Users can delete their own favorite services" ON customer_favorite_services;

DROP POLICY IF EXISTS "Users can view their own favorite businesses" ON customer_favorite_businesses;
DROP POLICY IF EXISTS "Users can insert their own favorite businesses" ON customer_favorite_businesses;
DROP POLICY IF EXISTS "Users can delete their own favorite businesses" ON customer_favorite_businesses;

DROP POLICY IF EXISTS "Users can view their own favorite providers" ON customer_favorite_providers;
DROP POLICY IF EXISTS "Users can insert their own favorite providers" ON customer_favorite_providers;
DROP POLICY IF EXISTS "Users can delete their own favorite providers" ON customer_favorite_providers;

-- Create new policies with direct customer_id to auth.uid() relationship
-- Policies for customer_favorite_services
CREATE POLICY "Users can view their own favorite services" ON customer_favorite_services
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own favorite services" ON customer_favorite_services
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own favorite services" ON customer_favorite_services
    FOR DELETE USING (auth.uid() = customer_id);

-- Policies for customer_favorite_businesses
CREATE POLICY "Users can view their own favorite businesses" ON customer_favorite_businesses
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own favorite businesses" ON customer_favorite_businesses
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own favorite businesses" ON customer_favorite_businesses
    FOR DELETE USING (auth.uid() = customer_id);

-- Policies for customer_favorite_providers
CREATE POLICY "Users can view their own favorite providers" ON customer_favorite_providers
    FOR SELECT USING (auth.uid() = customer_id);

CREATE POLICY "Users can insert their own favorite providers" ON customer_favorite_providers
    FOR INSERT WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Users can delete their own favorite providers" ON customer_favorite_providers
    FOR DELETE USING (auth.uid() = customer_id);
