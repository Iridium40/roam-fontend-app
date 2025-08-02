-- Drop existing foreign key constraints that reference customer_profiles
ALTER TABLE customer_favorite_services DROP CONSTRAINT IF EXISTS customer_favorite_services_customer_id_fkey;
ALTER TABLE customer_favorite_businesses DROP CONSTRAINT IF EXISTS customer_favorite_businesses_customer_id_fkey;
ALTER TABLE customer_favorite_providers DROP CONSTRAINT IF EXISTS customer_favorite_providers_customer_id_fkey;

-- Add new foreign key constraints that reference auth.users directly
ALTER TABLE customer_favorite_services 
ADD CONSTRAINT customer_favorite_services_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE customer_favorite_businesses 
ADD CONSTRAINT customer_favorite_businesses_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE;

ALTER TABLE customer_favorite_providers 
ADD CONSTRAINT customer_favorite_providers_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES auth.users (id) ON DELETE CASCADE;
