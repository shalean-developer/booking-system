'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Send, Loader2, Image as ImageIcon, AlertCircle, MessageSquare } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { createClient as createSupabaseBrowserClient } from '@/lib/supabase-browser';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  booking_id: string;
  sender_type: 'cleaner' | 'customer';
  sender_id: string;
  message_text: string;
  attachments: string[];
  read_at: string | null;
  created_at: string;
}

interface BookingChatProps {
  bookingId: string;
  cleanerName: string;
  customerName?: string;
}

export function BookingChat({ bookingId, cleanerName, customerName }: BookingChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const supabase = createSupabaseBrowserClient();

  // Fetch messages
  const fetchMessages = async () => {
    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/messages`);
      const data = await response.json();
      if (data.ok) {
        setMessages(data.messages || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to load messages');
      }
    } catch (err) {
      console.error('Error fetching messages:', err);
      setError('An error occurred while loading messages');
    } finally {
      setIsLoading(false);
    }
  };

  // Subscribe to new messages via Supabase Realtime
  useEffect(() => {
    fetchMessages();

    const channel = supabase
      .channel(`booking_messages:${bookingId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'booking_messages',
          filter: `booking_id=eq.${bookingId}`,
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          // Map database fields to Message interface
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const rawMessage: any = payload.new;
          const newMessage: Message = {
            id: String(rawMessage.id),
            booking_id: String(rawMessage.booking_id),
            sender_type: rawMessage.sender_type as 'cleaner' | 'customer',
            sender_id: String(rawMessage.sender_id),
            message_text: String(rawMessage.message_text),
            attachments: Array.isArray(rawMessage.attachments) ? rawMessage.attachments : [],
            read_at: rawMessage.read_at ? String(rawMessage.read_at) : null,
            created_at: String(rawMessage.created_at),
          };
          setMessages((prev) => [...prev, newMessage]);
          // Scroll to bottom
          setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message
  const handleSend = async () => {
    if (!messageText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      const response = await fetch(`/api/cleaner/bookings/${bookingId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message_text: messageText.trim(),
          attachments: [],
        }),
      });

      const data = await response.json();
      if (data.ok) {
        setMessageText('');
        // Message will be added via Realtime subscription
      } else {
        setError(data.error || 'Failed to send message');
      }
    } catch (err) {
      console.error('Error sending message:', err);
      setError('An error occurred while sending message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle Enter key (Shift+Enter for new line, Enter to send)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto space-y-3 p-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[75%] rounded-lg px-3 py-2 space-y-2 bg-gray-100">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-3 w-16" />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 p-3">
          <Skeleton className="h-[60px] w-full rounded-md" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages List */}
      <div className="flex-1 overflow-y-auto space-y-3 p-4 min-h-[200px] max-h-[400px]">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-300" />
            <p className="text-gray-600 font-medium mb-1">No messages yet</p>
            <p className="text-sm text-gray-500">Start the conversation with your customer</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCleaner = message.sender_type === 'cleaner';
            return (
              <div
                key={message.id}
                className={`flex ${isCleaner ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[75%] rounded-lg px-3 py-2 ${
                    isCleaner
                      ? 'bg-[#3b82f6] text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className="text-sm font-medium mb-1">
                    {isCleaner ? cleanerName : customerName || 'Customer'}
                  </div>
                  <div className="text-sm whitespace-pre-wrap break-words">
                    {message.message_text}
                  </div>
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {message.attachments.map((url, idx) => (
                        <a
                          key={idx}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-xs underline opacity-80"
                        >
                          📎 Attachment {idx + 1}
                        </a>
                      ))}
                    </div>
                  )}
                  <div className="text-xs opacity-70 mt-1">
                    {formatTime(message.created_at)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-3 bg-red-50 border-l-4 border-red-500 flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-red-800 font-medium text-sm">Error sending message</p>
            <p className="text-red-600 text-xs mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 p-3">
        <div className="flex gap-2">
          <Textarea
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message... (Enter to send, Shift+Enter for new line)"
            className="flex-1 min-h-[60px] max-h-[120px] resize-none"
            disabled={isSending}
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || isSending}
            className="bg-[#3b82f6] hover:bg-[#2563eb] text-white px-4 transition-all duration-200"
            aria-label="Send message"
          >
            {isSending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Press Enter to send, Shift+Enter for new line
        </p>
      </div>
    </div>
  );
}

