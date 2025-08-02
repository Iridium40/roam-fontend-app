import { Handler } from "@netlify/functions";

const handler: Handler = async (event, context) => {
  // CORS headers
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  // Handle preflight requests
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers,
      body: "",
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "Request body is required" }),
    };
  }

  try {
    const { action, conversationSid, participantIdentity, message, bookingId, userRole, userName, participants } = JSON.parse(event.body);

    const accountSid = process.env.VITE_TWILIO_ACCOUNT_SID;
    const authToken = process.env.VITE_TWILIO_AUTH_TOKEN;
    const conversationsServiceSid = process.env.VITE_TWILIO_CONVERSATIONS_SERVICE_SID;

    if (!accountSid || !authToken || !conversationsServiceSid) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: "Twilio credentials not configured" }),
      };
    }

    // Create Twilio client
    const client = require("twilio")(accountSid, authToken);
    const conversationsService = client.conversations.v1.services(conversationsServiceSid);

    switch (action) {
      case "create-conversation": {
        if (!bookingId || !participants || !Array.isArray(participants)) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Booking ID and participants array are required" }),
          };
        }

        // Create conversation with unique friendly name
        const conversationFriendlyName = `booking-${bookingId}-${Date.now()}`;
        
        const conversation = await conversationsService.conversations.create({
          friendlyName: conversationFriendlyName,
          attributes: JSON.stringify({
            bookingId,
            createdAt: new Date().toISOString(),
            type: "booking-chat"
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            conversationSid: conversation.sid,
            friendlyName: conversation.friendlyName
          }),
        };
      }

      case "send-message": {
        if (!conversationSid || !message || !participantIdentity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID, message, and participant identity are required" }),
          };
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            messageSid: messageResponse.sid,
            conversationSid: messageResponse.conversationSid,
            author: messageResponse.author,
            body: messageResponse.body,
            dateCreated: messageResponse.dateCreated
          }),
        };
      }

      case "get-messages": {
        if (!conversationSid) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID is required" }),
          };
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            messages: formattedMessages
          }),
        };
      }

      case "get-conversations": {
        if (!participantIdentity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Participant identity is required" }),
          };
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

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            conversations: conversationsWithDetails
          }),
        };
      }

      case "add-participant": {
        if (!conversationSid || !participantIdentity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID and participant identity are required" }),
          };
        }

        try {
          const participant = await conversationsService.conversations(conversationSid)
            .participants.create({
              identity: participantIdentity,
              attributes: JSON.stringify({
                role: userRole,
                name: userName,
                addedAt: new Date().toISOString()
              })
            });

          return {
            statusCode: 200,
            headers,
            body: JSON.stringify({
              success: true,
              participantSid: participant.sid,
              identity: participant.identity
            }),
          };
        } catch (error: any) {
          if (error.code === 50433) {
            return {
              statusCode: 200,
              headers,
              body: JSON.stringify({
                success: true,
                message: "Participant already exists in conversation"
              }),
            };
          }
          throw error;
        }
      }

      case "remove-participant": {
        if (!conversationSid || !participantIdentity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID and participant identity are required" }),
          };
        }

        const participants = await conversationsService.conversations(conversationSid)
          .participants.list();
        
        const participant = participants.find(p => p.identity === participantIdentity);
        
        if (participant) {
          await conversationsService.conversations(conversationSid)
            .participants(participant.sid).remove();
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Participant removed from conversation"
          }),
        };
      }

      case "get-conversation-participants": {
        if (!conversationSid) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID is required" }),
          };
        }

        const participants = await conversationsService.conversations(conversationSid)
          .participants.list();

        const formattedParticipants = participants.map(p => ({
          sid: p.sid,
          identity: p.identity,
          attributes: p.attributes ? JSON.parse(p.attributes) : {},
          dateCreated: p.dateCreated,
          dateUpdated: p.dateUpdated
        }));

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            participants: formattedParticipants
          }),
        };
      }

      case "mark-as-read": {
        if (!conversationSid || !participantIdentity) {
          return {
            statusCode: 400,
            headers,
            body: JSON.stringify({ error: "Conversation SID and participant identity are required" }),
          };
        }

        // Get the user's conversation and mark latest message as read
        const userConversation = await conversationsService.users(participantIdentity)
          .userConversations(conversationSid).fetch();

        // Update last read message index to the latest
        const messages = await conversationsService.conversations(conversationSid)
          .messages.list({ limit: 1, order: 'desc' });

        if (messages.length > 0) {
          await conversationsService.users(participantIdentity)
            .userConversations(conversationSid)
            .update({ lastReadMessageIndex: messages[0].index });
        }

        return {
          statusCode: 200,
          headers,
          body: JSON.stringify({
            success: true,
            message: "Conversation marked as read"
          }),
        };
      }

      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: "Invalid action" }),
        };
    }
  } catch (error: any) {
    console.error("Twilio Conversations API error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: "Failed to process Twilio Conversations request",
        details: error.message,
        code: error.code
      }),
    };
  }
};

export { handler };
