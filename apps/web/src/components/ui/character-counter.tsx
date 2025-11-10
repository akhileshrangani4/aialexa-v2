import { cn } from "@/lib/utils";

interface CharacterCounterProps {
  current: number;
  max: number;
  warningThreshold?: number; // Percentage (0-1) or absolute number
  className?: string;
}

export function CharacterCounter({
  current,
  max,
  warningThreshold = 0.9, // Default to 90%
  className,
}: CharacterCounterProps) {
  const threshold =
    warningThreshold < 1
      ? Math.floor(max * warningThreshold)
      : warningThreshold;
  const isOverLimit = current > max;
  const isWarning = current > threshold && !isOverLimit;

  return (
    <span
      className={cn(
        "text-xs shrink-0",
        isOverLimit
          ? "text-destructive"
          : isWarning
            ? "text-orange-500"
            : "text-muted-foreground",
        className,
      )}
    >
      {current}/{max}
    </span>
  );
}
