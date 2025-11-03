import { createTRPCReact, type CreateTRPCReact } from "@trpc/react-query";
import {
  httpBatchLink,
  loggerLink,
  splitLink,
  httpSubscriptionLink,
} from "@trpc/client";
import type { AppRouter } from "@/server/routers/_app";
import superjson from "superjson";
import { env } from "./env";

// Create tRPC React hooks
export const trpc: CreateTRPCReact<AppRouter, unknown> =
  createTRPCReact<AppRouter>();

// tRPC client configuration
export function getTRPCClientConfig() {
  return {
    links: [
      loggerLink({
        enabled: (opts) =>
          env.NODE_ENV === "development" ||
          (opts.direction === "down" && opts.result instanceof Error),
      }),
      splitLink({
        condition: (op) => op.type === "subscription",
        true: httpSubscriptionLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
        false: httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
        }),
      }),
    ],
  };
}

function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (env.NEXT_PUBLIC_APP_URL) {
    return env.NEXT_PUBLIC_APP_URL;
  }
  return `http://localhost:${env.PORT}`;
}
