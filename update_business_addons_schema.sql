-- Drop the old table if it exists with different structure
DROP TABLE IF EXISTS public.business_addons CASCADE;

-- Create business_addons table with exact schema provided
CREATE TABLE public.business_addons (
  id uuid not null default gen_random_uuid (),
  business_id uuid not null,
  addon_id uuid not null,
  custom_price numeric(10, 2) null,
  is_available boolean null default true,
  created_at timestamp without time zone null default now(),
  constraint business_addon_pricing_pkey primary key (id),
  constraint business_addon_pricing_business_id_addon_id_key unique (business_id, addon_id),
  constraint business_addon_pricing_addon_id_fkey foreign KEY (addon_id) references service_addons (id) on delete CASCADE,
  constraint business_addon_pricing_business_id_fkey foreign KEY (business_id) references business_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_business_addons_business_id ON public.business_addons USING btree (business_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_business_addons_addon_id ON public.business_addons USING btree (addon_id) TABLESPACE pg_default;

-- Trigger to ensure addon is eligible for business services
CREATE OR REPLACE FUNCTION validate_business_addon_eligibility()
RETURNS trigger AS $$
BEGIN
  -- Check if the addon is eligible for at least one service offered by this business
  IF NOT EXISTS (
    SELECT 1 
    FROM business_services bs
    JOIN service_addon_eligibility sae ON bs.service_id = sae.service_id
    WHERE bs.business_id = NEW.business_id 
    AND sae.addon_id = NEW.addon_id
    AND bs.is_active = true
  ) THEN
    RAISE EXCEPTION 'Addon is not eligible for any services offered by this business';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_business_addon_eligibility_trigger
  BEFORE INSERT OR UPDATE ON business_addons
  FOR EACH ROW EXECUTE FUNCTION validate_business_addon_eligibility();
