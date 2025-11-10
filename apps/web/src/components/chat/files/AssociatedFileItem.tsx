"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, X } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc";
import { formatFileSize } from "@/components/dashboard/files/file-constants";

type FileData = RouterOutputs["files"]["listForChatbot"][number];

interface AssociatedFileItemProps {
  file: FileData;
  onRemove: (fileId: string) => void;
  isRemoving?: boolean;
}

export function AssociatedFileItem({
  file,
  onRemove,
  isRemoving = false,
}: AssociatedFileItemProps) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        <FileText className="h-5 w-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{file.fileName}</p>
          <div className="flex items-center gap-2 mt-1">
            <Badge
              variant={
                file.processingStatus === "completed"
                  ? "default"
                  : file.processingStatus === "failed"
                    ? "destructive"
                    : "secondary"
              }
              className="text-xs"
            >
              {file.processingStatus}
            </Badge>
            <span className="text-xs text-muted-foreground">
              {formatFileSize(file.fileSize)}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onRemove(file.id)}
        disabled={isRemoving}
      >
        <X className="h-4 w-4 mr-2" />
        Remove
      </Button>
    </div>
  );
}
