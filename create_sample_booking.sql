-- First, let's check if the customer exists
SELECT * FROM customers WHERE email = 'customer@roamyourbestlife.com';

-- If customer doesn't exist, create one (replace 'user-uuid' with actual user UUID)
-- INSERT INTO customers (
--   user_id, 
--   first_name, 
--   last_name, 
--   email, 
--   phone,
--   is_active
-- ) VALUES (
--   'user-uuid-here',
--   'Test',
--   'Customer', 
--   'customer@roamyourbestlife.com',
--   '+1234567890',
--   true
-- );

-- Check if we have services
SELECT id, name FROM services LIMIT 5;

-- Check if we have providers  
SELECT id, first_name, last_name FROM providers LIMIT 5;

-- Sample booking query (commented out - need actual IDs)
-- INSERT INTO bookings (
--   customer_id,
--   provider_id,
--   service_id,
--   booking_date,
--   start_time,
--   total_amount,
--   delivery_type,
--   booking_status,
--   payment_status,
--   guest_name,
--   guest_email
-- ) VALUES (
--   (SELECT id FROM customers WHERE email = 'customer@roamyourbestlife.com'),
--   (SELECT id FROM providers LIMIT 1),
--   (SELECT id FROM services LIMIT 1),
--   '2024-12-30',
--   '14:00:00',
--   120.00,
--   'mobile',
--   'confirmed',
--   'paid',
--   'Test Customer',
--   'customer@roamyourbestlife.com'
-- );

-- Check all bookings
SELECT * FROM bookings WHERE guest_email = 'customer@roamyourbestlife.com' OR customer_id IN (SELECT id FROM customers WHERE email = 'customer@roamyourbestlife.com');
