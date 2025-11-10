"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CreateChatbotDialog } from "@/components/dashboard/chatbots/CreateChatbotDialog";
import { ChatbotCard } from "@/components/dashboard/chatbots/ChatbotCard";
import { EmptyChatbotsState } from "@/components/dashboard/chatbots/EmptyChatbotsState";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChatbotsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch chatbots
  const {
    data: chatbots,
    isLoading: chatbotsLoading,
    refetch,
  } = trpc.chatbot.list.useQuery();

  // Delete chatbot mutation
  const deleteChatbot = trpc.chatbot.delete.useMutation({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setChatbotToDelete(null);
      refetch();
      toast.success("Chatbot deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete chatbot", {
        description: error.message,
      });
    },
  });

  const handleDeleteChatbot = () => {
    if (chatbotToDelete) {
      deleteChatbot.mutate({ id: chatbotToDelete });
    }
  };

  const handleDelete = (chatbotId: string) => {
    setChatbotToDelete(chatbotId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex-1 p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Chatbots
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              Create and manage your chatbots.
            </p>
          </div>
          <CreateChatbotDialog
            onSuccess={refetch}
            trigger={
              <Button
                size="lg"
                className="shadow-md hover:shadow-lg transition-shadow"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chatbot
              </Button>
            }
          />
        </div>

        {/* Chatbots List */}
        {chatbotsLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading chatbots...</p>
          </div>
        ) : !chatbots || chatbots.length === 0 ? (
          <EmptyChatbotsState onCreateClick={() => setCreateDialogOpen(true)} />
        ) : (
          <div className="grid gap-4">
            {chatbots.map((chatbot) => (
              <ChatbotCard
                key={chatbot.id}
                chatbot={chatbot}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Chatbot Dialog (for empty state) */}
      <CreateChatbotDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={() => {
          setCreateDialogOpen(false);
          refetch();
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteChatbot}
        title="Delete Chatbot"
        description="Are you sure you want to delete this chatbot? This action cannot be undone and will permanently delete all uploaded files, conversation history, and analytics data."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteChatbot.isPending}
      />
    </div>
  );
}
