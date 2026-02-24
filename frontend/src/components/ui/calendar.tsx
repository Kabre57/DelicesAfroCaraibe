import * as React from "react";
import { cn } from "@/lib/utils";

// Minimal calendar replacement without react-day-picker
// Supports single-date selection via native date input.
type CalendarProps = {
  className?: string;
  selected?: Date | undefined;
  onSelect?: (date: Date | undefined) => void;
};

export function Calendar({ className, selected, onSelect }: CalendarProps) {
  const [value, setValue] = React.useState<string>(() => {
    if (!selected) return "";
    const iso = selected.toISOString();
    return iso.slice(0, 10);
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValue(v);
    onSelect?.(v ? new Date(v) : undefined);
  };

  return (
    <div data-slot="calendar" className={cn("inline-flex", className)}>
      <input
        type="date"
        value={value}
        onChange={handleChange}
        className="border border-input rounded-md px-3 py-2 text-sm bg-background"
      />
    </div>
  );
}

// Placeholder to keep existing exports; not used in this minimal implementation.
export function CalendarDayButton(_props: any) {
  return null;
}
