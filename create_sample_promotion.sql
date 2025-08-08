-- Create sample promotion for BOTOX25 promo code
INSERT INTO promotions (
  id,
  title,
  description,
  start_date,
  end_date,
  is_active,
  promo_code,
  savings_type,
  savings_amount,
  savings_max_amount,
  business_id,
  service_id,
  created_at
) VALUES (
  '0b3f35c0-40ea-4599-8f83-8dbe62966b00',
  'Botox Special Offer',
  'Get 25% off all Botox treatments - limited time offer!',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  true,
  'BOTOX25',
  'percentage',
  25,
  100,
  (SELECT id FROM business_profiles WHERE business_name ILIKE '%aesthetic%' OR business_name ILIKE '%med%' OR business_name ILIKE '%spa%' LIMIT 1),
  (SELECT id FROM services WHERE name ILIKE '%botox%' LIMIT 1),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  promo_code = EXCLUDED.promo_code,
  savings_type = EXCLUDED.savings_type,
  savings_amount = EXCLUDED.savings_amount,
  savings_max_amount = EXCLUDED.savings_max_amount,
  is_active = EXCLUDED.is_active;

-- Alternative: Create a universal promotion that works for any business/service
INSERT INTO promotions (
  id,
  title,
  description,
  start_date,
  end_date,
  is_active,
  promo_code,
  savings_type,
  savings_amount,
  savings_max_amount,
  business_id,
  service_id,
  created_at
) VALUES (
  '0b3f35c0-40ea-4599-8f83-8dbe62966b01',
  'Welcome Discount',
  'Special 25% discount for new customers',
  CURRENT_DATE - INTERVAL '1 day',
  CURRENT_DATE + INTERVAL '30 days',
  true,
  'BOTOX25',
  'percentage',
  25,
  100,
  NULL, -- NULL means applies to any business
  NULL, -- NULL means applies to any service
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  promo_code = EXCLUDED.promo_code,
  savings_type = EXCLUDED.savings_type,
  savings_amount = EXCLUDED.savings_amount,
  savings_max_amount = EXCLUDED.savings_max_amount,
  is_active = EXCLUDED.is_active;
