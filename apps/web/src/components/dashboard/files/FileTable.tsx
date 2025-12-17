"use client";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Trash2, X, Plus, RefreshCw } from "lucide-react";
import { formatFileSize, formatDate } from "./file-constants";
import { FileStatusBadge } from "./FileStatusBadge";

// Generic file type that works with both list and listForChatbot responses
type BaseFile = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
  metadata?: {
    error?: string;
    chunkCount?: number;
    processedAt?: string;
    processingProgress?: {
      stage: "downloading" | "extracting" | "chunking" | "embedding" | "storing";
      percentage: number;
      currentChunk?: number;
      totalChunks?: number;
      startedAt?: string;
      lastUpdatedAt?: string;
    };
  };
  createdAt?: Date;
};

type ActionType = "delete" | "remove" | "add" | "none";

interface FileTableRowProps<T extends BaseFile> {
  file: T;
  // Checkbox props
  showCheckbox?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (fileId: string) => void;
  // Action props
  actionType?: ActionType;
  onAction?: (fileId: string) => void;
  actionDisabled?: boolean;
  // Retry props
  onRetry?: (fileId: string) => void;
  retryDisabled?: boolean;
  // Display options
  showCreatedDate?: boolean;
}

function FileTableRow<T extends BaseFile>({
  file,
  showCheckbox = false,
  isSelected = false,
  onToggleSelect,
  actionType = "none",
  onAction,
  actionDisabled = false,
  onRetry,
  retryDisabled = false,
  showCreatedDate = false,
}: FileTableRowProps<T>) {
  // Check if file is failed or stuck
  const isStuck =
    file.processingStatus === "processing" &&
    file.metadata?.processingProgress?.lastUpdatedAt &&
    Date.now() -
      new Date(file.metadata.processingProgress.lastUpdatedAt).getTime() >
      30 * 60 * 1000; // 30 minutes

  // Allow retry for failed, stuck, pending, or actively processing files
  const canRetry =
    file.processingStatus === "failed" ||
    file.processingStatus === "pending" ||
    file.processingStatus === "processing"; // Allow cancel/retry even during active processing

  const renderAction = () => {
    if (actionType === "none" || !onAction) return null;

    const commonProps = {
      onClick: () => onAction(file.id),
      disabled: actionDisabled,
    };

    switch (actionType) {
      case "delete":
        return (
          <div className="flex items-center justify-end gap-1 min-w-[72px]">
            {canRetry && onRetry && (
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onRetry(file.id);
                }}
                disabled={retryDisabled}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8 flex-shrink-0"
                title={
                  file.processingStatus === "processing" && !isStuck
                    ? "Cancel and restart processing"
                    : "Retry processing"
                }
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              {...commonProps}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 flex-shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      case "remove":
        return (
          <Button
            variant="ghost"
            size="sm"
            {...commonProps}
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-2" />
            Remove
          </Button>
        );
      case "add":
        return (
          <Button size="sm" variant="outline" {...commonProps}>
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/50"
      onClick={() => {
        if (showCheckbox && onToggleSelect) {
          onToggleSelect(file.id);
        }
      }}
    >
      {showCheckbox && onToggleSelect && (
        <TableCell
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(file.id);
          }}
        >
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(file.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
            aria-label={`Select ${file.fileName}`}
          />
        </TableCell>
      )}
      <TableCell>
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <FileText className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium truncate">{file.fileName}</span>
        </div>
      </TableCell>
      <TableCell>
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {file.fileType.split("/")[1]?.toUpperCase() || file.fileType}
        </span>
      </TableCell>
      <TableCell>
        <span className="text-sm whitespace-nowrap">
          {formatFileSize(file.fileSize)}
        </span>
      </TableCell>
      <TableCell>
        <FileStatusBadge
          status={file.processingStatus}
          metadata={file.metadata}
          showProgress={true}
          size="sm"
        />
      </TableCell>
      {showCreatedDate && file.createdAt && (
        <TableCell>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(file.createdAt)}
          </span>
        </TableCell>
      )}
      {actionType !== "none" && (
        <TableCell
          onClick={(e) => {
            e.stopPropagation();
          }}
          className="text-right"
        >
          {renderAction()}
        </TableCell>
      )}
    </TableRow>
  );
}

interface FileTableProps<T extends BaseFile> {
  files: T[];
  // Checkbox props
  showCheckbox?: boolean;
  selectedFiles?: Set<string>;
  onToggleSelect?: (fileId: string) => void;
  onSelectAll?: () => void;
  allSelected?: boolean;
  // Action props
  actionType?: ActionType;
  onAction?: (fileId: string) => void;
  actionDisabled?: boolean;
  // Retry props
  onRetry?: (fileId: string) => void;
  retryDisabled?: boolean;
  // Display options
  showCreatedDate?: boolean;
  // Empty state
  emptyMessage?: string;
}

export function FileTable<T extends BaseFile>({
  files,
  showCheckbox = false,
  selectedFiles,
  onToggleSelect,
  onSelectAll,
  allSelected = false,
  actionType = "none",
  onAction,
  actionDisabled = false,
  onRetry,
  retryDisabled = false,
  showCreatedDate = false,
  emptyMessage = "No files found",
}: FileTableProps<T>) {
  if (files.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  // Use percentage-based widths for consistent alignment across all tables
  const hasCheckbox = showCheckbox && onSelectAll;
  const hasCreated = showCreatedDate;
  const hasActions = actionType !== "none";

  // Calculate file name width: remaining space after other columns
  // Status: 20% for progress bars, Actions: 12% for consistent button spacing
  const fixedWidth =
    (hasCheckbox ? 3 : 0) +
    10 +
    10 +
    20 +
    (hasCreated ? 15 : 0) +
    (hasActions ? 12 : 0);
  const fileNameWidth = 100 - fixedWidth;

  return (
    <Table style={{ tableLayout: "fixed" }}>
      <colgroup>
        {hasCheckbox && <col style={{ width: "3%" }} />}
        <col style={{ width: `${fileNameWidth}%` }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "20%" }} />
        {hasCreated && <col style={{ width: "15%" }} />}
        {hasActions && <col style={{ width: "12%" }} />}
      </colgroup>
      <TableHeader>
        <TableRow>
          {showCheckbox && onSelectAll && (
            <TableHead>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                aria-label="Select all files"
              />
            </TableHead>
          )}
          <TableHead>File Name</TableHead>
          <TableHead className="whitespace-nowrap">Type</TableHead>
          <TableHead className="whitespace-nowrap">Size</TableHead>
          <TableHead className="whitespace-nowrap">Status</TableHead>
          {showCreatedDate && (
            <TableHead className="whitespace-nowrap">Created</TableHead>
          )}
          {actionType !== "none" && (
            <TableHead className="whitespace-nowrap text-right">Actions</TableHead>
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        {files.map((file) => (
          <FileTableRow
            key={file.id}
            file={file}
            showCheckbox={showCheckbox}
            isSelected={selectedFiles?.has(file.id)}
            onToggleSelect={onToggleSelect}
            actionType={actionType}
            onAction={onAction}
            actionDisabled={actionDisabled}
            onRetry={onRetry}
            retryDisabled={retryDisabled}
            showCreatedDate={showCreatedDate}
          />
        ))}
      </TableBody>
    </Table>
  );
}
