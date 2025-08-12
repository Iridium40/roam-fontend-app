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
  };
  conversationSid?: string;
}

const ConversationChat = ({ isOpen, onClose, booking, conversationSid }: ConversationChatProps) => {
  const { user } = useAuth();
  const {
    conversations,
    currentConversation,
    messages,
    participants,
    loading,
    sending,
    loadMessages,
    sendMessage,
    findOrCreateBookingConversation,
    getUserIdentity,
    loadParticipants
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
      user: user?.id,
      provider: provider?.provider_role
    });

    if (isOpen && booking && !activeConversationSid) {
      console.log('Initializing booking conversation...');
      initializeBookingConversation();
    } else if (isOpen && conversationSid) {
      console.log('Setting conversation SID from prop:', conversationSid);
      setActiveConversationSid(conversationSid);
      loadMessages(conversationSid);
      loadParticipants(conversationSid);
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
      loadMessages(activeConversationSid);
      loadParticipants(activeConversationSid);
    }
  }, [activeConversationSid]);

  const initializeBookingConversation = async () => {
    console.log('initializeBookingConversation called with:', {
      booking: booking?.id,
      user: user?.id,
      providerRole: user?.provider_role
    });

    if (!booking || !user || !user.provider_role) {
      console.log('Missing required data:', { 
        booking: !!booking, 
        user: !!user, 
        hasProviderRole: !!user?.provider_role,
        bookingId: booking?.id,
        userId: user?.id,
        providerRole: user?.provider_role
      });
      return;
    }

    console.log('Initializing booking conversation for:', booking.id);

    const userIdentity = getUserIdentity();
    console.log('User identity:', userIdentity);

    const bookingParticipants = [
      {
        identity: userIdentity || '',
        role: user.provider_role,
        name: `${user.first_name} ${user.last_name}`,
        userId: user.id
      }
    ];

    // Add customer if we have their info
    if (booking.customer_email) {
      bookingParticipants.push({
        identity: `customer-${booking.customer_email}`,
        role: 'customer',
        name: booking.customer_name || 'Customer',
        userId: booking.customer_email
      });
    }

    console.log('Booking participants:', bookingParticipants);

    try {
      console.log('Calling findOrCreateBookingConversation...');
      const convSid = await findOrCreateBookingConversation(booking.id, bookingParticipants);
      console.log('Conversation SID returned:', convSid);
      if (convSid) {
        console.log('Setting active conversation SID:', convSid);
        setActiveConversationSid(convSid);
      } else {
        console.error('Failed to get conversation SID - returned null/undefined');
      }
    } catch (error) {
      console.error('Error initializing conversation:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !activeConversationSid || sending) return;

    const success = await sendMessage(activeConversationSid, newMessage.trim());
    if (success) {
      setNewMessage('');
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
    const isCurrentUser = message.author === getUserIdentity();
    const attributes = message.attributes || {};
    
    return {
      isCurrentUser,
      name: attributes.userName || message.author,
      role: attributes.userRole || 'participant',
      initials: (attributes.userName || message.author)
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2)
    };
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'owner':
        return 'bg-purple-100 text-purple-800';
      case 'dispatcher':
        return 'bg-blue-100 text-blue-800';
      case 'provider':
        return 'bg-green-100 text-green-800';
      case 'customer':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-blue-600" />
                {booking ? `Booking Chat - ${booking.service_name || 'Service'}` : 'Conversation'}
              </DialogTitle>
              {booking && (
                <div className="text-sm text-gray-600 mt-1">
                  Customer: {booking.customer_name || 'Unknown'} • 
                  Booking ID: {booking.id}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                <Users className="w-3 h-3 mr-1" />
                {participants.length} participants
              </Badge>
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 flex overflow-hidden">
          {/* Messages Area */}
          <div className="flex-1 flex flex-col">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2"></div>
                    Loading messages...
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-32 text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No messages yet</p>
                    <p className="text-xs">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => {
                    const authorInfo = getMessageAuthorInfo(message);
                    return (
                      <div
                        key={message.sid}
                        className={`flex ${authorInfo.isCurrentUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] ${
                            authorInfo.isCurrentUser
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          } rounded-lg px-4 py-2`}
                        >
                          {!authorInfo.isCurrentUser && (
                            <div className="flex items-center gap-2 mb-1">
                              <Avatar className="w-5 h-5">
                                <AvatarFallback className="text-xs">
                                  {authorInfo.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span className="text-xs font-medium">
                                {authorInfo.name}
                              </span>
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getRoleBadgeColor(authorInfo.role)}`}
                              >
                                {authorInfo.role}
                              </Badge>
                            </div>
                          )}
                          <p className="text-sm whitespace-pre-wrap">{message.body}</p>
                          <div
                            className={`text-xs mt-1 ${
                              authorInfo.isCurrentUser ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            <Clock className="w-3 h-3 inline mr-1" />
                            {formatMessageTime(message.dateCreated)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <div className="border-t p-4">
              {/* Debug info */}
              <div className="text-xs text-gray-500 mb-2">
                Debug: activeConversationSid={activeConversationSid ? 'Set' : 'Not set'}, 
                sending={sending ? 'Yes' : 'No'}, 
                loading={loading ? 'Yes' : 'No'}
                {booking && (
                  <div>
                    Booking ID: {booking.id}, 
                    User: {user?.id}, 
                    Provider: {user?.provider_role}
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={!activeConversationSid ? "Initializing conversation..." : "Type your message..."}
                  disabled={sending || !activeConversationSid}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!newMessage.trim() || sending || !activeConversationSid}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {sending ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Participants Sidebar */}
          <div className="w-64 border-l bg-gray-50 p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Participants ({participants.length})
            </h3>
            <div className="space-y-2">
              {participants.map((participant) => {
                const isCurrentUser = participant.identity === getUserIdentity();
                const attrs = participant.attributes || {};
                return (
                  <div
                    key={participant.sid}
                    className={`flex items-center gap-2 p-2 rounded ${
                      isCurrentUser ? 'bg-blue-50 border border-blue-200' : 'bg-white'
                    }`}
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs">
                        {(attrs.name || participant.identity)
                          .split(' ')
                          .map(n => n[0])
                          .join('')
                          .toUpperCase()
                          .substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {attrs.name || participant.identity}
                        {isCurrentUser && ' (You)'}
                      </p>
                      <Badge
                        variant="secondary"
                        className={`text-xs ${getRoleBadgeColor(attrs.role || 'participant')}`}
                      >
                        {attrs.role || 'participant'}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ConversationChat;
