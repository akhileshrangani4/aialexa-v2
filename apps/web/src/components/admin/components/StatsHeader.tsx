"use client";

import { Fragment } from "react";
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
}

export function StatsHeader({ title, description, stats }: StatsHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <CardTitle className="text-2xl font-bold flex items-center gap-2">
          {title}
        </CardTitle>
        <CardDescription className="mt-2">{description}</CardDescription>
      </div>
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
  );
}
