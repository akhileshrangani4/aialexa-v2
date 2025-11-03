"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useChatbot } from "@/hooks/useChatbot";
import { ChatInterface, FileUpload, ChatbotSettings } from "@/components/chat";

export default function ChatbotDetailPage() {
  const router = useRouter();
  const params = useParams();
  const chatbotId = params.id as string;
  const { data: session, isPending: sessionLoading } = useSession();

  const {
    messages,
    currentMessage,
    setCurrentMessage,
    isStreaming,
    streamingContent,
    messagesEndRef,
    chatbot,
    chatbotLoading,
    handleSendMessage,
  } = useChatbot(chatbotId, session);

  // Fetch files
  const {
    data: files,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = trpc.files.list.useQuery({ chatbotId }, { enabled: !!session });

  // Upload file mutation
  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      refetchFiles();
    },
  });

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      refetchFiles();
    },
  });

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
    router.push("/login");
    return null;
  }

  // Not found
  if (!chatbot) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle>Chatbot Not Found</CardTitle>
            <CardDescription>
              The chatbot you&apos;re looking for doesn&apos;t exist.
            </CardDescription>
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
    <div className="min-h-screen bg-secondary">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              ← Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-foreground">{chatbot.name}</h1>
          <p className="text-muted-foreground mt-2">{chatbot.description}</p>
          <div className="flex gap-2 mt-4">
            <Badge>{chatbot.model}</Badge>
            {chatbot.shareToken && (
              <Badge variant="outline">Sharing Enabled</Badge>
            )}
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
            <ChatInterface
              messages={messages}
              isStreaming={isStreaming}
              streamingContent={streamingContent}
              currentMessage={currentMessage}
              setCurrentMessage={setCurrentMessage}
              handleSendMessage={handleSendMessage}
              messagesEndRef={
                messagesEndRef as React.RefObject<HTMLDivElement>
              }
              chatbotName={chatbot.name || "Chatbot"}
            />
          </TabsContent>

          {/* Files Tab */}
          <TabsContent value="files">
            <Card>
              <CardHeader>
                <FileUpload
                  chatbotId={chatbotId}
                  files={files || []}
                  filesLoading={filesLoading}
                  refetchFiles={refetchFiles}
                  uploadFile={uploadFile}
                  deleteFile={deleteFile}
                />
              </CardHeader>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Chatbot Settings</CardTitle>
                <CardDescription>Configure your chatbot</CardDescription>
              </CardHeader>
              <CardContent>
                <ChatbotSettings
                  chatbot={{
                    model: chatbot.model,
                    systemPrompt: chatbot.systemPrompt,
                    temperature: chatbot.temperature,
                    maxTokens: chatbot.maxTokens,
                    shareToken: chatbot.shareToken,
                  }}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
