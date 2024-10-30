import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUser } from '@clerk/clerk-react';
import { useMutation, useQuery } from 'convex/react';
import { RegExpMatcher, englishDataset, englishRecommendedTransformers } from 'obscenity';
import React, { useEffect, useRef, useState } from 'react';
import { api } from '../../convex/_generated/api';

const matcher = new RegExpMatcher({
  ...englishDataset.build(),
  ...englishRecommendedTransformers,
});

export const Chat: React.FC = () => {
  const { user } = useUser();
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const messages = useQuery(api.chat.getMessages);
  const sendMessage = useMutation(api.chat.sendMessage);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (error) {
      timer = setTimeout(() => {
        setError(null);
      }, 3000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [error]);

  const handleSendMessage = async () => {
    if (message.trim() && user) {
      const trimmedMessage = message.trim();
      const matches = matcher.getAllMatches(trimmedMessage);
      
      if (matches.length > 0) {
        setError("Your message contains inappropriate language. Please revise it.");
        return;
      }

      const username = user.username || user.firstName || user.id.slice(0, 8);

      await sendMessage({
        userId: user.id,
        username,
        content: message.trim(),
      });
      setMessage('');
    }
  };

  const filteredMessages = messages || [];

  return (
    <div className="flex flex-col h-[50vh] p-4">
      <div className="text-lg font-bold mb-2 text-palette-yellow">Chat</div>
      <div 
        ref={chatContainerRef}
        className="flex-grow overflow-y-auto mb-4 flex flex-col-reverse"
      >
        <div>
          {filteredMessages.slice().reverse().map((msg, index) => (
            <div key={index} className="mb-2 break-words">
              <span className="font-bold">{msg.username}: </span>
              <span className="whitespace-pre-wrap">{msg.content}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="flex flex-col">
        {error && <div className="text-red-500 mb-2">{error}</div>}
        <div className="flex">
          <Input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            className="flex-grow mr-2"
          />
          <Button onClick={handleSendMessage} className="text-palette-offwhite border-2 border-palette-offwhite">Send</Button>
        </div>
      </div>
    </div>
  );
};

export default Chat;