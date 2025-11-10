"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useFilePolling } from "@/hooks/useFilePolling";
import { useState } from "react";
import { toast } from "sonner";
import { UploadFileDialog } from "@/components/dashboard/files/UploadFileDialog";
import { FileCard } from "@/components/dashboard/files/FileCard";
import { EmptyFilesState } from "@/components/dashboard/files/EmptyFilesState";

export default function FilesPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);

  // Get all user files (centralized)
  // Automatically polls for status updates when files are processing
  const {
    data: files,
    isLoading: filesLoading,
    refetch,
  } = trpc.files.list.useQuery(undefined, {
    refetchInterval: useFilePolling(),
  });

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: () => {
      setDeleteDialogOpen(false);
      setFileToDelete(null);
      refetch();
      toast.success("File deleted successfully");
    },
    onError: (error) => {
      toast.error("Failed to delete file", {
        description: error.message,
      });
    },
  });

  const handleDeleteFile = () => {
    if (fileToDelete) {
      deleteFile.mutate({ fileId: fileToDelete });
    }
  };

  const handleDelete = (fileId: string) => {
    setFileToDelete(fileId);
    setDeleteDialogOpen(true);
  };

  return (
    <div className="flex-1 p-8 bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Files
            </h1>
            <p className="text-muted-foreground mt-2 text-lg">
              List of all of your imported and crawled files.
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="border-2">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-xl font-semibold">Upload Files</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload files to your centralized library. You can then
                  associate them with any chatbot.
                </p>
              </div>
              <UploadFileDialog onSuccess={refetch} existingFiles={files} />
            </div>
          </CardContent>
        </Card>

        {/* Display all files */}
        {filesLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : !files || files.length === 0 ? (
          <EmptyFilesState />
        ) : (
          <div className="space-y-4">
            {files.map((file) => (
              <FileCard key={file.id} file={file} onDelete={handleDelete} />
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteFile}
        title="Delete File"
        description="Are you sure you want to delete this file? This action cannot be undone and will remove it from all chatbots it's associated with."
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteFile.isPending}
      />
    </div>
  );
}
