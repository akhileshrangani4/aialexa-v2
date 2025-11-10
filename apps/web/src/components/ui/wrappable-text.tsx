import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface WrappableTextProps {
  children: ReactNode;
  className?: string;
}

export function WrappableText({ children, className }: WrappableTextProps) {
  return (
    <span
      className={cn("break-words", className)}
      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
    >
      {children}
    </span>
  );
}
