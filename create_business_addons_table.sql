-- Business Addons Table: Where businesses choose which addons to offer and set prices
create table public.business_addons (
  id uuid not null default gen_random_uuid (),
  business_id uuid not null,
  addon_id uuid not null,
  business_price numeric(10, 2) not null,
  is_available boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint business_addons_pkey primary key (id),
  constraint business_addons_unique unique (business_id, addon_id),
  constraint business_addons_business_fkey foreign KEY (business_id) references business_profiles (id) on delete CASCADE,
  constraint business_addons_addon_fkey foreign KEY (addon_id) references service_addons (id) on delete CASCADE
) TABLESPACE pg_default;

-- Indexes for performance
create index IF not exists idx_business_addons_business_id on public.business_addons using btree (business_id) TABLESPACE pg_default;
create index IF not exists idx_business_addons_addon_id on public.business_addons using btree (addon_id) TABLESPACE pg_default;

-- Trigger to ensure addon is eligible for business services
create or replace function validate_business_addon_eligibility()
returns trigger as $$
begin
  -- Check if the addon is eligible for at least one service offered by this business
  if not exists (
    select 1 
    from business_services bs
    join service_addon_eligibility sae on bs.service_id = sae.service_id
    where bs.business_id = NEW.business_id 
    and sae.addon_id = NEW.addon_id
    and bs.is_active = true
  ) then
    raise exception 'Addon is not eligible for any services offered by this business';
  end if;
  
  return NEW;
end;
$$ language plpgsql;

create trigger validate_business_addon_eligibility_trigger
  before insert or update on business_addons
  for each row execute function validate_business_addon_eligibility();
