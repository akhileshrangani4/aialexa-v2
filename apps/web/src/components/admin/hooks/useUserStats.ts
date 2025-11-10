"use client";

import { trpc } from "@/lib/trpc";
import type { RouterOutputs } from "@/lib/trpc";

type UserStatsData = RouterOutputs["admin"]["getUserStats"];

/**
 * Hook to fetch and manage user statistics
 * Returns stats data and refetch function
 */
export function useUserStats(): {
  data: UserStatsData | undefined;
  refetch: () => Promise<unknown>;
  isLoading: boolean;
  error: unknown;
} {
  const query = trpc.admin.getUserStats.useQuery();
  return {
    data: query.data,
    refetch: query.refetch,
    isLoading: query.isLoading,
    error: query.error,
  };
}
