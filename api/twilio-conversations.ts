import type { VercelRequest, VercelResponse } from "@vercel/node";
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

console.log('Supabase configuration:', {
  hasUrl: !!supabaseUrl,
  hasServiceKey: !!supabaseServiceKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseServiceKey?.length
});

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!req.body) {
    return res.status(400).json({ error: 'Request body is required' });
  }

  try {
    console.log('Twilio Conversations API called with action:', req.body?.action);
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { action, conversationSid, participantIdentity, message, bookingId, userRole, userName, participants, userId, userType } = req.body;

    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const conversationsServiceSid = process.env.VITE_TWILIO_CONVERSATIONS_SERVICE_SID;

    console.log('Environment variables check:', {
      hasAccountSid: !!accountSid,
      hasAuthToken: !!authToken,
      hasServiceSid: !!conversationsServiceSid,
      accountSidLength: accountSid?.length,
      authTokenLength: authToken?.length,
      serviceSidLength: conversationsServiceSid?.length
    });

    if (!accountSid || !authToken || !conversationsServiceSid) {
      console.error('Missing Twilio credentials:', {
        accountSid: !!accountSid,
        authToken: !!authToken,
        conversationsServiceSid: !!conversationsServiceSid
      });
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    // Create Twilio client
    const client = twilio(accountSid, authToken);
    const conversationsService = client.conversations.v1.services(conversationsServiceSid);

    switch (action) {
      case 'create-conversation': {
        console.log('Creating conversation for booking:', bookingId);
        console.log('Participants:', participants);
        
        if (!bookingId || !participants || !Array.isArray(participants)) {
          console.error('Invalid request data:', { bookingId, participants, isArray: Array.isArray(participants) });
          return res.status(400).json({ error: 'Booking ID and participants array are required' });
        }

        // Create conversation with unique friendly name
        const conversationFriendlyName = `booking-${bookingId}-${Date.now()}`;
        console.log('Creating conversation with friendly name:', conversationFriendlyName);
        
        let conversation;
        try {
          conversation = await conversationsService.conversations.create({
            friendlyName: conversationFriendlyName,
            attributes: JSON.stringify({
              bookingId,
              createdAt: new Date().toISOString(),
              type: 'booking-chat'
            })
          });
          console.log('Twilio conversation created:', conversation.sid);
        } catch (error: any) {
          console.error('Error creating Twilio conversation:', error);
          return res.status(500).json({ 
            error: 'Failed to create conversation',
            details: error.message || 'Unknown error'
          });
        }

        // Store conversation in Supabase
        try {
          const { error: dbError } = await supabase
            .from('conversations')
            .insert({
              id: conversation.sid,
              booking_id: bookingId,
              friendly_name: conversationFriendlyName,
              status: 'active',
              created_at: new Date().toISOString()
            });

          if (dbError) {
            console.error('Error storing conversation in database:', dbError);
            // Don't fail the request, but log the error
          }
        } catch (dbError) {
          console.error('Error storing conversation in database:', dbError);
        }

        // Add participants to the conversation
        const participantPromises = participants.map(async (participant: any) => {
          try {
            const twilioParticipant = await conversationsService.conversations(conversation.sid)
              .participants.create({
                identity: participant.identity,
                attributes: JSON.stringify({
                  role: participant.role,
                  name: participant.name,
                  userId: participant.userId,
                  userType: participant.userType
                })
              });

            // Store participant in Supabase
            try {
              const { error: participantDbError } = await supabase
                .from('conversation_participants')
                .insert({
                  conversation_id: conversation.sid,
                  user_id: participant.userId, // auth.users.id
                  user_type: participant.userType, // 'provider' or 'customer'
                  participant_sid: twilioParticipant.sid,
                  created_at: new Date().toISOString()
                });

              if (participantDbError) {
                console.error('Error storing participant in database:', participantDbError);
              }
            } catch (participantDbError) {
              console.error('Error storing participant in database:', participantDbError);
            }

            return twilioParticipant;
          } catch (error: any) {
            // If participant already exists, that's okay
            if (error.code === 50433) {
              console.log(`Participant ${participant.identity} already exists in conversation`);
              return null;
            }
            throw error;
          }
        });

        await Promise.all(participantPromises);

        console.log('Conversation created successfully:', {
          sid: conversation.sid,
          friendlyName: conversation.friendlyName
        });

        return res.status(200).json({
          success: true,
          conversationSid: conversation.sid,
          friendlyName: conversation.friendlyName
        });
      }

      case 'send-message': {
        if (!conversationSid || !message || !participantIdentity || !userId) {
          return res.status(400).json({ error: 'Conversation SID, message, participant identity, and user ID are required' });
        }

        const messageResponse = await conversationsService.conversations(conversationSid)
          .messages.create({
            author: participantIdentity,
            body: message,
            attributes: JSON.stringify({
              userRole,
              userName,
              userId,
              timestamp: new Date().toISOString()
            })
          });

        // Store message notification in Supabase
        try {
          console.log('Storing message notification for conversation:', conversationSid, 'user:', userId, 'message:', messageResponse.sid);
          
          const { error: notificationError } = await supabase
            .from('message_notifications')
            .insert({
              conversation_id: conversationSid,
              user_id: userId, // auth.users.id
              message_id: messageResponse.sid,
              is_read: false,
              created_at: new Date().toISOString()
            });

          if (notificationError) {
            console.error('Error storing message notification:', notificationError);
          } else {
            console.log('Successfully stored message notification');
          }
        } catch (notificationError) {
          console.error('Error storing message notification:', notificationError);
        }

        return res.status(200).json({
          success: true,
          messageSid: messageResponse.sid,
          conversationSid: messageResponse.conversationSid,
          author: messageResponse.author,
          body: messageResponse.body,
          dateCreated: messageResponse.dateCreated
        });
      }

      case 'get-messages': {
        if (!conversationSid) {
          return res.status(400).json({ error: 'Conversation SID is required' });
        }

        const messages = await conversationsService.conversations(conversationSid)
          .messages.list({ limit: 100, order: 'asc' });

        const formattedMessages = messages.map(msg => ({
          sid: msg.sid,
          author: msg.author,
          body: msg.body,
          dateCreated: msg.dateCreated,
          attributes: msg.attributes ? JSON.parse(msg.attributes) : {}
        }));

        return res.status(200).json({
          success: true,
          messages: formattedMessages
        });
      }

      case 'get-conversations': {
        if (!userId) {
          return res.status(400).json({ error: 'User ID is required' });
        }

        // Get user's conversations from Supabase
        const { data: userConversations, error: dbError } = await supabase
          .from('conversation_participants')
          .select(`
            conversation_id,
            user_type
          `)
          .eq('user_id', userId);

        if (dbError) {
          console.error('Error fetching user conversations from database:', dbError);
          return res.status(500).json({ error: 'Failed to fetch conversations', details: dbError.message });
        }

        console.log('Found user conversations:', userConversations?.length || 0, 'conversations for user:', userId);

        // Get additional details from Twilio for each conversation
        const conversationsWithDetails = await Promise.all(
          userConversations.map(async (userConv) => {
            try {
              const conversation = await conversationsService.conversations(userConv.conversation_id).fetch();
              const lastMessage = await conversationsService.conversations(userConv.conversation_id)
                .messages.list({ limit: 1, order: 'desc' });

              // Get unread count from Supabase
              const { count: unreadCount } = await supabase
                .from('message_notifications')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', userConv.conversation_id)
                .eq('user_id', userId)
                .eq('is_read', false);

              return {
                sid: conversation.sid,
                friendlyName: conversation.friendlyName,
                attributes: conversation.attributes ? JSON.parse(conversation.attributes) : {},
                lastMessage: lastMessage.length > 0 ? {
                  body: lastMessage[0].body,
                  author: lastMessage[0].author,
                  dateCreated: lastMessage[0].dateCreated
                } : null,
                unreadMessagesCount: unreadCount || 0,
                userType: userConv.user_type
              };
            } catch (error) {
              console.error('Error fetching conversation details for conversation_id:', userConv.conversation_id, error);
              return null;
            }
          })
        );

        // Filter out null results
        const validConversations = conversationsWithDetails.filter(conv => conv !== null);

        console.log('Returning valid conversations:', validConversations.length);

        return res.status(200).json({
          success: true,
          conversations: validConversations
        });
      }

      case 'get-conversation-participants': {
        if (!conversationSid) {
          return res.status(400).json({ error: 'Conversation SID is required' });
        }

        // Get participants from Supabase with user details
        const { data: participants, error: dbError } = await supabase
          .from('conversation_participants')
          .select(`
            participant_sid,
            user_id,
            user_type,
            created_at,
            auth_users!inner (
              id,
              email
            ),
            providers!left (
              first_name,
              last_name,
              image_url
            ),
            customer_profiles!left (
              first_name,
              last_name,
              image_url
            )
          `)
          .eq('conversation_id', conversationSid);

        if (dbError) {
          console.error('Error fetching participants from database:', dbError);
          return res.status(500).json({ error: 'Failed to fetch participants' });
        }

        const formattedParticipants = participants.map(participant => {
          const userDetails = participant.user_type === 'provider' 
            ? participant.providers 
            : participant.customer_profiles;

          return {
            sid: participant.participant_sid,
            identity: `${participant.user_type}-${participant.user_id}`,
            userId: participant.user_id,
            userType: participant.user_type,
            attributes: {
              role: participant.user_type,
              name: userDetails ? `${userDetails.first_name} ${userDetails.last_name}` : 'Unknown',
              imageUrl: userDetails?.image_url,
              email: participant.auth_users.email
            }
          };
        });

        return res.status(200).json({
          success: true,
          participants: formattedParticipants
        });
      }

      case 'mark-as-read': {
        if (!conversationSid || !userId) {
          return res.status(400).json({ error: 'Conversation SID and user ID are required' });
        }

        console.log('Marking messages as read for conversation:', conversationSid, 'user:', userId);

        try {
          // First check if there are any unread messages to mark
          const { data: unreadMessages, error: checkError } = await supabase
            .from('message_notifications')
            .select('id')
            .eq('conversation_id', conversationSid)
            .eq('user_id', userId)
            .eq('is_read', false);

          if (checkError) {
            console.error('Error checking unread messages:', checkError);
            // Don't fail the request, just log the error
          }

          console.log('Found unread messages:', unreadMessages?.length || 0);

          // Only try to update if there are unread messages
          if (unreadMessages && unreadMessages.length > 0) {
            const { error: updateError } = await supabase
              .from('message_notifications')
              .update({ is_read: true })
              .eq('conversation_id', conversationSid)
              .eq('user_id', userId)
              .eq('is_read', false);

            if (updateError) {
              console.error('Error marking messages as read:', updateError);
              // Don't fail the request, just log the error
            } else {
              console.log('Successfully marked', unreadMessages.length, 'messages as read');
            }
          } else {
            console.log('No unread messages to mark as read');
          }

          return res.status(200).json({
            success: true,
            message: 'Messages marked as read successfully'
          });
        } catch (error) {
          console.error('Error in mark-as-read operation:', error);
          // Don't fail the request, just return success
          return res.status(200).json({
            success: true,
            message: 'Operation completed (some errors may have occurred)'
          });
        }
      }

      case 'add-participant': {
        if (!conversationSid || !userId || !userType) {
          return res.status(400).json({ error: 'Conversation SID, user ID, and user type are required' });
        }

        // Get user details based on type
        let userDetails;
        if (userType === 'provider') {
          const { data } = await supabase
            .from('providers')
            .select('first_name, last_name, image_url')
            .eq('user_id', userId)
            .single();
          userDetails = data;
        } else {
          const { data } = await supabase
            .from('customer_profiles')
            .select('first_name, last_name, image_url')
            .eq('user_id', userId)
            .single();
          userDetails = data;
        }

        if (!userDetails) {
          return res.status(404).json({ error: 'User not found' });
        }

        const identity = `${userType}-${userId}`;
        const participantName = `${userDetails.first_name} ${userDetails.last_name}`;

        // Add participant to Twilio conversation
        const participant = await conversationsService.conversations(conversationSid)
          .participants.create({
            identity,
            attributes: JSON.stringify({
              role: userType,
              name: participantName,
              userId,
              userType
            })
          });

        // Store participant in Supabase
        const { error: dbError } = await supabase
          .from('conversation_participants')
          .insert({
            conversation_id: conversationSid,
            user_id: userId,
            user_type: userType,
            participant_sid: participant.sid,
            created_at: new Date().toISOString()
          });

        if (dbError) {
          console.error('Error storing participant in database:', dbError);
          return res.status(500).json({ error: 'Failed to store participant' });
        }

        return res.status(200).json({
          success: true,
          participantSid: participant.sid,
          identity,
          name: participantName
        });
      }

      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error: any) {
    console.error('Twilio Conversations API error:', error);
    return res.status(500).json({ 
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
