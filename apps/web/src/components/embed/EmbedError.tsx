import { AlertCircle } from "lucide-react";

interface EmbedErrorProps {
  message?: string;
}

export function EmbedError({ message }: EmbedErrorProps) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full space-y-3 text-center">
        <div className="flex justify-center">
          <AlertCircle className="h-8 w-8 text-destructive" />
        </div>
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Chatbot Not Available
          </h3>
          <p className="text-xs text-muted-foreground">
            {message ||
              "This chatbot is no longer available. The owner may have disabled sharing or the link may be invalid."}
          </p>
        </div>
      </div>
    </div>
  );
}
