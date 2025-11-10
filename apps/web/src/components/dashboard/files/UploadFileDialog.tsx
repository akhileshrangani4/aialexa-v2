"use client";

import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, FileText, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  MAX_FILE_SIZE,
  ALLOWED_FILE_TYPES,
  validateFileName,
  formatFileSize,
} from "./file-constants";
import type { RouterOutputs } from "@/lib/trpc";

type FileData = RouterOutputs["files"]["list"]["files"][number];

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
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  const uploadFile = trpc.files.upload.useMutation({
    onSuccess: () => {
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setUploadError("");
      setUploadProgress(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      toast.success("File uploaded successfully");
      onSuccess?.();
    },
    onError: (error) => {
      setUploadProgress(false);
      toast.error("Failed to upload file", {
        description: error.message,
      });
    },
  });

  const validateFile = useCallback(
    (file: File): string | null => {
      // Validate file name
      const fileNameError = validateFileName(file.name);
      if (fileNameError) {
        return fileNameError;
      }

      // Validate file size - check for empty files
      if (file.size === 0) {
        return "Cannot upload empty file";
      }

      // Validate file size - check maximum
      if (file.size > MAX_FILE_SIZE) {
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        return `File size (${fileSizeMB}MB) exceeds the ${MAX_FILE_SIZE / 1024 / 1024}MB limit`;
      }

      // Validate file type
      if (
        !ALLOWED_FILE_TYPES.includes(
          file.type as (typeof ALLOWED_FILE_TYPES)[number],
        )
      ) {
        return `File type "${file.type}" is not supported. Please upload PDF, Word (.doc, .docx), TXT, Markdown, JSON, or CSV files.`;
      }

      // Check for duplicate file name
      const isDuplicate = existingFiles?.some((f) => f.fileName === file.name);
      if (isDuplicate) {
        return `A file with the name "${file.name}" already exists. Please rename your file or delete the existing one.`;
      }

      return null;
    },
    [existingFiles],
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        setUploadError(error);
        toast.error("Invalid file", {
          description: error,
        });
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        return;
      }

      setSelectedFile(file);
      setUploadError("");
    },
    [validateFile],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const file = e.dataTransfer.files?.[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect],
  );

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploadProgress(true);
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
        setUploadProgress(false);
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
        setUploadProgress(false);
        toast.error("Upload failed", {
          id: toastId,
          description:
            error instanceof Error ? error.message : "An error occurred",
        });
      }
    };
    reader.onerror = () => {
      setUploadProgress(false);
      toast.error("Upload failed", {
        id: toastId,
        description: "Failed to read file",
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setUploadError("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = () => {
    return <FileText className="h-8 w-8 text-blue-600" />;
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
      <DialogContent className="sm:max-w-[500px]">
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
          {/* Drag and Drop Zone */}
          <div
            ref={dropZoneRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative border-2 border-dashed rounded-lg p-8 transition-colors",
              isDragging
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50",
              selectedFile && "border-primary/50 bg-primary/5",
            )}
          >
            <input
              id="file"
              type="file"
              ref={fileInputRef}
              onChange={handleInputChange}
              accept=".pdf,.doc,.docx,.txt,.md,.json,.csv"
              className="hidden"
            />
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  {getFileIcon()}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleRemoveFile}
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    disabled={uploadProgress}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadProgress && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Uploading...</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center">
                <div className="rounded-full bg-primary/10 p-3 mb-3">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <Label
                  htmlFor="file"
                  className="cursor-pointer text-sm font-medium"
                >
                  <span className="text-primary hover:underline">
                    Click to upload
                  </span>{" "}
                  or drag and drop
                </Label>
                <p className="text-xs text-muted-foreground mt-1">
                  PDF, Word, TXT, Markdown, JSON, or CSV (max{" "}
                  {MAX_FILE_SIZE / 1024 / 1024}MB)
                </p>
              </div>
            )}
          </div>

          {/* File Info */}
          {selectedFile && !uploadProgress && (
            <div className="rounded-lg bg-muted/50 p-3 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File name:</span>
                <span className="font-medium">{selectedFile.name}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File size:</span>
                <span className="font-medium">
                  {formatFileSize(selectedFile.size)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">File type:</span>
                <span className="font-medium">
                  {selectedFile.type.split("/")[1]?.toUpperCase() ||
                    selectedFile.type}
                </span>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setUploadDialogOpen(false);
                handleRemoveFile();
              }}
              disabled={uploadProgress}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploadProgress}
            >
              {uploadProgress ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
