/**
 * Hook to get polling configuration for file queries
 * Automatically polls when files are processing and stops when done
 *
 * @param pollInterval - Interval in milliseconds (default: 2000ms)
 * @returns A function that React Query can use for refetchInterval
 *
 * @example
 * ```tsx
 * const { data: files } = trpc.files.list.useQuery(
 *   undefined,
 *   {
 *     refetchInterval: useFilePolling(),
 *   }
 * );
 * ```
 */
export function useFilePolling(pollInterval: number = 2000) {
  return (query: { state: { data?: Array<{ processingStatus: string }> } }) => {
    // Check if any files are processing and poll accordingly
    const data = query.state.data;
    const hasProcessingFiles = data?.some(
      (f) =>
        f.processingStatus === "pending" || f.processingStatus === "processing",
    );
    return hasProcessingFiles ? pollInterval : false;
  };
}
