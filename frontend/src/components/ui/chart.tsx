import * as React from "react";
import { cn } from "@/lib/utils";

export type ChartConfig = Record<string, { label?: React.ReactNode; icon?: React.ComponentType; color?: string }>;

type ChartContainerProps = React.PropsWithChildren<{
  className?: string;
  config?: ChartConfig;
}>;

export function ChartContainer({ className, children }: ChartContainerProps) {
  return (
    <div data-slot="chart" className={cn("aspect-video", className)}>
      {children}
    </div>
  );
}

export const ChartStyle = () => null;
export const ChartTooltip = ({ children }: React.PropsWithChildren) => <>{children}</>;

export function ChartTooltipContent({ className, children }: { className?: string } & React.ComponentProps<"div">) {
  return (
    <div
      data-slot="chart-tooltip"
      className={cn(
        "border-border/50 bg-background grid min-w-[8rem] items-start gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export const ChartLegend = ({ children }: React.PropsWithChildren) => <>{children}</>;
export const ChartLegendContent = ChartLegend;
