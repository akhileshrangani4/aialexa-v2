"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import Link from "next/link";
import { AssociatedFileItem } from "./AssociatedFileItem";
import { EmptyChatbotFilesState } from "./EmptyChatbotFilesState";
import type { RouterOutputs } from "@/lib/trpc";

type AssociatedFile = RouterOutputs["files"]["listForChatbot"][number];
type AllFile = RouterOutputs["files"]["list"][number];

interface ChatbotFilesTabProps {
  chatbotId: string;
  associatedFiles?: AssociatedFile[];
  filesLoading: boolean;
  allFiles?: AllFile[];
  onRefetch: () => void;
}

export function ChatbotFilesTab({
  chatbotId,
  associatedFiles,
  filesLoading,
  allFiles,
  onRefetch,
}: ChatbotFilesTabProps) {
  // Associate/disassociate file mutations
  const associateFile = trpc.files.associateWithChatbot.useMutation({
    onSuccess: () => {
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
    onSuccess: () => {
      onRefetch();
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

  const handleRemoveFile = (fileId: string) => {
    disassociateFile.mutate({
      fileId,
      chatbotId,
    });
  };

  const associatedFileIds = associatedFiles?.map((f) => f.id) || [];

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
        {filesLoading ? (
          <p className="text-center py-8 text-muted-foreground">
            Loading files...
          </p>
        ) : !associatedFiles || associatedFiles.length === 0 ? (
          <EmptyChatbotFilesState
            allFiles={allFiles}
            associatedFileIds={associatedFileIds}
            onAddFile={handleAddFile}
            isAdding={associateFile.isPending}
          />
        ) : (
          <div className="space-y-2">
            {associatedFiles.map((file) => (
              <AssociatedFileItem
                key={file.id}
                file={file}
                onRemove={handleRemoveFile}
                isRemoving={disassociateFile.isPending}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
