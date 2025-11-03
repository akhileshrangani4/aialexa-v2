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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function AllChatbotsTab() {
  const [deleteChatbotDialog, setDeleteChatbotDialog] = useState<{
    isOpen: boolean;
    chatbotId: string | null;
    chatbotName: string | null;
    ownerName: string | null;
  }>({
    isOpen: false,
    chatbotId: null,
    chatbotName: null,
    ownerName: null,
  });

  const {
    data: allChatbots,
    isLoading: chatbotsLoading,
    refetch: refetchChatbots,
  } = trpc.admin.getAllChatbots.useQuery();

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
          ) : !allChatbots || allChatbots.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No chatbots found</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  Total: {allChatbots.length} chatbot
                  {allChatbots.length !== 1 ? "s" : ""}
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
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allChatbots.map((chatbot) => (
                    <TableRow key={chatbot.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{chatbot.name}</p>
                          {chatbot.description && (
                            <p className="text-xs text-muted-foreground truncate max-w-xs">
                              {chatbot.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm">
                            {chatbot.userName || "Unknown"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {chatbot.userEmail}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">
                          {chatbot.model.split("/").pop()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {chatbot.fileCount} file
                          {chatbot.fileCount !== 1 ? "s" : ""}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p>
                            {new Date(chatbot.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(chatbot.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            handleDeleteChatbot(
                              chatbot.id,
                              chatbot.name,
                              chatbot.userName || "Unknown User",
                            )
                          }
                          disabled={deleteChatbot.isPending}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Chatbot Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteChatbotDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setDeleteChatbotDialog({
            isOpen: false,
            chatbotId: null,
            chatbotName: null,
            ownerName: null,
          })
        }
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
