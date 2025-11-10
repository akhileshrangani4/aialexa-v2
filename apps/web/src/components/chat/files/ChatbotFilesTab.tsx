"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Link from "next/link";
import { FileTable } from "@/components/dashboard/files/FileTable";
import { EmptyChatbotFilesState } from "./EmptyChatbotFilesState";
import { QuickAddFilesSection } from "./QuickAddFilesSection";
import { PaginationControls } from "@/components/dashboard/files/PaginationControls";
import { X } from "lucide-react";
import { useFilePolling } from "@/hooks/useFilePolling";

const ITEMS_PER_PAGE = 10;

interface ChatbotFilesTabProps {
  chatbotId: string;
  filesLoading: boolean;
  onRefetch: () => void;
}

export function ChatbotFilesTab({
  chatbotId,
  filesLoading,
  onRefetch,
}: ChatbotFilesTabProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [associatedFilesPage, setAssociatedFilesPage] = useState(0);

  // Fetch paginated associated files
  const {
    data: associatedFilesData,
    isLoading: associatedFilesLoading,
    refetch: refetchAssociatedFiles,
  } = trpc.files.listForChatbot.useQuery(
    {
      chatbotId,
      limit: ITEMS_PER_PAGE,
      offset: associatedFilesPage * ITEMS_PER_PAGE,
    },
    {
      enabled: !!chatbotId,
      refetchInterval: useFilePolling(),
    },
  );

  const associatedFiles = useMemo(
    () => associatedFilesData?.files || [],
    [associatedFilesData?.files],
  );
  const associatedFilesTotalCount = associatedFilesData?.totalCount || 0;
  const associatedFilesTotalPages = Math.ceil(
    associatedFilesTotalCount / ITEMS_PER_PAGE,
  );

  // Automatically remove files from selection that are no longer associated
  useEffect(() => {
    if (associatedFiles.length > 0) {
      setSelectedFiles((prev) => {
        const newSelected = new Set(prev);
        let changed = false;
        for (const fileId of prev) {
          if (!associatedFiles.some((f: { id: string }) => f.id === fileId)) {
            newSelected.delete(fileId);
            changed = true;
          }
        }
        return changed ? newSelected : prev;
      });
    }
  }, [associatedFiles]);

  // Associate/disassociate file mutations
  const associateFile = trpc.files.associateWithChatbot.useMutation({
    onSuccess: async () => {
      await refetchAssociatedFiles();
      onRefetch();
      toast.success("File added to chatbot");
    },
    onError: (error) => {
      toast.error("Failed to add file", {
        description: error.message,
      });
    },
  });

  const disassociateFile = trpc.files.disassociateFromChatbot.useMutation({
    onSuccess: async () => {
      await refetchAssociatedFiles();
      onRefetch();

      // Adjust page if current page no longer exists
      const result = await refetchAssociatedFiles();
      const newTotalCount = result.data?.totalCount || 0;
      const newTotalPages = Math.ceil(newTotalCount / ITEMS_PER_PAGE);
      if (associatedFilesPage >= newTotalPages && newTotalPages > 0) {
        setAssociatedFilesPage(newTotalPages - 1);
      }

      toast.success("File removed from chatbot");
    },
    onError: (error) => {
      toast.error("Failed to remove file", {
        description: error.message,
      });
    },
  });

  const handleAddFile = (fileId: string) => {
    associateFile.mutate({
      fileId,
      chatbotId,
    });
  };

  const handleAddFiles = async (fileIds: string[]) => {
    // Process files sequentially to avoid overwhelming the server
    for (const fileId of fileIds) {
      try {
        await associateFile.mutateAsync({
          fileId,
          chatbotId,
        });
      } catch (error) {
        // Continue with other files even if one fails
        console.error(`Failed to add file ${fileId}:`, error);
      }
    }
    // Refetch after all files are processed
    onRefetch();
    toast.success(
      `${fileIds.length} file${fileIds.length !== 1 ? "s" : ""} added to chatbot`,
    );
  };

  const handleRemoveFile = (fileId: string) => {
    disassociateFile.mutate({
      fileId,
      chatbotId,
    });
  };

  const handleRemoveFiles = async (fileIds: string[]) => {
    // Process files sequentially to avoid overwhelming the server
    for (const fileId of fileIds) {
      try {
        await disassociateFile.mutateAsync({
          fileId,
          chatbotId,
        });
      } catch (error) {
        // Continue with other files even if one fails
        console.error(`Failed to remove file ${fileId}:`, error);
      }
    }
    // Refetch after all files are processed
    onRefetch();
    toast.success(
      `${fileIds.length} file${fileIds.length !== 1 ? "s" : ""} removed from chatbot`,
    );
    setSelectedFiles(new Set());
  };

  const handleToggleFile = (fileId: string) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId);
    } else {
      newSelected.add(fileId);
    }
    setSelectedFiles(newSelected);
  };

  const handleSelectAll = () => {
    if (!associatedFiles || associatedFiles.length === 0) return;
    if (selectedFiles.size === associatedFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(associatedFiles.map((f) => f.id)));
    }
  };

  const associatedFileIds = useMemo(
    () => associatedFiles.map((f: { id: string }) => f.id),
    [associatedFiles],
  );
  const allSelected =
    selectedFiles.size === associatedFiles.length && associatedFiles.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Associated Files</CardTitle>
        <CardDescription>
          Files that provide context for this chatbot. Manage files from the{" "}
          <Link href="/dashboard/files" className="text-primary underline">
            Files page
          </Link>
          .
        </CardDescription>
      </CardHeader>
      <CardContent>
        {filesLoading || associatedFilesLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Loading files...</p>
          </div>
        ) : !associatedFiles || associatedFiles.length === 0 ? (
          <EmptyChatbotFilesState
            associatedFileIds={associatedFileIds}
            onAddFile={handleAddFile}
            onAddFiles={handleAddFiles}
            isAdding={associateFile.isPending}
            onRefetch={refetchAssociatedFiles}
          />
        ) : (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  {associatedFilesTotalCount > 0 && (
                    <>
                      {associatedFilesTotalCount} file
                      {associatedFilesTotalCount !== 1 ? "s" : ""} associated
                      {associatedFilesTotalCount > ITEMS_PER_PAGE && (
                        <span className="ml-2">
                          (Showing {associatedFiles.length} of{" "}
                          {associatedFilesTotalCount})
                        </span>
                      )}
                    </>
                  )}
                </p>
                {selectedFiles.size > 0 && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleRemoveFiles(Array.from(selectedFiles))}
                    disabled={disassociateFile.isPending}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Remove Selected ({selectedFiles.size})
                  </Button>
                )}
              </div>
              <FileTable
                files={associatedFiles}
                showCheckbox
                selectedFiles={selectedFiles}
                onToggleSelect={handleToggleFile}
                onSelectAll={handleSelectAll}
                allSelected={allSelected}
                actionType="remove"
                onAction={handleRemoveFile}
                actionDisabled={disassociateFile.isPending}
              />
              {associatedFilesTotalPages > 1 && (
                <div className="mt-4">
                  <PaginationControls
                    currentPage={associatedFilesPage}
                    totalPages={associatedFilesTotalPages}
                    onPageChange={setAssociatedFilesPage}
                  />
                </div>
              )}
            </div>

            {/* Show QuickAddFilesSection even when files are already associated */}
            <QuickAddFilesSection
              associatedFileIds={associatedFileIds}
              onAddFile={handleAddFile}
              onAddFiles={handleAddFiles}
              isAdding={associateFile.isPending}
              onRefetch={refetchAssociatedFiles}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
