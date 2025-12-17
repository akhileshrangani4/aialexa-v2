import { router } from "../trpc";
import { createUploadUrlProcedure } from "./files/procedures/create-upload-url";
import { finalizeUploadProcedure } from "./files/procedures/finalize-upload";
import {
  listProcedure,
  listForChatbotProcedure,
} from "./files/procedures/list";
import { deleteProcedure } from "./files/procedures/delete";
import {
  associateWithChatbotProcedure,
  disassociateFromChatbotProcedure,
} from "./files/procedures/associations";
import {
  getProcessingStatusProcedure,
  getTotalCountProcedure,
} from "./files/procedures/status";
import { retryProcedure } from "./files/procedures/retry";

export const filesRouter = router({
  /**
   * Create signed upload URL for direct client-to-Supabase upload
   */
  createUploadUrl: createUploadUrlProcedure,

  /**
   * Finalize upload after client has uploaded directly to Supabase
   */
  finalizeUpload: finalizeUploadProcedure,

  /**
   * List all user files (centralized)
   */
  list: listProcedure,

  /**
   * List files associated with a specific chatbot
   */
  listForChatbot: listForChatbotProcedure,

  /**
   * Delete file from user's library
   */
  delete: deleteProcedure,

  /**
   * Associate file with chatbot
   */
  associateWithChatbot: associateWithChatbotProcedure,

  /**
   * Disassociate file from chatbot
   */
  disassociateFromChatbot: disassociateFromChatbotProcedure,

  /**
   * Get file processing status
   */
  getProcessingStatus: getProcessingStatusProcedure,

  /**
   * Get total files count for user
   */
  getTotalCount: getTotalCountProcedure,

  /**
   * Retry processing for a failed or stuck file
   */
  retry: retryProcedure,
});
