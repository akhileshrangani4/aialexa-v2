"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, getTRPCClientConfig } from "./trpc";
import { useState, useEffect, useRef } from "react";
import { useSession } from "@/lib/auth-client";
import { Toaster } from "sonner";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 0, // Data is considered stale immediately
            refetchOnMount: true, // Always refetch when component mounts (on navigation)
            refetchOnWindowFocus: false, // Keep false to avoid unnecessary refetches
          },
        },
      }),
  );

  const [trpcClient] = useState(() => trpc.createClient(getTRPCClientConfig()));

  // Track the current user to detect changes
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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <Toaster position="bottom-right" richColors closeButton />
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
