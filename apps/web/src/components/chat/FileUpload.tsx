import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import type { ChatbotFile } from "@/types/database";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
];

interface FileUploadProps {
  chatbotId: string;
  files: ChatbotFile[];
  filesLoading: boolean;
  refetchFiles: () => void;
  uploadFile: {
    mutateAsync: (data: {
      chatbotId: string;
      fileName: string;
      fileType: string;
      fileData: string;
      fileSize: number;
    }) => Promise<unknown>;
    isPending: boolean;
  };
  deleteFile: {
    mutateAsync: (data: {
      chatbotId: string;
      fileId: string;
    }) => Promise<unknown>;
    isPending: boolean;
  };
}

export function FileUpload({
  chatbotId,
  files,
  filesLoading,
  refetchFiles,
  uploadFile,
  deleteFile,
}: FileUploadProps) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    fileId: string | null;
    fileName: string | null;
  }>({
    isOpen: false,
    fileId: null,
    fileName: null,
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      const errorMsg = "File size must be less than 10MB";
      setUploadError(errorMsg);
      toast.error("File too large", {
        description: errorMsg,
      });
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      const errorMsg =
        "File type not supported. Please upload PDF, Word, TXT, Markdown, JSON, or CSV files.";
      setUploadError(errorMsg);
      toast.error("Invalid file type", {
        description: errorMsg,
      });
      return;
    }

    setSelectedFile(file);
    setUploadError("");
    toast.success("File selected", {
      description: `${file.name} ready to upload`,
    });
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
          chatbotId,
          fileName: selectedFile.name,
          fileType: selectedFile.type,
          fileData: base64Data,
          fileSize: selectedFile.size,
        });
        toast.success("File uploaded successfully", {
          id: toastId,
          description: `${selectedFile.name} is being processed`,
        });
        setUploadDialogOpen(false);
        setSelectedFile(null);
        setUploadError("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        refetchFiles();
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

  const handleDeleteFile = (fileId: string, fileName: string) => {
    setDeleteDialog({
      isOpen: true,
      fileId,
      fileName,
    });
  };

  const confirmDelete = async () => {
    if (!deleteDialog.fileId) return;
    try {
      await deleteFile.mutateAsync({
        chatbotId,
        fileId: deleteDialog.fileId,
      });
      toast.success("File deleted", {
        description: `${deleteDialog.fileName} has been removed`,
      });
      refetchFiles();
    } catch (error) {
      toast.error("Failed to delete file", {
        description:
          error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setDeleteDialog({
        isOpen: false,
        fileId: null,
        fileName: null,
      });
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-semibold">Course Materials</h2>
          <p className="text-sm text-muted-foreground">
            Upload files to train your chatbot
          </p>
        </div>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button>Upload File</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Upload Course Material</DialogTitle>
              <DialogDescription>
                Upload PDF, Word, TXT, Markdown, JSON, or CSV files (max 10MB)
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
      </div>

      {filesLoading ? (
        <p className="text-center py-8 text-muted-foreground">
          Loading files...
        </p>
      ) : !files || files.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No files uploaded yet</p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            Upload Your First File
          </Button>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>File Name</TableHead>
              <TableHead>Size</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Uploaded</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {files.map((file) => (
              <TableRow key={file.id}>
                <TableCell>{file.fileName}</TableCell>
                <TableCell>{(file.fileSize / 1024).toFixed(2)} KB</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      file.processingStatus === "completed"
                        ? "default"
                        : file.processingStatus === "failed"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {file.processingStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(file.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteFile(file.id, file.fileName)}
                    disabled={deleteFile.isPending}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) =>
          !open &&
          setDeleteDialog({ isOpen: false, fileId: null, fileName: null })
        }
        onConfirm={confirmDelete}
        title="Delete File"
        description={
          <>
            Are you sure you want to delete{" "}
            <strong>{deleteDialog.fileName}</strong>? This action cannot be
            undone.
          </>
        }
        confirmText="Delete"
        variant="destructive"
        loading={deleteFile.isPending}
      />
    </div>
  );
}
