"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  validateFileName,
} from "./file-constants";
import type { RouterOutputs } from "@/lib/trpc";

type FileData = RouterOutputs["files"]["list"][number];

interface UploadFileDialogProps {
  onSuccess?: () => void;
  existingFiles?: FileData[];
}

export function UploadFileDialog({
  onSuccess,
  existingFiles = [],
}: UploadFileDialogProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(
    null,
  );
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadError("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("File uploaded successfully");
      onSuccess?.();
    },
    onError: (error) => {
      toast.error("Failed to upload file", {
        description: error.message,
      });
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file name
    const fileNameError = validateFileName(file.name);
    if (fileNameError) {
      setUploadError(fileNameError);
      toast.error("Invalid file name", {
        description: fileNameError,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size - check for empty files
    if (file.size === 0) {
      const errorMsg = "Cannot upload empty file";
      setUploadError(errorMsg);
      toast.error("Empty file", {
        description: errorMsg,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file size - check maximum
    if (file.size > MAX_FILE_SIZE) {
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
      const errorMsg = `File size (${fileSizeMB}MB) exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
      setUploadError(errorMsg);
      toast.error("File too large", {
        description: errorMsg,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Validate file type
    if (
      !ALLOWED_FILE_TYPES.includes(
        file.type as (typeof ALLOWED_FILE_TYPES)[number],
      )
    ) {
      const errorMsg = `File type "${file.type}" is not supported. Please upload PDF, Word (.doc, .docx), TXT, Markdown, JSON, or CSV files.`;
      setUploadError(errorMsg);
      toast.error("Invalid file type", {
        description: errorMsg,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    // Check for duplicate file name
    const isDuplicate = existingFiles?.some((f) => f.fileName === file.name);
    if (isDuplicate) {
      const errorMsg = `A file with the name "${file.name}" already exists. Please rename your file or delete the existing one.`;
      setUploadError(errorMsg);
      toast.error("Duplicate file name", {
        description: errorMsg,
      });
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      return;
    }

    setSelectedFile(file);
    setUploadError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    const toastId = toast.loading("Uploading file...", {
      description: "Please wait while we process your file",
    });

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1]; // Remove data:mime;base64, prefix

      if (!base64Data) {
        const errorMsg = "Failed to read file";
        setUploadError(errorMsg);
        toast.error("Upload failed", {
          id: toastId,
          description: errorMsg,
        });
        return;
      }

      try {
        await uploadFile.mutateAsync({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileData: base64Data,
          fileSize: selectedFile.size,
        });
        toast.success("File uploaded successfully", {
          id: toastId,
          description: `${selectedFile.name} is being processed`,
        });
      } catch (error) {
        toast.error("Upload failed", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "An error occurred",
        });
      }
    };
    reader.onerror = () => {
      toast.error("Upload failed", {
        id: toastId,
        description: "Failed to read file",
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  return (
    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
      <DialogTrigger asChild>
        <Button
          size="lg"
          className="shadow-md hover:shadow-lg transition-shadow"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload File
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload PDF, Word, TXT, Markdown, JSON, or CSV files (max{" "}
            {MAX_FILE_SIZE / 1024 / 1024}MB)
          </DialogDescription>
        </DialogHeader>

        {uploadError && (
          <Alert variant="destructive">
            <AlertDescription>{uploadError}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
            />
          </div>

          {selectedFile && (
            <div className="text-sm">
              <p>
                <strong>File:</strong> {selectedFile.name}
              </p>
              <p>
                <strong>Size:</strong>{" "}
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setUploadDialogOpen(false)}
              disabled={uploadFile.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadFile.isPending}
            >
              {uploadFile.isPending ? "Uploading..." : "Upload"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
