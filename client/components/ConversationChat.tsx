import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Send,
  MessageCircle,
  Users,
  Clock,
  User,
  X
} from 'lucide-react';
import { useConversations, ConversationMessage, Conversation } from '@/hooks/useConversations';
import { useCustomerConversations } from '@/hooks/useCustomerConversations';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface ConversationChatProps {
  isOpen: boolean;
  onClose: () => void;
  booking?: {
    id: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    service_name?: string;
    provider_name?: string;
    business_id?: string;
    customer_id?: string;
    customer_profiles?: {
      id: string;
      first_name: string;
      last_name: string;
      email?: string;
    };
    providers?: {
      id: string;
      user_id: string;
      first_name: string;
      last_name: string;
    };
  };
  conversationSid?: string;
}

const ConversationChat = ({ isOpen, onClose, booking, conversationSid }: ConversationChatProps) => {
  const { user, customer, userType } = useAuth();
  
  // Determine user type safely
  const currentUserType = userType || (user ? 'provider' : 'customer');
  
  // Get the current user data (either provider or customer)
  const currentUser = user || customer;
  
  // Use the main conversations hook for all users to avoid conditional hook issues
  const {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    sendMessage,
    loadMessages,
    createConversation,
    getUserIdentity,
    getUserType,
    setActiveConversation
  } = useConversations();

  const [newMessage, setNewMessage] = useState('');
  const [activeConversationSid, setActiveConversationSid] = useState<string | null>(conversationSid || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize conversation when modal opens
  useEffect(() => {
    console.log('ConversationChat useEffect triggered:', {
      isOpen,
      booking: booking?.id,
      conversationSid,
      activeConversationSid,
      user: currentUser?.id,
      userType: currentUserType
    });

    if (isOpen && booking && !activeConversationSid) {
      console.log('🎯 Triggering initializeBookingConversation...');
      initializeBookingConversation();
    } else if (isOpen && conversationSid) {
      console.log('Setting conversation SID from prop:', conversationSid);
      setActiveConversationSid(conversationSid);
      setActiveConversation(conversationSid);
    }
  }, [isOpen, booking, conversationSid]);

  // Load messages when active conversation changes
  useEffect(() => {
    console.log('Active conversation changed:', {
      activeConversationSid,
      currentConversation
    });
    
    if (activeConversationSid && activeConversationSid !== currentConversation) {
      console.log('Loading messages for conversation:', activeConversationSid);
      setActiveConversation(activeConversationSid);
    }
  }, [activeConversationSid, currentConversation, setActiveConversation]);

  const initializeBookingConversation = async () => {
    console.log('🚀 initializeBookingConversation called with:', {
      booking: booking?.id,
      user: currentUser?.id,
      userType: currentUserType,
      bookingData: booking,
      currentUserData: currentUser
    });

    if (!booking || !currentUser) {
      console.log('❌ Missing required data:', { 
        booking: !!booking, 
        user: !!currentUser,
        bookingId: booking?.id,
        userId: currentUser?.id
      });
      return;
    }

    console.log('📋 Initializing booking conversation for:', booking.id);

    const userIdentity = getUserIdentity();
    const userType = getUserType();
    console.log('👤 User identity:', userIdentity, 'User type:', userType);

    if (!userIdentity || !userType) {
      console.error('❌ Failed to get user identity or type');
      console.log('🔍 Debug info:', {
        currentUser: currentUser,
        userIdentity: userIdentity,
        userType: userType,
        getUserIdentity: getUserIdentity,
        getUserType: getUserType
      });
      return;
    }

    // Create participants for both customer and provider
    const bookingParticipants = [];
    
    // Add current user (enhanced logic for provider side)
    let currentUserName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
    let currentUserId = currentUser.id;
    
    // For provider side: use the logged-in user's provider data
    // This handles cases where owner/dispatcher chats instead of assigned provider
    if (userType === 'provider' && user) {
      currentUserName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      currentUserId = user.id;
    }
    
    bookingParticipants.push({
      identity: userIdentity,
      role: userType,
      name: currentUserName,
      userId: currentUserId,
      userType: userType
    });
    
    // Add the other participant (customer or provider) with consistent identity format
    if (userType === 'provider' && booking.customer_profiles) {
      // Current user is provider, add customer
      const customerName = `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`.trim();
      bookingParticipants.push({
        identity: `customer-${booking.customer_profiles.id}`, // Use consistent format: customer-id
        role: 'customer',
        name: customerName,
        userId: booking.customer_profiles.id,
        userType: 'customer'
      });
    } else if (userType === 'customer' && booking.providers) {
      // Current user is customer, add assigned provider from booking
      const providerName = `${booking.providers.first_name} ${booking.providers.last_name}`.trim();
      bookingParticipants.push({
        identity: `provider-${booking.providers.user_id}`, // Use consistent format: provider-id
        role: 'provider', 
        name: providerName,
        userId: booking.providers.user_id,
        userType: 'provider'
      });
    }

    console.log('👥 Enhanced participants logic:');
    console.log('  - Current user type:', userType);
    console.log('  - Current user ID:', currentUser?.id);
    console.log('  - Booking assigned provider ID:', booking.providers?.user_id);
    console.log('  - Current user is assigned provider:', currentUser?.id === booking.providers?.user_id);
    console.log('  - Booking object:', booking);
    console.log('  - booking.customer_profiles:', booking.customer_profiles);
    console.log('  - booking.providers:', booking.providers);

    console.log('👥 Booking participants:', bookingParticipants);

    try {
      console.log('📞 Calling createConversation...');
      const convSid = await createConversation(booking.id, bookingParticipants);
      console.log('✅ Conversation SID returned:', convSid);
      if (convSid) {
        console.log('🎯 Setting active conversation SID:', convSid);
        setActiveConversationSid(convSid);
        setActiveConversation(convSid);
      } else {
        console.error('❌ Failed to get conversation SID - returned null/undefined');
      }
    } catch (error) {
      console.error('💥 Error initializing conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationSid || sending) return;

    try {
      await sendMessage(activeConversationSid, newMessage.trim());
      setNewMessage('');
      
      // Reload messages to ensure real-time updates
      setTimeout(() => {
        loadMessages(activeConversationSid);
      }, 500);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatMessageTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch {
      return 'Just now';
    }
  };

  const getMessageAuthorInfo = (message: ConversationMessage) => {
    const userIdentity = getUserIdentity();
    const isCurrentUser = message.author === userIdentity;
    const attributes = message.attributes || {};
    
    // Enhanced name resolution logic
    let displayName = attributes.userName || message.author;
    
    // If no userName in attributes, try to get name from participants or booking data
    if (!attributes.userName || attributes.userName === message.author) {
      if (isCurrentUser) {
        // Current user - use their actual name
        if (userType === 'provider' && user) {
          displayName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
        } else if (userType === 'customer' && currentUser) {
          displayName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim();
        }
      } else {
        // Other participant - try to get from booking data
        if (userType === 'provider' && booking?.customer_profiles) {
          displayName = `${booking.customer_profiles.first_name} ${booking.customer_profiles.last_name}`.trim();
        } else if (userType === 'customer' && booking?.providers) {
          displayName = `${booking.providers.first_name} ${booking.providers.last_name}`.trim();
        }
      }
    }
    
    // Fallback to a clean version of the identity if still no good name
    if (!displayName || displayName === message.author) {
      displayName = message.author.replace(/^(customer_|provider_)/, '').replace(/_/g, ' ') || 'User';
    }
    
    return {
      isCurrentUser,
      name: displayName,
      role: attributes.userRole || 'participant',
      initials: displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    };
  };

  const getParticipantInfo = (participant: any) => {
    const userIdentity = getUserIdentity();
    const isCurrentUser = participant.identity === userIdentity;
    
    return {
      isCurrentUser,
      name: participant.attributes?.name || participant.identity,
      role: participant.attributes?.role || participant.userType || 'participant',
      imageUrl: participant.attributes?.imageUrl,
      initials: (participant.attributes?.name || participant.identity)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    };
  };

  // Debug info
  const debugInfo = (
    <div className="text-xs text-gray-500 mb-2">
      Debug: activeConversationSid={activeConversationSid ? 'Set' : 'Not set'}, 
      sending={sending ? 'Yes' : 'No'}, 
      loading={loading ? 'Yes' : 'No'}
      {booking && (
        <div>
          Booking ID: {booking.id}, 
          User: {currentUser?.id || 'No user ID'}, 
          User Type: {currentUserType},
          User Data: {currentUser ? JSON.stringify({id: currentUser.id, first_name: currentUser.first_name, last_name: currentUser.last_name, userType: currentUserType}) : 'No user data'},
          Booking Data: {booking ? JSON.stringify({id: booking.id, customer_id: booking.customer_id, customer_name: booking.customer_name}) : 'No booking data'}
        </div>
      )}
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            {booking ? `Chat - ${booking.service_name || 'Booking'}` : 'Conversation'}
          </DialogTitle>
        </DialogHeader>

        {debugInfo}

        <div className="flex-1 flex flex-col min-h-0">
          {/* Participants Info */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants ({participants.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex flex-wrap gap-2">
                {participants.map((participant) => {
                  const info = getParticipantInfo(participant);
                  return (
                    <Badge
                      key={participant.sid}
                      variant={info.isCurrentUser ? "default" : "secondary"}
                      className="flex items-center gap-1"
                    >
                      <Avatar className="h-4 w-4">
                        <AvatarImage src={info.imageUrl} />
                        <AvatarFallback className="text-xs">
                          {info.initials}
                        </AvatarFallback>
                      </Avatar>
                      {info.name}
                      {info.isCurrentUser && " (You)"}
                    </Badge>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Messages */}
          <Card className="flex-1 flex flex-col min-h-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Messages</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0 pt-0">
              <ScrollArea className="flex-1">
                <div className="space-y-4 p-4">
                  {loading ? (
                    <div className="text-center text-gray-500">Loading messages...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-gray-500">No messages yet. Start the conversation!</div>
                  ) : (
                    messages.map((message) => {
                      const authorInfo = getMessageAuthorInfo(message);
                      return (
                        <div
                          key={message.sid}
                          className={`flex gap-3 ${
                            authorInfo.isCurrentUser ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" />
                            <AvatarFallback className="text-xs">
                              {authorInfo.initials}
                            </AvatarFallback>
                          </Avatar>
                          <div
                            className={`flex flex-col max-w-[70%] ${
                              authorInfo.isCurrentUser ? 'items-end' : 'items-start'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">
                                {authorInfo.name}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {authorInfo.role}
                              </Badge>
                              <span className="text-xs text-gray-500">
                                {formatMessageTime(message.dateCreated)}
                              </span>
                            </div>
                            <div
                              className={`rounded-lg px-3 py-2 text-sm ${
                                authorInfo.isCurrentUser
                                  ? 'bg-blue-500 text-white'
                                  : 'bg-gray-100 text-gray-900'
                              }`}
                            >
                              {message.body}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Message Input */}
          <Card className="mt-4">
            <CardContent className="pt-4">
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  disabled={sending || !activeConversationSid}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || !activeConversationSid}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationChat;
