-- Enable RLS on customer favorites tables
ALTER TABLE customer_favorite_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorite_businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_favorite_providers ENABLE ROW LEVEL SECURITY;

-- Policies for customer_favorite_services
CREATE POLICY "Users can view their own favorite services" ON customer_favorite_services
    FOR SELECT USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can insert their own favorite services" ON customer_favorite_services
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can delete their own favorite services" ON customer_favorite_services
    FOR DELETE USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

-- Policies for customer_favorite_businesses
CREATE POLICY "Users can view their own favorite businesses" ON customer_favorite_businesses
    FOR SELECT USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can insert their own favorite businesses" ON customer_favorite_businesses
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can delete their own favorite businesses" ON customer_favorite_businesses
    FOR DELETE USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

-- Policies for customer_favorite_providers
CREATE POLICY "Users can view their own favorite providers" ON customer_favorite_providers
    FOR SELECT USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can insert their own favorite providers" ON customer_favorite_providers
    FOR INSERT WITH CHECK (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));

CREATE POLICY "Users can delete their own favorite providers" ON customer_favorite_providers
    FOR DELETE USING (auth.uid()::text = (SELECT user_id::text FROM customer_profiles WHERE id = customer_id));
