"use client";

import { FileText } from "lucide-react";
import Link from "next/link";
import { QuickAddFilesSection } from "./QuickAddFilesSection";

interface EmptyChatbotFilesStateProps {
  associatedFileIds: string[];
  onAddFile: (fileId: string) => void;
  onAddFiles?: (fileIds: string[]) => void;
  isAdding?: boolean;
  onRefetch?: () => void;
}

export function EmptyChatbotFilesState({
  associatedFileIds,
  onAddFile,
  onAddFiles,
  isAdding = false,
  onRefetch,
}: EmptyChatbotFilesStateProps) {
  return (
    <div className="text-center py-12">
      <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
      <p className="text-muted-foreground mb-4">
        No files associated with this chatbot yet.
      </p>
      <p className="text-sm text-muted-foreground mb-4">
        Upload files from the{" "}
        <Link href="/dashboard/files" className="text-primary underline">
          Files page
        </Link>{" "}
        and then associate them with this chatbot.
      </p>
      <QuickAddFilesSection
        associatedFileIds={associatedFileIds}
        onAddFile={onAddFile}
        onAddFiles={onAddFiles}
        isAdding={isAdding}
        onRefetch={onRefetch}
      />
    </div>
  );
}
