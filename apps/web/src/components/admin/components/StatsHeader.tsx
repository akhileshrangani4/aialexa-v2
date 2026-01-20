"use client";

import { Fragment, type ReactNode } from "react";
import { CardDescription, CardTitle } from "@/components/ui/card";

interface StatItem {
  value: number;
  label: string;
  highlight?: boolean; // Use primary color if true
}

interface StatsHeaderProps {
  title: string;
  description: string;
  stats?: StatItem[];
  action?: ReactNode;
}

export function StatsHeader({
  title,
  description,
  stats,
  action,
}: StatsHeaderProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          {title}
        </CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
      </div>
      <div className="flex items-center gap-4">
        {action}
        {stats && stats.length > 0 && (
          <div className="flex items-center gap-4 text-sm">
            {stats.map((stat, index) => (
              <Fragment key={stat.label}>
                {index > 0 && <div className="h-8 w-px bg-border" />}
                <div className="text-center">
                  <div
                    className={`text-2xl font-bold ${stat.highlight ? "text-primary" : "text-foreground"}`}
                  >
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              </Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
