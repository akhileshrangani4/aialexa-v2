"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Plus } from "lucide-react";
import type { RouterOutputs } from "@/lib/trpc";

type FileData = RouterOutputs["files"]["list"][number];

interface QuickAddFilesSectionProps {
  files: FileData[];
  associatedFileIds: string[];
  onAddFile: (fileId: string) => void;
  isAdding?: boolean;
}

export function QuickAddFilesSection({
  files,
  associatedFileIds,
  onAddFile,
  isAdding = false,
}: QuickAddFilesSectionProps) {
  const availableFiles = files.filter(
    (file) => !associatedFileIds.includes(file.id),
  );

  if (availableFiles.length === 0) {
    return null;
  }

  return (
    <div className="mt-6">
      <p className="text-sm font-medium mb-3">
        Quick add files from your library:
      </p>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {availableFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 border rounded-lg"
          >
            <div className="flex items-center gap-3">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{file.fileName}</p>
                <Badge
                  variant={
                    file.processingStatus === "completed"
                      ? "default"
                      : file.processingStatus === "failed"
                        ? "destructive"
                        : "secondary"
                  }
                  className="text-xs mt-1"
                >
                  {file.processingStatus}
                </Badge>
              </div>
            </div>
            <Button
              size="sm"
              onClick={() => onAddFile(file.id)}
              disabled={isAdding}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
