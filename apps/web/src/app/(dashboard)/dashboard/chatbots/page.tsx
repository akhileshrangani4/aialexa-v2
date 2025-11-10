"use client";

import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { toast } from "sonner";
import { CreateChatbotDialog } from "@/components/dashboard/chatbots/CreateChatbotDialog";
import { ChatbotCard } from "@/components/dashboard/chatbots/ChatbotCard";
import { EmptyChatbotsState } from "@/components/dashboard/chatbots/EmptyChatbotsState";
import { PaginationControls } from "@/components/dashboard/files/PaginationControls";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 4;

export default function ChatbotsPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chatbotToDelete, setChatbotToDelete] = useState<string | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch chatbots
  const {
    data: chatbotsData,
    isLoading: chatbotsLoading,
    refetch,
  } = trpc.chatbot.list.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  const chatbots = chatbotsData?.chatbots || [];
  const totalCount = chatbotsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Delete chatbot mutation
  const deleteChatbot = trpc.chatbot.delete.useMutation({
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      setChatbotToDelete(null);

      // Refetch to get updated count
      const result = await refetch();
      const newTotalCount = result.data?.totalCount || 0;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);

      // If we're on a page that no longer exists, go back to the last valid page
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

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
              {totalCount > 0 && (
                <span className="ml-2 font-medium text-foreground">
                  ({totalCount} {totalCount === 1 ? "chatbot" : "chatbots"})
                </span>
              )}
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
          <div className="space-y-6">
            {totalCount > ITEMS_PER_PAGE && (
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {chatbots.length} of {totalCount} chatbot
                  {totalCount !== 1 ? "s" : ""}
                </p>
              </div>
            )}
            <div className="grid gap-4">
              {chatbots.map((chatbot) => (
                <ChatbotCard
                  key={chatbot.id}
                  chatbot={chatbot}
                  onDelete={handleDelete}
                />
              ))}
            </div>
            {totalPages > 1 && (
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            )}
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
