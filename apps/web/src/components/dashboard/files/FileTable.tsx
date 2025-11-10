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
import { FileText, Trash2, X, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatFileSize, formatDate, getStatusColor } from "./file-constants";

// Generic file type that works with both list and listForChatbot responses
type BaseFile = {
  id: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  processingStatus: string;
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
  showCreatedDate = false,
}: FileTableRowProps<T>) {
  const renderAction = () => {
    if (actionType === "none" || !onAction) return null;

    const commonProps = {
      onClick: () => onAction(file.id),
      disabled: actionDisabled,
    };

    switch (actionType) {
      case "delete":
        return (
          <Button
            variant="ghost"
            size="icon"
            {...commonProps}
            className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
    <TableRow>
      {showCheckbox && onToggleSelect && (
        <TableCell>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => onToggleSelect(file.id)}
            className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
        <span
          className={cn(
            "text-sm font-medium whitespace-nowrap",
            getStatusColor(file.processingStatus),
          )}
        >
          {file.processingStatus.charAt(0).toUpperCase() +
            file.processingStatus.slice(1)}
        </span>
      </TableCell>
      {showCreatedDate && file.createdAt && (
        <TableCell>
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {formatDate(file.createdAt)}
          </span>
        </TableCell>
      )}
      {actionType !== "none" && (
        <TableCell>
          <div className="flex justify-start">{renderAction()}</div>
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
  const fixedWidth =
    (hasCheckbox ? 3 : 0) +
    10 +
    10 +
    12 +
    (hasCreated ? 15 : 0) +
    (hasActions ? 15 : 0);
  const fileNameWidth = 100 - fixedWidth;

  return (
    <Table style={{ tableLayout: "fixed" }}>
      <colgroup>
        {hasCheckbox && <col style={{ width: "3%" }} />}
        <col style={{ width: `${fileNameWidth}%` }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "10%" }} />
        <col style={{ width: "12%" }} />
        {hasCreated && <col style={{ width: "15%" }} />}
        {hasActions && <col style={{ width: "15%" }} />}
      </colgroup>
      <TableHeader>
        <TableRow>
          {showCheckbox && onSelectAll && (
            <TableHead>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={onSelectAll}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
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
            <TableHead className="whitespace-nowrap">Actions</TableHead>
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
            showCreatedDate={showCreatedDate}
          />
        ))}
      </TableBody>
    </Table>
  );
}
