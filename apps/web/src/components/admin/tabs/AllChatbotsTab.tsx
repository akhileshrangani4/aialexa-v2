"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useSession } from "@/lib/auth-client";
import { toast } from "sonner";
import { ChatbotTableRow } from "../ChatbotTableRow";
import { PaginationControls } from "../../dashboard/files/PaginationControls";

const ITEMS_PER_PAGE = 10;

type DeleteDialogState = {
  isOpen: boolean;
  chatbotId: string | null;
  chatbotName: string | null;
  ownerName: string | null;
};

export function AllChatbotsTab() {
  const { data: session } = useSession();
  const currentUserId = session?.user?.id;
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteChatbotDialog, setDeleteChatbotDialog] =
    useState<DeleteDialogState>({
      isOpen: false,
      chatbotId: null,
      chatbotName: null,
      ownerName: null,
    });

  const {
    data: chatbotsData,
    isLoading: chatbotsLoading,
    refetch: refetchChatbots,
  } = trpc.admin.getAllChatbots.useQuery({
    limit: ITEMS_PER_PAGE,
    offset: currentPage * ITEMS_PER_PAGE,
  });

  const allChatbots = chatbotsData?.chatbots || [];
  const totalCount = chatbotsData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  const deleteChatbot = trpc.admin.deleteChatbot.useMutation({
    onSuccess: () => {
      refetchChatbots();
      toast.success("Chatbot deleted successfully", {
        description: "The chatbot and all associated data have been removed",
      });
    },
    onError: (error) => {
      toast.error("Failed to delete chatbot", {
        description: error.message,
      });
    },
  });

  const handleDeleteChatbot = (
    chatbotId: string,
    chatbotName: string,
    ownerName: string,
  ) => {
    setDeleteChatbotDialog({
      isOpen: true,
      chatbotId,
      chatbotName,
      ownerName,
    });
  };

  const confirmDeleteChatbot = async () => {
    if (!deleteChatbotDialog.chatbotId) return;
    await deleteChatbot.mutateAsync({
      chatbotId: deleteChatbotDialog.chatbotId,
    });
    setDeleteChatbotDialog({
      isOpen: false,
      chatbotId: null,
      chatbotName: null,
      ownerName: null,
    });
  };

  const closeDeleteDialog = () => {
    setDeleteChatbotDialog({
      isOpen: false,
      chatbotId: null,
      chatbotName: null,
      ownerName: null,
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>All Chatbots</CardTitle>
          <CardDescription>
            View and manage all chatbots in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {deleteChatbot.error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{deleteChatbot.error.message}</AlertDescription>
            </Alert>
          )}

          {chatbotsLoading ? (
            <p className="text-center py-8 text-muted-foreground">
              Loading chatbots...
            </p>
          ) : allChatbots.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No chatbots found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Showing {allChatbots.length} of {totalCount} chatbot
                  {totalCount !== 1 ? "s" : ""}
                </p>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Model</TableHead>
                    <TableHead>Files</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allChatbots.map((chatbot) => (
                    <ChatbotTableRow
                      key={chatbot.id}
                      chatbot={chatbot}
                      currentUserId={currentUserId}
                      onDelete={handleDeleteChatbot}
                      onRefetch={refetchChatbots}
                    />
                  ))}
                </TableBody>
              </Table>

              {totalPages > 1 && (
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteChatbotDialog.isOpen}
        onOpenChange={(open) => !open && closeDeleteDialog()}
        onConfirm={confirmDeleteChatbot}
        title="Delete Chatbot"
        description={
          <>
            Are you sure you want to delete the chatbot{" "}
            <strong>{deleteChatbotDialog.chatbotName}</strong> owned by{" "}
            <strong>{deleteChatbotDialog.ownerName}</strong>?
            <br />
            <br />
            <span className="text-destructive font-semibold">
              Warning: This action cannot be undone.
            </span>{" "}
            All associated data including files, conversations, and analytics
            will be permanently removed from the system.
          </>
        }
        confirmText="Delete Chatbot"
        variant="destructive"
        loading={deleteChatbot.isPending}
      />
    </>
  );
}
