/**
 * Hook to get polling configuration for file queries
 * Automatically polls when files are processing and stops when done
 *
 * @param pollInterval - Interval in milliseconds (default: 2000ms)
 * @returns A function that React Query can use for refetchInterval
 *
 * @example
 * ```tsx
 * const { data: filesData } = trpc.files.list.useQuery(
 *   { limit: 10, offset: 0 },
 *   {
 *     refetchInterval: useFilePolling(),
 *   }
 * );
 * // Access files via filesData?.files
 * ```
 */
export function useFilePolling(pollInterval: number = 2000) {
  return (query: {
    state: {
      data?:
        | Array<{ processingStatus: string }>
        | { files: Array<{ processingStatus: string }>; totalCount: number }
        | undefined;
    };
  }) => {
    // Check if any files are processing and poll accordingly
    const data = query.state.data;

    // Handle both old format (array) and new format (object with files array)
    let files: Array<{ processingStatus: string }> | undefined;
    if (Array.isArray(data)) {
      files = data;
    } else if (data && typeof data === "object" && "files" in data) {
      files = data.files;
    }

    const hasProcessingFiles = files?.some(
      (f) =>
        f.processingStatus === "pending" || f.processingStatus === "processing",
    );
    return hasProcessingFiles ? pollInterval : false;
  };
}
