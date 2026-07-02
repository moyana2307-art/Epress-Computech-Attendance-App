import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface ChatMessage {
  id: number;
  sender_id: number;
  sender_name: string;
  message: string;
  created_at: string;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [lastId, setLastId] = useState(0);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const url = lastId ? `/api/messages?since=${lastId}` : '/api/messages';
        const res = await fetch(url);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setMessages((prev) => {
            const existing = new Set(prev.map((m) => m.id));
            const newMsgs = data.filter((m: ChatMessage) => !existing.has(m.id));
            return [...prev, ...newMsgs];
          });
          setLastId(Math.max(...data.map((m: ChatMessage) => m.id)));
        }
      } catch {}
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [lastId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user) return;
    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sender_id: user.id, sender_name: user.name, message: input.trim() }),
      });
      const msg = await res.json();
      if (msg.id) {
        setMessages((prev) => [...prev, msg]);
        setLastId(msg.id);
        setInput('');
      }
    } catch {} finally {
      setSending(false);
    }
  };

  const formatTime = (ts: string) => {
    const d = new Date(ts + 'Z');
    return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const isToday = (ts: string) => {
    const d = new Date(ts + 'Z');
    const now = new Date();
    return d.toDateString() === now.toDateString();
  };

  const formatDate = (ts: string) => {
    const d = new Date(ts + 'Z');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-4xl mx-auto h-[calc(100vh-10rem)] flex flex-col">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-text">Team Chat</h1>
        <p className="text-sm text-text-secondary mt-1">Chat and share updates with your team</p>
      </div>

      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl border border-border flex flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-1">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-text-secondary">
              <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs">Be the first to send a message</p>
            </div>
          )}
          {messages.map((msg, i) => {
            const isMine = msg.sender_id === user?.id;
            const showDate = i === 0 || new Date(messages[i - 1].created_at + 'Z').toDateString() !== new Date(msg.created_at + 'Z').toDateString();
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex justify-center my-3">
                    <span className="px-3 py-1 text-[10px] font-medium text-text-secondary bg-gray-100 dark:bg-gray-700 rounded-full">
                      {isToday(msg.created_at) ? 'Today' : formatDate(msg.created_at)}
                    </span>
                  </div>
                )}
                <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMine ? 'order-1' : 'order-1'}`}>
                    {!isMine && (
                      <p className="text-[10px] text-text-secondary mb-0.5 ml-1">{msg.sender_name}</p>
                    )}
                    <div
                      className={`px-3.5 py-2 rounded-2xl text-sm break-words ${
                        isMine
                          ? 'bg-primary text-white rounded-br-md'
                          : 'bg-gray-100 dark:bg-gray-700 text-text rounded-bl-md'
                      }`}
                    >
                      {msg.message}
                    </div>
                    <p className={`text-[10px] text-text-secondary mt-0.5 ${isMine ? 'text-right mr-1' : 'ml-1'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSend} className="border-t border-border p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            maxLength={500}
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-card text-text text-sm placeholder:text-text-secondary/60 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
          />
          <Button type="submit" disabled={sending || !input.trim()} className="h-11 px-4 shrink-0">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}
