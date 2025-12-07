"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">Error</h1>
        <h2 className="mt-4 text-2xl font-semibold">Something went wrong!</h2>
        <p className="mt-2 text-muted-foreground">
          An error occurred while processing your request.
        </p>
        <div className="mt-6 flex justify-center gap-4">
          <button
            onClick={reset}
            className="rounded-md bg-primary px-6 py-3 text-primary-foreground hover:bg-primary/90"
          >
            Try Again
          </button>
          <Link
            href="/"
            className="inline-block rounded-md border border-input bg-background px-6 py-3 hover:bg-accent hover:text-accent-foreground"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
