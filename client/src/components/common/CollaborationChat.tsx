import React, { useState, useEffect, useRef } from 'react';
import { Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';

interface Message {
  id: string;
  text: string;
  sender: {
    id: string;
    name: string;
    avatar?: string;
  };
  timestamp: Timestamp;
}

interface CollaborationChatProps {
  channelId?: string; // Default channel or specific campaign/contact channel
  isOpen: boolean;
  onClose: () => void;
}

const CollaborationChat: React.FC<CollaborationChatProps> = ({
  channelId = 'general',
  isOpen,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  // Load messages from Firebase
  useEffect(() => {
    if (!isOpen) return;

    const messagesRef = collection(db, 'channels', channelId, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'), limit(100));
    
    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const fetchedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        fetchedMessages.push({
          id: doc.id,
          text: data.text,
          sender: data.sender,
          timestamp: data.timestamp
        });
      });
      
      setMessages(fetchedMessages);
      setLoading(false);
      scrollToBottom();
    }, (error) => {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error loading messages",
        description: "Please try again later",
        variant: "destructive"
      });
      setLoading(false);
    });

    // Auto-focus input when chat opens
    if (inputRef.current) {
      inputRef.current.focus();
    }
    
    return () => unsubscribe();
  }, [channelId, isOpen, toast]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim() || !user) return;
    
    try {
      const messagesRef = collection(db, 'channels', channelId, 'messages');
      await addDoc(messagesRef, {
        text: inputValue.trim(),
        sender: {
          id: user.id,
          name: user.fullName || 'Anonymous',
          avatar: null, // We don't have profilePhoto in our User type
        },
        timestamp: serverTimestamp()
      });
      
      setInputValue('');
    } catch (error) {
      console.error("Error sending message:", error);
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    }
  };

  // Format timestamp to readable time
  const formatTime = (timestamp: Timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp.toDate();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  // Check if message is from the current user
  const isOwnMessage = (senderId: string) => {
    return user && user.id.toString() === senderId;
  };

  if (!isOpen) return null;

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-lg z-50 overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground py-2 px-4 flex flex-row justify-between items-center">
        <CardTitle className="text-sm font-medium">Team Chat</CardTitle>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6 text-primary-foreground hover:bg-primary/90">
                <X className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Close chat</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-0">
        <div className="h-80 overflow-y-auto p-3 space-y-3">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex justify-center items-center h-full text-center text-muted-foreground">
              <div>
                <p>No messages yet</p>
                <p className="text-xs">Be the first to send a message!</p>
              </div>
            </div>
          ) : (
            messages.map((message) => (
              <div key={message.id} className={`flex ${isOwnMessage(message.sender.id) ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-2 max-w-[80%] ${isOwnMessage(message.sender.id) ? 'flex-row-reverse' : 'flex-row'}`}>
                  <Avatar className="h-6 w-6">
                    {message.sender.avatar && <AvatarImage src={message.sender.avatar} alt={message.sender.name} />}
                    <AvatarFallback className="text-xs">
                      {message.sender.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className={`px-3 py-2 rounded-lg text-sm ${
                      isOwnMessage(message.sender.id) 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      {message.text}
                    </div>
                    <div className={`text-xs text-muted-foreground mt-1 flex ${isOwnMessage(message.sender.id) ? 'justify-end' : 'justify-start'}`}>
                      <span>{!isOwnMessage(message.sender.id) && `${message.sender.name} · `}</span>
                      <span>{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </CardContent>
      <CardFooter className="p-2">
        <form onSubmit={sendMessage} className="flex w-full gap-2">
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type a message..."
            className="text-sm"
          />
          <Button type="submit" size="icon" disabled={!inputValue.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};

export default CollaborationChat;