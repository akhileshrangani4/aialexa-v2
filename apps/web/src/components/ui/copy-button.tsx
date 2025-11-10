import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CopyButtonProps {
  text: string;
  className?: string;
  size?: "default" | "sm" | "lg" | "icon";
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  successMessage?: string;
  errorMessage?: string;
  tooltip?: string;
  tooltipCopied?: string;
  disabled?: boolean;
}

export function CopyButton({
  text,
  className,
  size = "icon",
  variant = "ghost",
  successMessage = "Copied to clipboard",
  errorMessage = "Failed to copy",
  tooltip = "Copy",
  tooltipCopied = "Copied!",
  disabled = false,
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!text || disabled) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(successMessage);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(errorMessage);
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      className={cn(
        "h-7 w-7 text-muted-foreground hover:text-foreground transition-all duration-200",
        variant === "ghost" && "hover:bg-transparent",
        variant === "outline" &&
          "border-border/50 hover:border-border hover:bg-background",
        className,
      )}
      onClick={handleCopy}
      disabled={disabled || !text}
      title={copied ? tooltipCopied : tooltip}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}
