"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { FileTable } from "@/components/dashboard/files/FileTable";
import { PaginationControls } from "@/components/dashboard/files/PaginationControls";
import { useFilePolling } from "@/hooks/useFilePolling";
import type { RouterOutputs } from "@/lib/trpc";

type FileData = RouterOutputs["files"]["list"]["files"][number];

const ITEMS_PER_PAGE = 10;

interface QuickAddFilesSectionProps {
  associatedFileIds: string[];
  onAddFile: (fileId: string) => void;
  onAddFiles?: (fileIds: string[]) => void;
  isAdding?: boolean;
  onRefetch?: () => void;
}

export function QuickAddFilesSection({
  associatedFileIds,
  onAddFile,
  onAddFiles,
  isAdding = false,
  onRefetch,
}: QuickAddFilesSectionProps) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(0);

  // Fetch paginated files
  const {
    data: filesData,
    isLoading: filesLoading,
    refetch: refetchFiles,
  } = trpc.files.list.useQuery(
    {
      limit: ITEMS_PER_PAGE,
      offset: currentPage * ITEMS_PER_PAGE,
    },
    {
      refetchInterval: useFilePolling(),
    },
  );

  const allFiles = filesData?.files || [];
  const totalCount = filesData?.totalCount || 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Filter out already associated files
  const availableFiles = allFiles.filter(
    (file: FileData) => !associatedFileIds.includes(file.id),
  );

  // Automatically remove files from selection that are no longer available
  // (i.e., they were successfully added)
  useEffect(() => {
    setSelectedFiles((prev) => {
      const newSelected = new Set(prev);
      let changed = false;
      for (const fileId of prev) {
        if (!availableFiles.some((f: FileData) => f.id === fileId)) {
          newSelected.delete(fileId);
          changed = true;
        }
      }
      return changed ? newSelected : prev;
    });
  }, [availableFiles]);

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
    if (selectedFiles.size === availableFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(availableFiles.map((f: FileData) => f.id)));
    }
  };

  const handleAddSelected = async () => {
    if (selectedFiles.size === 0) return;

    const filesToAdd = Array.from(selectedFiles);

    if (onAddFiles) {
      await onAddFiles(filesToAdd);
    } else {
      // Fallback to individual adds
      for (const fileId of filesToAdd) {
        await new Promise<void>((resolve) => {
          onAddFile(fileId);
          // Small delay to avoid overwhelming the server
          setTimeout(resolve, 100);
        });
      }
    }

    // Refetch to update available files
    await refetchFiles();
    if (onRefetch) {
      await onRefetch();
    }

    // Clear selection after adding
    setSelectedFiles(new Set());
  };

  const allSelected =
    selectedFiles.size === availableFiles.length && availableFiles.length > 0;

  // Don't show if no files available at all
  if (
    totalCount === 0 ||
    (allFiles.length > 0 && availableFiles.length === 0 && currentPage === 0)
  ) {
    return null;
  }

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">
          Quick add files from your library:
        </p>
        {selectedFiles.size > 0 && (
          <Button size="sm" onClick={handleAddSelected} disabled={isAdding}>
            <Plus className="h-4 w-4 mr-2" />
            Add Selected ({selectedFiles.size})
          </Button>
        )}
      </div>
      {filesLoading ? (
        <div className="text-center py-4">
          <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm text-muted-foreground">Loading files...</p>
        </div>
      ) : availableFiles.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          No more files available to add.
        </p>
      ) : (
        <>
          <FileTable
            files={availableFiles}
            showCheckbox
            selectedFiles={selectedFiles}
            onToggleSelect={handleToggleFile}
            onSelectAll={handleSelectAll}
            allSelected={allSelected}
            actionType="add"
            onAction={onAddFile}
            actionDisabled={isAdding}
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
        </>
      )}
    </div>
  );
}
