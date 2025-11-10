"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";

interface MutationErrorsProps {
  errors: {
    promote?: { message: string } | null;
    demote?: { message: string } | null;
    disable?: { message: string } | null;
    enable?: { message: string } | null;
    delete?: { message: string } | null;
  };
}

export function MutationErrors({ errors }: MutationErrorsProps) {
  const errorMessages = [
    errors.promote?.message,
    errors.demote?.message,
    errors.disable?.message,
    errors.enable?.message,
    errors.delete?.message,
  ].filter(Boolean) as string[];

  if (errorMessages.length === 0) return null;

  return (
    <>
      {errorMessages.map((message, index) => (
        <Alert key={index} variant="destructive" className="mb-4">
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ))}
    </>
  );
}
