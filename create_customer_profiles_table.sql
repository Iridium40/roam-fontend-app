-- Create customer_profiles table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.customer_profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  phone text NULL,
  date_of_birth date NULL,
  bio text NULL,
  image_url text NULL,
  is_active boolean NULL DEFAULT true,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT customer_profiles_pkey PRIMARY KEY (id),
  CONSTRAINT customer_profiles_user_id_key UNIQUE (user_id),
  CONSTRAINT customer_profiles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customer_profiles_user_id ON public.customer_profiles USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_customer_profiles_email ON public.customer_profiles USING btree (email);

-- Enable RLS
ALTER TABLE customer_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own customer profile" ON customer_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own customer profile" ON customer_profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own customer profile" ON customer_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to automatically create customer profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.customer_profiles (user_id, email, first_name, last_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'first_name', split_part(new.email, '@', 1)),
    COALESCE(new.raw_user_meta_data->>'last_name', '')
  );
  RETURN new;
END;
$$;

-- Create trigger to automatically create customer profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
