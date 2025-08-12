-- Add reschedule tracking fields to bookings table
-- This enables tracking of reschedule requests and history

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS rescheduled_at timestamp with time zone NULL,
ADD COLUMN IF NOT EXISTS rescheduled_by uuid NULL,
ADD COLUMN IF NOT EXISTS reschedule_reason text NULL,
ADD COLUMN IF NOT EXISTS original_booking_date date NULL,
ADD COLUMN IF NOT EXISTS original_start_time time without time zone NULL,
ADD COLUMN IF NOT EXISTS reschedule_count integer NOT NULL DEFAULT 0;

-- Add foreign key constraint for rescheduled_by
ALTER TABLE public.bookings 
ADD CONSTRAINT IF NOT EXISTS bookings_rescheduled_by_fkey 
FOREIGN KEY (rescheduled_by) REFERENCES customer_profiles (id);

-- Add index for reschedule tracking queries
CREATE INDEX IF NOT EXISTS idx_bookings_rescheduled_at 
ON public.bookings USING btree (rescheduled_at) 
TABLESPACE pg_default;

-- Add index for reschedule count queries
CREATE INDEX IF NOT EXISTS idx_bookings_reschedule_count 
ON public.bookings USING btree (reschedule_count) 
TABLESPACE pg_default;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.rescheduled_at IS 'Timestamp when the booking was last rescheduled';
COMMENT ON COLUMN public.bookings.rescheduled_by IS 'Customer who requested the reschedule';
COMMENT ON COLUMN public.bookings.reschedule_reason IS 'Reason provided by customer for rescheduling';
COMMENT ON COLUMN public.bookings.original_booking_date IS 'Original booking date before any reschedules';
COMMENT ON COLUMN public.bookings.original_start_time IS 'Original start time before any reschedules';
COMMENT ON COLUMN public.bookings.reschedule_count IS 'Number of times this booking has been rescheduled';
