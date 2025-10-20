'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { useParams } from 'next/navigation';
import { useState } from 'react';

export default function SharedChatPage() {
  const params = useParams();
  const shareToken = params.shareToken as string;
  
  // Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: Array<{ fileName: string; chunkIndex: number; similarity: number }> }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  // Fetch chatbot info by share token
  const { data: chatbot, isLoading: chatbotLoading } = trpc.chatbot.getByShareToken.useQuery(
    { shareToken }
  );

  // Send message mutation
  const sendMessage = trpc.chat.sendSharedMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, sources: data.sources },
      ]);
      setSessionId(data.sessionId);
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage;
    setCurrentMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    await sendMessage.mutateAsync({
      shareToken,
      message: userMessage,
      sessionId: sessionId || undefined,
    });
  };

  // Loading state
  if (chatbotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p>Loading chatbot...</p>
      </div>
    );
  }

  // Not found
  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Chatbot Not Found</CardTitle>
            <CardDescription>The chatbot you&apos;re looking for doesn&apos;t exist or is not shared.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-2xl">{chatbot.name}</CardTitle>
                <CardDescription className="mt-2">{chatbot.description}</CardDescription>
              </div>
              <Badge>{chatbot.model.split('/')[1]}</Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Chat Interface */}
        <Card>
          <CardHeader>
            <CardTitle>Chat</CardTitle>
            <CardDescription>Ask questions about the course materials</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Messages */}
              <div className="border rounded-lg p-4 h-[600px] overflow-y-auto bg-white space-y-4">
                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <p className="text-gray-500 mb-2">👋 Welcome to {chatbot.name}!</p>
                    <p className="text-sm text-gray-400">Start by asking a question about the course.</p>
                  </div>
                ) : (
                  messages.map((msg, idx) => (
                    <div
                      key={idx}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg p-4 ${
                          msg.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        {msg.sources && msg.sources.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-300">
                            <p className="text-xs font-semibold mb-1 opacity-70">📚 Sources:</p>
                            {msg.sources.map((source, i) => (
                              <p key={i} className="text-xs opacity-70">
                                • {source.fileName} (section {source.chunkIndex + 1})
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                {sendMessage.isPending && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  placeholder="Ask a question..."
                  value={currentMessage}
                  onChange={(e) => setCurrentMessage(e.target.value)}
                  disabled={sendMessage.isPending}
                  className="flex-1"
                />
                <Button type="submit" disabled={sendMessage.isPending || !currentMessage.trim()}>
                  {sendMessage.isPending ? 'Sending...' : 'Send'}
                </Button>
              </form>

              {sendMessage.error && (
                <p className="text-sm text-red-600 text-center">{sendMessage.error.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-500">
          <p>Powered by AIAlexa • AI Teaching Assistant Platform</p>
        </div>
      </div>
    </div>
  );
}

