-- Optional database tables for messaging system metadata and notifications
-- These tables are not required for basic Twilio Conversations functionality
-- but provide better integration and analytics capabilities

-- Conversation metadata table (optional but recommended)
CREATE TABLE public.conversation_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  twilio_conversation_sid TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITHOUT TIME ZONE,
  participant_count INTEGER DEFAULT 2,
  is_active BOOLEAN DEFAULT TRUE,
  conversation_type TEXT DEFAULT 'booking_chat' CHECK (conversation_type IN ('booking_chat', 'support_chat', 'general')),
  CONSTRAINT conversation_metadata_pkey PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX idx_conversation_metadata_booking_id ON public.conversation_metadata(booking_id);
CREATE INDEX idx_conversation_metadata_twilio_sid ON public.conversation_metadata(twilio_conversation_sid);
CREATE INDEX idx_conversation_metadata_created_at ON public.conversation_metadata(created_at);
CREATE INDEX idx_conversation_metadata_last_message_at ON public.conversation_metadata(last_message_at);

-- Conversation participants table (optional)
CREATE TABLE public.conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversation_metadata(id) ON DELETE CASCADE,
  user_id UUID, -- Can be provider_id or customer_id
  user_type TEXT NOT NULL CHECK (user_type IN ('provider', 'customer', 'owner', 'dispatcher')),
  twilio_participant_sid TEXT NOT NULL,
  joined_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  left_at TIMESTAMP WITHOUT TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  last_read_at TIMESTAMP WITHOUT TIME ZONE,
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX idx_conversation_participants_conversation_id ON public.conversation_participants(conversation_id);
CREATE INDEX idx_conversation_participants_user_id ON public.conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_user_type ON public.conversation_participants(user_type);
CREATE INDEX idx_conversation_participants_twilio_sid ON public.conversation_participants(twilio_participant_sid);

-- Message notifications table (optional)
CREATE TABLE public.message_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversation_metadata(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  message_sid TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITHOUT TIME ZONE,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  notification_type TEXT DEFAULT 'message' CHECK (notification_type IN ('message', 'mention', 'system')),
  CONSTRAINT message_notifications_pkey PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX idx_message_notifications_conversation_id ON public.message_notifications(conversation_id);
CREATE INDEX idx_message_notifications_user_id ON public.message_notifications(user_id);
CREATE INDEX idx_message_notifications_is_read ON public.message_notifications(is_read);
CREATE INDEX idx_message_notifications_created_at ON public.message_notifications(created_at);

-- Message analytics table (optional - for reporting and insights)
CREATE TABLE public.message_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversation_metadata(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  message_count INTEGER DEFAULT 0,
  participant_count INTEGER DEFAULT 0,
  first_message_at TIMESTAMP WITHOUT TIME ZONE,
  last_message_at TIMESTAMP WITHOUT TIME ZONE,
  average_response_time_minutes DECIMAL(10,2),
  total_conversation_duration_minutes INTEGER,
  created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW(),
  CONSTRAINT message_analytics_pkey PRIMARY KEY (id)
);

-- Add indexes for better performance
CREATE INDEX idx_message_analytics_conversation_id ON public.message_analytics(conversation_id);
CREATE INDEX idx_message_analytics_booking_id ON public.message_analytics(booking_id);
CREATE INDEX idx_message_analytics_created_at ON public.message_analytics(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE public.conversation_metadata ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_analytics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for conversation_metadata
CREATE POLICY "Users can view conversations for their bookings" ON public.conversation_metadata
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE customer_id = auth.uid() 
      OR provider_id IN (
        SELECT id FROM providers WHERE user_id = auth.uid()
      )
      OR business_id IN (
        SELECT business_id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Business users can insert conversations" ON public.conversation_metadata
  FOR INSERT WITH CHECK (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE business_id IN (
        SELECT business_id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policies for conversation_participants
CREATE POLICY "Users can view participants for their conversations" ON public.conversation_participants
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversation_metadata 
      WHERE booking_id IN (
        SELECT id FROM bookings 
        WHERE customer_id = auth.uid() 
        OR provider_id IN (
          SELECT id FROM providers WHERE user_id = auth.uid()
        )
        OR business_id IN (
          SELECT business_id FROM providers WHERE user_id = auth.uid()
        )
      )
    )
  );

-- RLS Policies for message_notifications
CREATE POLICY "Users can view their own notifications" ON public.message_notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON public.message_notifications
  FOR UPDATE USING (user_id = auth.uid());

-- RLS Policies for message_analytics
CREATE POLICY "Business users can view analytics for their bookings" ON public.message_analytics
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM bookings 
      WHERE business_id IN (
        SELECT business_id FROM providers WHERE user_id = auth.uid()
      )
    )
  );

-- Add comments for documentation
COMMENT ON TABLE public.conversation_metadata IS 'Stores metadata about Twilio Conversations for bookings';
COMMENT ON TABLE public.conversation_participants IS 'Tracks participants in Twilio Conversations';
COMMENT ON TABLE public.message_notifications IS 'Stores message notifications for users';
COMMENT ON TABLE public.message_analytics IS 'Stores analytics data for messaging conversations';

COMMENT ON COLUMN public.conversation_metadata.booking_id IS 'Reference to the booking this conversation is for';
COMMENT ON COLUMN public.conversation_metadata.twilio_conversation_sid IS 'Twilio Conversations service conversation SID';
COMMENT ON COLUMN public.conversation_participants.user_type IS 'Type of user: provider, customer, owner, or dispatcher';
COMMENT ON COLUMN public.conversation_participants.twilio_participant_sid IS 'Twilio Conversations participant SID';
COMMENT ON COLUMN public.message_notifications.message_sid IS 'Twilio Conversations message SID';
COMMENT ON COLUMN public.message_analytics.average_response_time_minutes IS 'Average time between messages in minutes';
