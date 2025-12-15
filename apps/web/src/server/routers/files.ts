import { router } from "../trpc";
import { uploadProcedure } from "./files/procedures/upload";
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
  getPreviewUrlProcedure,
  getTotalCountProcedure,
} from "./files/procedures/status";
import { retryProcedure } from "./files/procedures/retry";

export const filesRouter = router({
  /**
   * Upload file to user's centralized file library
   */
  upload: uploadProcedure,

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
   * Get file preview URL
   */
  getPreviewUrl: getPreviewUrlProcedure,

  /**
   * Get total files count for user
   */
  getTotalCount: getTotalCountProcedure,

  /**
   * Retry processing for a failed or stuck file
   */
  retry: retryProcedure,
});
