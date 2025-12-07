"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc, getTRPCClientConfig } from "./trpc";
import { useState, Suspense } from "react";
import { SessionTracker } from "@/components/SessionTracker";
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

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Wrap SessionTracker in Suspense to prevent execution during static generation */}
        <Suspense fallback={null}>
          <SessionTracker queryClient={queryClient} />
        </Suspense>
        <Toaster position="bottom-right" richColors closeButton />
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
