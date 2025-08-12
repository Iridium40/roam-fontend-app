import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ConversationMessage {
  sid: string;
  author: string;
  body: string;
  dateCreated: string;
  attributes: {
    userRole?: string;
    userName?: string;
    timestamp?: string;
  };
}

export interface ConversationParticipant {
  sid: string;
  identity: string;
  attributes: {
    role?: string;
    name?: string;
    userId?: string;
    addedAt?: string;
  };
  dateCreated: string;
  dateUpdated: string;
}

export interface Conversation {
  sid: string;
  friendlyName: string;
  attributes: {
    bookingId?: string;
    createdAt?: string;
    type?: string;
  };
  lastMessage: {
    body: string;
    author: string;
    dateCreated: string;
  } | null;
  unreadMessagesCount: number;
  lastReadMessageIndex: number;
}

export const useConversations = () => {
  const { user, provider } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  // Generate unique identity for current user
  const getUserIdentity = useCallback(() => {
    if (!user || !provider) return null;
    return `${provider.provider_role}-${user.id}`;
  }, [user, provider]);

  // Create a new conversation for a booking
  const createConversation = useCallback(async (bookingId: string, participants: Array<{
    identity: string;
    role: string;
    name: string;
    userId: string;
  }>) => {
    console.log('createConversation called with:', { bookingId, participants });
    
    try {
      setLoading(true);
      
      const requestBody = {
        action: 'create-conversation',
        bookingId,
        participants
      };
      console.log('Sending request to /api/twilio-conversations:', requestBody);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response result:', result);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create conversation');
      }

      console.log('Conversation created successfully, refreshing conversations list...');
      await loadConversations(); // Refresh conversations list
      
      return result.conversationSid;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to create conversation",
        variant: "destructive",
      });
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast, loadConversations]);

  // Load user's conversations
  const loadConversations = useCallback(async () => {
    const identity = getUserIdentity();
    if (!identity) return;

    try {
      setLoading(true);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-conversations',
          participantIdentity: identity
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load conversations');
      }

      setConversations(result.conversations);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load conversations",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [getUserIdentity, toast]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (conversationSid: string) => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-messages',
          conversationSid
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load messages');
      }

      setMessages(result.messages);
      setCurrentConversation(conversationSid);
      
      // Mark conversation as read
      await markAsRead(conversationSid);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (conversationSid: string, message: string) => {
    const identity = getUserIdentity();
    if (!identity || !user || !provider) return false;

    try {
      setSending(true);
      
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'send-message',
          conversationSid,
          message,
          participantIdentity: identity,
          userRole: provider.provider_role,
          userName: `${user.first_name} ${user.last_name}`
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to send message');
      }

      // Add the message to current messages if we're viewing this conversation
      if (currentConversation === conversationSid) {
        const newMessage: ConversationMessage = {
          sid: result.messageSid,
          author: identity,
          body: message,
          dateCreated: result.dateCreated || new Date().toISOString(),
          attributes: {
            userRole: provider.provider_role,
            userName: `${user.first_name} ${user.last_name}`,
            timestamp: new Date().toISOString()
          }
        };
        
        setMessages(prev => [...prev, newMessage]);
      }

      // Refresh conversations to update last message
      await loadConversations();
      
      return true;
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
      return false;
    } finally {
      setSending(false);
    }
  }, [getUserIdentity, user, provider, currentConversation, toast, loadConversations]);

  // Add participant to conversation
  const addParticipant = useCallback(async (conversationSid: string, participantIdentity: string, role: string, name: string) => {
    try {
      const response = await fetch('/.netlify/functions/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'add-participant',
          conversationSid,
          participantIdentity,
          userRole: role,
          userName: name
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to add participant');
      }

      // Refresh participants if we're viewing this conversation
      if (currentConversation === conversationSid) {
        await loadParticipants(conversationSid);
      }
      
      return true;
    } catch (error: any) {
      console.error('Error adding participant:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add participant",
        variant: "destructive",
      });
      return false;
    }
  }, [currentConversation, toast]);

  // Load participants for a conversation
  const loadParticipants = useCallback(async (conversationSid: string) => {
    try {
      const response = await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'get-conversation-participants',
          conversationSid
        }),
      });

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to load participants');
      }

      setParticipants(result.participants);
    } catch (error: any) {
      console.error('Error loading participants:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to load participants",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Mark conversation as read
  const markAsRead = useCallback(async (conversationSid: string) => {
    const identity = getUserIdentity();
    if (!identity) return;

    try {
      await fetch('/api/twilio-conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark-as-read',
          conversationSid,
          participantIdentity: identity
        }),
      });
    } catch (error: any) {
      console.error('Error marking as read:', error);
    }
  }, [getUserIdentity]);

  // Find or create conversation for a booking
  const findOrCreateBookingConversation = useCallback(async (
    bookingId: string, 
    bookingParticipants: Array<{
      identity: string;
      role: string;
      name: string;
      userId: string;
    }>
  ) => {
    console.log('findOrCreateBookingConversation called with:', { bookingId, bookingParticipants });
    console.log('Current conversations:', conversations);
    
    // First check if conversation already exists for this booking
    const existingConversation = conversations.find(conv => 
      conv.attributes.bookingId === bookingId
    );

    if (existingConversation) {
      console.log('Found existing conversation:', existingConversation.sid);
      return existingConversation.sid;
    }

    console.log('No existing conversation found, creating new one...');
    // Create new conversation
    const result = await createConversation(bookingId, bookingParticipants);
    console.log('createConversation result:', result);
    return result;
  }, [conversations, createConversation]);

  // Load conversations when user is available
  useEffect(() => {
    if (user && provider) {
      loadConversations();
    }
  }, [user, provider, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    createConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    addParticipant,
    loadParticipants,
    markAsRead,
    findOrCreateBookingConversation,
    getUserIdentity
  };
};
