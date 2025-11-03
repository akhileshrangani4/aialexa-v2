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
  files: any[];
  filesLoading: boolean;
  refetchFiles: () => void;
  uploadFile: any;
  deleteFile: any;
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

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      setUploadError("File size must be less than 10MB");
      return;
    }

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setUploadError(
        "File type not supported. Please upload PDF, Word, TXT, Markdown, JSON, or CSV files.",
      );
      return;
    }

    setSelectedFile(file);
    setUploadError("");
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    // Convert file to base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      const base64Data = base64.split(",")[1]; // Remove data:mime;base64, prefix

      if (!base64Data) {
        setUploadError("Failed to read file");
        return;
      }

      await uploadFile.mutateAsync({
        chatbotId,
        fileName: selectedFile.name,
        fileType: selectedFile.type,
        fileData: base64Data,
        fileSize: selectedFile.size,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDeleteFile = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteFile.mutateAsync({ chatbotId, fileId });
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
        <p className="text-center py-8 text-muted-foreground">Loading files...</p>
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
                    onClick={() => handleDeleteFile(file.id)}
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
    </div>
  );
}
