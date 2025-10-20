'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { trpc } from '@/lib/trpc';
import { useSession } from '@/lib/auth-client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useRef } from 'react';
import Link from 'next/link';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'text/plain',
  'text/markdown',
  'application/json',
  'text/csv',
];

export default function ChatbotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chatbotId = params.id as string;
  const { data: session, isPending: sessionLoading } = useSession();
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat state
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; sources?: Array<{ fileName: string; chunkIndex: number; similarity: number }> }>>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');

  // Fetch chatbot details
  const { data: chatbot, isLoading: chatbotLoading } = trpc.chatbot.get.useQuery(
    { id: chatbotId },
    { enabled: !!session }
  );

  // Fetch files
  const { data: files, isLoading: filesLoading, refetch: refetchFiles } = trpc.files.list.useQuery(
    { chatbotId },
    { enabled: !!session }
  );

  // Upload file mutation
  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadError('');
      refetchFiles();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      refetchFiles();
    },
  });

  // Send message mutation
  const sendMessage = trpc.chat.sendMessage.useMutation({
    onSuccess: (data) => {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: data.response, sources: data.sources },
      ]);
      setSessionId(data.sessionId);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError('File type not supported. Please upload PDF, Word, TXT, Markdown, JSON, or CSV files.');
      return;
    }

    setSelectedFile(file);
    setUploadError('');
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(',')[1]; // Remove data:mime;base64, prefix

      if (!base64Data) {
        setUploadError('Failed to read file');
        return;
      }

      await uploadFile.mutateAsync({
        chatbotId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64Data,
        fileSize: selectedFile.size,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentMessage.trim()) return;

    const userMessage = currentMessage;
    setCurrentMessage('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

    await sendMessage.mutateAsync({
      chatbotId,
      message: userMessage,
      sessionId: sessionId || undefined,
    });
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm('Are you sure you want to delete this file?')) {
      await deleteFile.mutateAsync({ chatbotId, fileId });
    }
  };

  // Loading state
  if (sessionLoading || chatbotLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  // Redirect if not logged in
  if (!session) {
    router.push('/login');
    return null;
  }

  // Not found
  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Chatbot Not Found</CardTitle>
            <CardDescription>The chatbot you&apos;re looking for doesn&apos;t exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{chatbot.name}</h1>
          <p className="text-gray-600 mt-2">{chatbot.description}</p>
          <div className="flex gap-2 mt-4">
            <Badge>{chatbot.model}</Badge>
            {chatbot.shareToken && <Badge variant="outline">Sharing Enabled</Badge>}
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="files">Files</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <CardTitle>Test Your Chatbot</CardTitle>
                <CardDescription>Chat with your AI assistant</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Messages */}
                  <div className="border rounded-lg p-4 h-[500px] overflow-y-auto bg-white space-y-4">
                    {messages.length === 0 ? (
                      <div className="flex items-center justify-center h-full text-gray-500">
                        Start a conversation...
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <div
                          key={idx}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="whitespace-pre-wrap">{msg.content}</p>
                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-gray-300">
                                <p className="text-xs font-semibold mb-1">Sources:</p>
                                {msg.sources.map((source, i) => (
                                  <p key={i} className="text-xs">
                                    {source.fileName} (chunk {source.chunkIndex})
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
                        <div className="bg-gray-100 rounded-lg p-3">
                          <p className="text-gray-500">Thinking...</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Input */}
                  <form onSubmit={handleSendMessage} className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      disabled={sendMessage.isPending}
                    />
                    <Button type="submit" disabled={sendMessage.isPending || !currentMessage.trim()}>
                      Send
                    </Button>
                  </form>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>Course Materials</CardTitle>
                    <CardDescription>Upload files to train your chatbot</CardDescription>
                  </div>
                  <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>Upload File</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Upload Course Material</DialogTitle>
                        <DialogDescription>
                          Upload PDF, Word, TXT, Markdown, JSON, or CSV files (max 10MB)
                        </DialogDescription>
                      </DialogHeader>

                      {uploadError && (
                        <Alert variant="destructive">
                          <AlertDescription>{uploadError}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="file">Select File</Label>
                          <Input
                            id="file"
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
                          />
                        </div>

                        {selectedFile && (
                          <div className="text-sm">
                            <p>
                              <strong>File:</strong> {selectedFile.name}
                            </p>
                            <p>
                              <strong>Size:</strong> {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        )}

                        <div className="flex justify-end space-x-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setUploadDialogOpen(false)}
                            disabled={uploadFile.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUpload}
                            disabled={!selectedFile || uploadFile.isPending}
                          >
                            {uploadFile.isPending ? 'Uploading...' : 'Upload'}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {filesLoading ? (
                  <p className="text-center py-8 text-gray-500">Loading files...</p>
                ) : !files || files.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-gray-500 mb-4">No files uploaded yet</p>
                    <Button onClick={() => setUploadDialogOpen(true)}>Upload Your First File</Button>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>File Name</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Uploaded</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {files.map((file) => (
                        <TableRow key={file.id}>
                          <TableCell>{file.fileName}</TableCell>
                          <TableCell>{(file.fileSize / 1024).toFixed(2)} KB</TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                file.processingStatus === 'completed'
                                  ? 'default'
                                  : file.processingStatus === 'failed'
                                  ? 'destructive'
                                  : 'secondary'
                              }
                            >
                              {file.processingStatus}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {new Date(file.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleDeleteFile(file.id)}
                              disabled={deleteFile.isPending}
                            >
                              Delete
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Settings</CardTitle>
                <CardDescription>Configure your chatbot</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Model</Label>
                  <p className="text-sm text-gray-600">{chatbot.model}</p>
                </div>
                <div>
                  <Label>System Prompt</Label>
                  <Textarea value={chatbot.systemPrompt} disabled rows={4} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Temperature</Label>
                    <p className="text-sm text-gray-600">{chatbot.temperature}</p>
                  </div>
                  <div>
                    <Label>Max Tokens</Label>
                    <p className="text-sm text-gray-600">{chatbot.maxTokens}</p>
                  </div>
                </div>
                <div>
                  <Label>Share URL</Label>
                  {chatbot.shareToken ? (
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/chat/${chatbot.shareToken}`}
                        readOnly
                      />
                      <Button
                        variant="outline"
                        onClick={() => {
                          navigator.clipboard.writeText(
                            `${window.location.origin}/chat/${chatbot.shareToken}`
                          );
                          alert('Link copied!');
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Sharing not enabled</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

