-- Add decline_reason column to bookings table
-- This column will store the reason when a provider declines a booking

ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS decline_reason TEXT;

-- Add a comment to the column for documentation
COMMENT ON COLUMN bookings.decline_reason IS 'Text field to store the reason when a provider/owner/dispatcher declines a booking. This message is visible to the customer.';

-- Optional: Create an index for faster queries if needed in the future
-- CREATE INDEX IF NOT EXISTS idx_bookings_decline_reason ON bookings(decline_reason) WHERE decline_reason IS NOT NULL;

-- Update any existing declined bookings to have a default reason (optional)
-- UPDATE bookings 
-- SET decline_reason = 'Booking was declined by provider'
-- WHERE booking_status = 'declined' AND decline_reason IS NULL;
