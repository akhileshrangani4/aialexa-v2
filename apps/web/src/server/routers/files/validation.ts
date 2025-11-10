import { TRPCError } from "@trpc/server";
import { env } from "@/lib/env";

export interface FileUploadInput {
  fileName: string;
  fileType: string;
  fileSize: number;
  fileData: string;
}

/**
 * Supported MIME types for file uploads
 */
export const SUPPORTED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/msword",
  "text/plain",
  "text/markdown",
  "application/json",
  "text/csv",
] as const;

/**
 * File extension to MIME type mapping
 */
export const EXTENSION_MIME_MAP: Record<string, string[]> = {
  pdf: ["application/pdf"],
  doc: ["application/msword"],
  docx: [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
  txt: ["text/plain"],
  md: ["text/markdown"],
  markdown: ["text/markdown"],
  json: ["application/json"],
  csv: ["text/csv"],
} as const;

/**
 * Validates file name for invalid characters and length
 */
export function validateFileName(fileName: string): void {
  // Check for invalid characters
  const invalidChars = /[<>:"/\\|?*]/;
  const hasControlChars = Array.from(fileName).some(
    (char) => char.charCodeAt(0) >= 0 && char.charCodeAt(0) <= 31,
  );

  if (invalidChars.test(fileName) || hasControlChars) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "File name contains invalid characters. Please use only letters, numbers, spaces, and common punctuation.",
    });
  }

  // Check length
  if (fileName.length > 255) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "File name must be less than 255 characters",
    });
  }
}

/**
 * Validates file size
 */
export function validateFileSize(fileSize: number): void {
  if (fileSize === 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot upload empty file",
    });
  }

  const maxSizeMB = Number(env.NEXT_PUBLIC_MAX_FILE_SIZE_MB) || 50;
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (fileSize > maxSizeBytes) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `File size exceeds ${maxSizeMB}MB limit. Current file size: ${(fileSize / 1024 / 1024).toFixed(2)}MB`,
    });
  }
}

/**
 * Validates file type against supported types
 */
export function validateFileType(fileType: string): void {
  if (
    !SUPPORTED_FILE_TYPES.includes(
      fileType as (typeof SUPPORTED_FILE_TYPES)[number],
    )
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Unsupported file type: ${fileType}. Supported types: PDF, Word (.doc, .docx), TXT, Markdown, JSON, CSV`,
    });
  }
}

/**
 * Validates that file extension matches the declared MIME type
 */
export function validateExtensionMatchesMimeType(
  fileName: string,
  fileType: string,
): void {
  const fileNameLower = fileName.toLowerCase();
  const extension = fileNameLower.substring(fileNameLower.lastIndexOf(".") + 1);
  const validMimeTypes = EXTENSION_MIME_MAP[extension];

  if (extension && validMimeTypes && !validMimeTypes.includes(fileType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `File extension (.${extension}) does not match file type (${fileType})`,
    });
  }
}

/**
 * Validates base64 file data format
 */
export function validateBase64Data(fileData: string): void {
  const base64Regex = /^data:[\w+-]+(\/[\w+-]+)?;base64,([A-Za-z0-9+/=]+)$/;
  const isBase64DataUrl = base64Regex.test(fileData);
  const isBase64String = /^[A-Za-z0-9+/=]+$/.test(fileData.replace(/\s/g, ""));

  if (!isBase64DataUrl && !isBase64String) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file data format. Expected base64 encoded data",
    });
  }
}

/**
 * Validates and decodes base64 file data
 */
export function decodeBase64FileData(
  fileData: string,
  expectedSize: number,
): Buffer {
  // Extract base64 data (remove data URL prefix if present)
  const base64Data = fileData.includes(",") ? fileData.split(",")[1] : fileData;

  if (!base64Data) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid file data. Base64 data is missing",
    });
  }

  // Decode base64 file data
  let fileBuffer: Buffer;
  try {
    fileBuffer = Buffer.from(base64Data, "base64");
  } catch {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Failed to decode file data. Invalid base64 encoding",
    });
  }

  // Verify decoded buffer size matches reported file size
  if (fileBuffer.length !== expectedSize) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "File size mismatch. The decoded file size does not match the reported size",
    });
  }

  return fileBuffer;
}

/**
 * Validates all file upload input
 */
export function validateFileUpload(input: FileUploadInput): Buffer {
  validateFileName(input.fileName);
  validateFileSize(input.fileSize);
  validateFileType(input.fileType);
  validateExtensionMatchesMimeType(input.fileName, input.fileType);
  validateBase64Data(input.fileData);

  return decodeBase64FileData(input.fileData, input.fileSize);
}
