"use client";

import { Card, CardContent } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { trpc } from "@/lib/trpc";
import { useFilePolling } from "@/hooks/useFilePolling";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { UploadFileDialog } from "@/components/dashboard/files/UploadFileDialog";
import { FileTable } from "@/components/dashboard/files/FileTable";
import { EmptyFilesState } from "@/components/dashboard/files/EmptyFilesState";
import { PaginationControls } from "@/components/dashboard/files/PaginationControls";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

const ITEMS_PER_PAGE = 10;

export default function FilesPage() {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [retryDialogOpen, setRetryDialogOpen] = useState(false);
  const [fileToRetry, setFileToRetry] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());

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

  const files = useMemo(() => filesData?.files || [], [filesData?.files]);
  const totalCount = filesData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Check if all files on current page are selected
  const allSelected = useMemo(() => {
    return (
      files.length > 0 && files.every((file) => selectedFiles.has(file.id))
    );
  }, [files, selectedFiles]);

  // Delete file mutation
  const deleteFile = trpc.files.delete.useMutation({
    onSuccess: async () => {
      // Refetch to get updated count
      const result = await refetch();
      const newTotalCount = result.data?.totalCount || 0;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);

      // If we're on a page that no longer exists, go back to the last valid page
      if (currentPage >= newTotalPages && newTotalPages > 0) {
        setCurrentPage(newTotalPages - 1);
      }

      // Clear selection after deletion
      setSelectedFiles(new Set());
    },
    onError: (error) => {
      toast.error("Failed to delete file", {
        description: error.message,
      });
    },
  });

  // Retry file mutation
  const retryFile = trpc.files.retry.useMutation({
    onSuccess: (_, variables) => {
      const file = files.find((f) => f.id === variables.fileId);
      const wasProcessing =
        file?.processingStatus === "processing" && 
        file?.metadata?.processingProgress?.lastUpdatedAt &&
        Date.now() - new Date(file.metadata.processingProgress.lastUpdatedAt).getTime() < 30 * 60 * 1000;
      
      toast.success(
        wasProcessing ? "Processing cancelled and restarted" : "File processing restarted",
        {
          description: wasProcessing 
            ? "The file will be processed again from the beginning"
            : "The file will be processed again",
        },
      );
      refetch();
    },
    onError: (error) => {
      toast.error("Failed to retry file", {
        description: error.message,
      });
    },
  });

  const handleDeleteFiles = async () => {
    if (filesToDelete.length === 0) return;

    const toastId = toast.loading(
      `Deleting ${filesToDelete.length} file${filesToDelete.length !== 1 ? "s" : ""}...`,
    );

    let successCount = 0;
    let errorCount = 0;

    // Delete files sequentially to avoid overwhelming the server
    for (const fileId of filesToDelete) {
      try {
        await deleteFile.mutateAsync({ fileId });
        successCount++;
      } catch {
        errorCount++;
      }
    }

    setDeleteDialogOpen(false);
    setFilesToDelete([]);
    setSelectedFiles(new Set());

    // Show summary toast
    if (successCount > 0 && errorCount === 0) {
      toast.success(
        `Successfully deleted ${successCount} file${successCount !== 1 ? "s" : ""}`,
        {
          id: toastId,
        },
      );
    } else if (successCount > 0 && errorCount > 0) {
      toast.warning(
        `Deleted ${successCount} file${successCount !== 1 ? "s" : ""}, ${errorCount} failed`,
        {
          id: toastId,
        },
      );
    } else {
      toast.error("Failed to delete files", {
        id: toastId,
        description: "Please try again",
      });
    }
  };

  const handleDelete = (fileId: string) => {
    setFilesToDelete([fileId]);
    setDeleteDialogOpen(true);
  };

  const handleRetry = (fileId: string) => {
    const file = files.find((f) => f.id === fileId);
    const isActivelyProcessing =
      file?.processingStatus === "processing" &&
      file?.metadata?.processingProgress?.lastUpdatedAt &&
      Date.now() -
        new Date(file.metadata.processingProgress.lastUpdatedAt).getTime() <
        30 * 60 * 1000;

    // Show confirmation for actively processing files
    if (isActivelyProcessing) {
      setFileToRetry(fileId);
      setRetryDialogOpen(true);
    } else {
      retryFile.mutate({ fileId });
    }
  };

  const confirmRetry = () => {
    if (fileToRetry) {
      retryFile.mutate({ fileId: fileToRetry });
      setRetryDialogOpen(false);
      setFileToRetry(null);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedFiles.size === 0) return;
    setFilesToDelete(Array.from(selectedFiles));
    setDeleteDialogOpen(true);
  };

  const handleToggleFile = (fileId: string) => {
    setSelectedFiles((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(fileId)) {
        newSet.delete(fileId);
      } else {
        newSet.add(fileId);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      // Deselect all files on current page
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        files.forEach((file) => newSet.delete(file.id));
        return newSet;
      });
    } else {
      // Select all files on current page
      setSelectedFiles((prev) => {
        const newSet = new Set(prev);
        files.forEach((file) => newSet.add(file.id));
        return newSet;
      });
    }
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
                <div className="flex justify-between items-center min-h-[40px]">
                  {totalCount > ITEMS_PER_PAGE ? (
                    <p className="text-sm text-muted-foreground">
                      Showing {files.length} of {totalCount} file
                      {totalCount !== 1 ? "s" : ""}
                    </p>
                  ) : (
                    <div />
                  )}
                  <div className="min-w-[180px] flex justify-end">
                    {selectedFiles.size > 0 && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={handleDeleteSelected}
                        disabled={deleteFile.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Selected ({selectedFiles.size})
                      </Button>
                    )}
                  </div>
                </div>
                <FileTable
                  files={files.map((file) => ({
                    ...file,
                    metadata: file.metadata || undefined,
                  }))}
                  showCheckbox
                  selectedFiles={selectedFiles}
                  onToggleSelect={handleToggleFile}
                  onSelectAll={handleSelectAll}
                  allSelected={allSelected}
                  actionType="delete"
                  onAction={handleDelete}
                  actionDisabled={deleteFile.isPending}
                  onRetry={handleRetry}
                  retryDisabled={retryFile.isPending}
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
        onConfirm={handleDeleteFiles}
        title={
          filesToDelete.length === 1
            ? "Delete File"
            : `Delete ${filesToDelete.length} Files`
        }
        description={
          filesToDelete.length === 1
            ? "Are you sure you want to delete this file? This action cannot be undone and will remove it from all chatbots it's associated with."
            : `Are you sure you want to delete ${filesToDelete.length} files? This action cannot be undone and will remove them from all chatbots they're associated with.`
        }
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
        loading={deleteFile.isPending}
      />

      {/* Retry Confirmation Dialog */}
      <ConfirmationDialog
        open={retryDialogOpen}
        onOpenChange={(open) => {
          setRetryDialogOpen(open);
          if (!open) setFileToRetry(null);
        }}
        onConfirm={confirmRetry}
        title="Cancel and Restart Processing?"
        description="This file is currently being processed. Are you sure you want to cancel and restart from the beginning? All current progress will be lost."
        confirmText="Cancel and Restart"
        cancelText="Keep Processing"
        variant="default"
        loading={retryFile.isPending}
      />
    </div>
  );
}
