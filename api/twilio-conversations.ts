import { NextApiRequest, NextApiResponse } from 'next';
import twilio from 'twilio';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    const { action, conversationSid, participantIdentity, message, bookingId, userRole, userName, participants } = req.body;

    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const conversationsServiceSid = process.env.VITE_TWILIO_CONVERSATIONS_SERVICE_SID;

    if (!accountSid || !authToken || !conversationsServiceSid) {
      return res.status(500).json({ error: 'Twilio credentials not configured' });
    }

    // Create Twilio client
    const client = twilio(accountSid, authToken);
    const conversationsService = client.conversations.v1.services(conversationsServiceSid);

    switch (action) {
      case 'create-conversation': {
        if (!bookingId || !participants || !Array.isArray(participants)) {
          return res.status(400).json({ error: 'Booking ID and participants array are required' });
        }

        // Create conversation with unique friendly name
        const conversationFriendlyName = `booking-${bookingId}-${Date.now()}`;
        
        const conversation = await conversationsService.conversations.create({
          friendlyName: conversationFriendlyName,
          attributes: JSON.stringify({
            bookingId,
            createdAt: new Date().toISOString(),
            type: 'booking-chat'
          })
        });

        // Add participants to the conversation
        const participantPromises = participants.map(async (participant: any) => {
          try {
            return await conversationsService.conversations(conversation.sid)
              .participants.create({
                identity: participant.identity,
                attributes: JSON.stringify({
                  role: participant.role,
                  name: participant.name,
                  userId: participant.userId
                })
              });
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

        return res.status(200).json({
          success: true,
          conversationSid: conversation.sid,
          friendlyName: conversation.friendlyName
        });
      }

      case 'send-message': {
        if (!conversationSid || !message || !participantIdentity) {
          return res.status(400).json({ error: 'Conversation SID, message, and participant identity are required' });
        }

        const messageResponse = await conversationsService.conversations(conversationSid)
          .messages.create({
            author: participantIdentity,
            body: message,
            attributes: JSON.stringify({
              userRole,
              userName,
              timestamp: new Date().toISOString()
            })
          });

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
        if (!participantIdentity) {
          return res.status(400).json({ error: 'Participant identity is required' });
        }

        // Get user's conversations
        const userConversations = await conversationsService.users(participantIdentity)
          .userConversations.list();

        const conversationsWithDetails = await Promise.all(
          userConversations.map(async (userConv) => {
            const conversation = await conversationsService.conversations(userConv.conversationSid).fetch();
            const lastMessage = await conversationsService.conversations(userConv.conversationSid)
              .messages.list({ limit: 1, order: 'desc' });

            return {
              sid: conversation.sid,
              friendlyName: conversation.friendlyName,
              attributes: conversation.attributes ? JSON.parse(conversation.attributes) : {},
              lastMessage: lastMessage.length > 0 ? {
                body: lastMessage[0].body,
                author: lastMessage[0].author,
                dateCreated: lastMessage[0].dateCreated
              } : null,
              unreadMessagesCount: userConv.unreadMessagesCount,
              lastReadMessageIndex: userConv.lastReadMessageIndex
            };
          })
        );

        return res.status(200).json({
          success: true,
          conversations: conversationsWithDetails
        });
      }

      case 'get-conversation-participants': {
        if (!conversationSid) {
          return res.status(400).json({ error: 'Conversation SID is required' });
        }

        const participants = await conversationsService.conversations(conversationSid)
          .participants.list();

        const formattedParticipants = participants.map(participant => ({
          sid: participant.sid,
          identity: participant.identity,
          attributes: participant.attributes ? JSON.parse(participant.attributes) : {}
        }));

        return res.status(200).json({
          success: true,
          participants: formattedParticipants
        });
      }

      case 'mark-as-read': {
        if (!conversationSid || !participantIdentity) {
          return res.status(400).json({ error: 'Conversation SID and participant identity are required' });
        }

        await conversationsService.conversations(conversationSid)
          .participants(participantIdentity)
          .update({
            lastReadMessageIndex: -1 // Mark all messages as read
          });

        return res.status(200).json({
          success: true
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
