"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useFilePolling } from "@/hooks/useFilePolling";
import { useState } from "react";
import { toast } from "sonner";
import { UploadFileDialog } from "@/components/dashboard/files/UploadFileDialog";
import { FileTable } from "@/components/dashboard/files/FileTable";
import { EmptyFilesState } from "@/components/dashboard/files/EmptyFilesState";
import { PaginationControls } from "@/components/dashboard/files/PaginationControls";

const ITEMS_PER_PAGE = 10;

export default function FilesPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);

  // Get all user files (centralized)
  // Automatically polls for status updates when files are processing
  const {
    data: filesData,
    isLoading: filesLoading,
    refetch,
  } = trpc.files.list.useQuery(
    {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
    },
    {
      refetchInterval: useFilePolling(),
    },
  );

  const files = filesData?.files || [];
  const totalCount = filesData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: async () => {
      setDeleteDialogOpen(false);
      setFileToDelete(null);

      // Refetch to get updated count
      const result = await refetch();
      const newTotalCount = result.data?.totalCount || 0;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);

      // If we're on a page that no longer exists, go back to the last valid page
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

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
              {totalCount > 0 && (
                <span className="ml-2 font-medium text-foreground">
                  ({totalCount} {totalCount === 1 ? "file" : "files"})
                </span>
              )}
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
          <Card>
            <CardContent className="p-6">
              <div className="space-y-4">
                {totalCount > ITEMS_PER_PAGE && (
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Showing {files.length} of {totalCount} file
                      {totalCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                )}
                <FileTable
                  files={files}
                  actionType="delete"
                  onAction={handleDelete}
                  showCreatedDate
                />
                {totalPages > 1 && (
                  <div className="mt-4">
                    <PaginationControls
                      currentPage={currentPage}
                      totalPages={totalPages}
                      onPageChange={setCurrentPage}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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
