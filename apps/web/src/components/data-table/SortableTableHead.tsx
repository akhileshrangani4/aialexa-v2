"use client";

import { TableHead } from "@/components/ui/table";
import { ArrowUp, ArrowDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SortDirection } from "@/hooks/useServerTable";

interface SortableTableHeadProps<TSortBy extends string> {
  /** Column key for sorting */
  column: TSortBy;
  /** Display label */
  children: React.ReactNode;
  /** Current sort column */
  currentSortBy: TSortBy;
  /** Current sort direction */
  currentSortDir: SortDirection;
  /** Callback when header is clicked */
  onSort: (column: TSortBy) => void;
  /** Additional className */
  className?: string;
}

export function SortableTableHead<TSortBy extends string>({
  column,
  children,
  currentSortBy,
  currentSortDir,
  onSort,
  className,
}: SortableTableHeadProps<TSortBy>) {
  const isActive = currentSortBy === column;

  return (
    <TableHead
      className={cn(
        "font-semibold cursor-pointer select-none hover:bg-muted/80 transition-colors",
        className,
      )}
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        <span>{children}</span>
        {isActive ? (
          currentSortDir === "asc" ? (
            <ArrowUp className="h-4 w-4" />
          ) : (
            <ArrowDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-30" />
        )}
      </div>
    </TableHead>
  );
}
