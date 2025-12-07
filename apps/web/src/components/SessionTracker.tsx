"use client";

import { useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { QueryClient } from "@tanstack/react-query";

export function SessionTracker({ queryClient }: { queryClient: QueryClient }) {
  const { data: session } = useSession();
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentUserId = session?.user?.id || null;
    const previousUserId = previousUserIdRef.current;

    // If user changed (logged in, logged out, or switched accounts)
    if (previousUserId !== null && previousUserId !== currentUserId) {
      // Clear all cached queries
      queryClient.clear();
    }

    // Update the ref to track the current user
    previousUserIdRef.current = currentUserId;
  }, [session?.user?.id, queryClient]);

  return null;
}
