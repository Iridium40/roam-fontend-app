import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface ConversationMessage {
  sid: string;
  author: string;
  body: string;
  dateCreated: string;
  attributes?: {
    userRole?: string;
    userName?: string;
    userId?: string;
    timestamp?: string;
  };
}

export interface ConversationParticipant {
  sid: string;
  identity: string;
  userId: string;
  userType: string;
  attributes?: {
    role?: string;
    name?: string;
    imageUrl?: string;
    email?: string;
  };
}

export interface Conversation {
  sid: string;
  friendlyName: string;
  attributes: {
    bookingId?: string;
    createdAt?: string;
    type?: string;
  };
  lastMessage?: {
    body: string;
    author: string;
    dateCreated: string;
  };
  unreadMessagesCount: number;
  userType: string;
}

export const useConversations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [participants, setParticipants] = useState<ConversationParticipant[]>([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate unique identity for current user
  const getUserIdentity = useCallback(() => {
    if (!user) return null;
    const userType = user.provider_role ? 'provider' : 'customer';
    return `${userType}-${user.id}`;
  }, [user]);

  // Get user type for API calls
  const getUserType = useCallback(() => {
    if (!user) return null;
    return user.provider_role ? 'provider' : 'customer';
  }, [user]);

  // Create a new conversation for a booking
  const createConversation = useCallback(async (bookingId: string, participants: Array<{
    identity: string;
    role: string;
    name: string;
    userId: string;
    userType: string;
  }>) => {
    console.log('createConversation called with:', { bookingId, participants });
    
    try {
      setLoading(true);
      setError(null);
      
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
      // Don't call loadConversations here to avoid circular dependency
      // The caller should handle refreshing if needed
      
      return result.conversationSid;
    } catch (error: any) {
      console.error('Error creating conversation:', error);
      setError(error.message || 'Failed to create conversation');
      toast({
        title: "Error",
        description: error.message || 'Failed to create conversation',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load conversations for the current user
  const loadConversations = useCallback(async () => {
    if (!user) return;
    
    console.log('loadConversations called for user:', user.id);
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'get-conversations',
        userId: user.id
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
        throw new Error(result.error || 'Failed to load conversations');
      }

      setConversations(result.conversations || []);
    } catch (error: any) {
      console.error('Error loading conversations:', error);
      setError(error.message || 'Failed to load conversations');
      toast({
        title: "Error",
        description: error.message || 'Failed to load conversations',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  // Load messages for a specific conversation
  const loadMessages = useCallback(async (conversationSid: string) => {
    console.log('loadMessages called for conversation:', conversationSid);
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'get-messages',
        conversationSid
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
        throw new Error(result.error || 'Failed to load messages');
      }

      setMessages(result.messages || []);
    } catch (error: any) {
      console.error('Error loading messages:', error);
      setError(error.message || 'Failed to load messages');
      toast({
        title: "Error",
        description: error.message || 'Failed to load messages',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Send a message
  const sendMessage = useCallback(async (conversationSid: string, message: string) => {
    if (!user) return;
    
    console.log('sendMessage called:', { conversationSid, message });
    
    try {
      setSending(true);
      setError(null);
      
      const userType = getUserType();
      const userIdentity = getUserIdentity();
      
      if (!userType || !userIdentity) {
        throw new Error('User not properly authenticated');
      }
      
      const requestBody = {
        action: 'send-message',
        conversationSid,
        message,
        participantIdentity: userIdentity,
        userRole: userType,
        userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
        userId: user.id
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
        throw new Error(result.error || 'Failed to send message');
      }

      // Add the new message to the current messages list
      const newMessage: ConversationMessage = {
        sid: result.messageSid,
        author: result.author,
        body: result.body,
        dateCreated: result.dateCreated,
        attributes: {
          userRole: userType,
          userName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
          userId: user.id,
          timestamp: new Date().toISOString()
        }
      };
      
      setMessages(prev => [...prev, newMessage]);
      
      // Don't call loadConversations here to avoid circular dependency
      // The caller should handle refreshing if needed
      
      return result.messageSid;
    } catch (error: any) {
      console.error('Error sending message:', error);
      setError(error.message || 'Failed to send message');
      toast({
        title: "Error",
        description: error.message || 'Failed to send message',
        variant: "destructive",
      });
      throw error;
    } finally {
      setSending(false);
    }
  }, [user, getUserType, getUserIdentity, toast]);

  // Load participants for a conversation
  const loadParticipants = useCallback(async (conversationSid: string) => {
    console.log('loadParticipants called for conversation:', conversationSid);
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'get-conversation-participants',
        conversationSid
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
        throw new Error(result.error || 'Failed to load participants');
      }

      setParticipants(result.participants || []);
    } catch (error: any) {
      console.error('Error loading participants:', error);
      setError(error.message || 'Failed to load participants');
      toast({
        title: "Error",
        description: error.message || 'Failed to load participants',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Add a participant to a conversation
  const addParticipant = useCallback(async (conversationSid: string, participantUserId: string, participantUserType: string) => {
    console.log('addParticipant called:', { conversationSid, participantUserId, participantUserType });
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'add-participant',
        conversationSid,
        userId: participantUserId,
        userType: participantUserType
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
        throw new Error(result.error || 'Failed to add participant');
      }

      // Refresh participants list
      await loadParticipants(conversationSid);
      
      return result.participantSid;
    } catch (error: any) {
      console.error('Error adding participant:', error);
      setError(error.message || 'Failed to add participant');
      toast({
        title: "Error",
        description: error.message || 'Failed to add participant',
        variant: "destructive",
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [loadParticipants, toast]);

  // Mark messages as read
  const markAsRead = useCallback(async (conversationSid: string) => {
    if (!user) return;
    
    console.log('markAsRead called for conversation:', conversationSid);
    
    try {
      setLoading(true);
      setError(null);
      
      const requestBody = {
        action: 'mark-as-read',
        conversationSid,
        userId: user.id
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
        throw new Error(result.error || 'Failed to mark messages as read');
      }

      // Refresh conversations to update unread count
      await loadConversations();
    } catch (error: any) {
      console.error('Error marking messages as read:', error);
      setError(error.message || 'Failed to mark messages as read');
      toast({
        title: "Error",
        description: error.message || 'Failed to mark messages as read',
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [user, loadConversations, toast]);

  // Set current conversation
  const setActiveConversation = useCallback((conversationSid: string | null) => {
    setCurrentConversation(conversationSid);
    if (conversationSid) {
      loadMessages(conversationSid);
      loadParticipants(conversationSid);
      markAsRead(conversationSid);
    } else {
      setMessages([]);
      setParticipants([]);
    }
  }, [loadMessages, loadParticipants, markAsRead]);

  // Load conversations when user changes
  useEffect(() => {
    if (user) {
      loadConversations();
    }
  }, [user, loadConversations]);

  return {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    error,
    createConversation,
    loadConversations,
    loadMessages,
    sendMessage,
    loadParticipants,
    addParticipant,
    markAsRead,
    setActiveConversation,
    getUserIdentity,
    getUserType
  };
};
