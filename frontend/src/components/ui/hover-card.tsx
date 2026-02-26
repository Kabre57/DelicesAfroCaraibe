"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type HoverCardProps = {
  className?: string;
  children: React.ReactNode;
  content: React.ReactNode;
  openDelay?: number;
  closeDelay?: number;
};

const HoverCardContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

function HoverCard({ className, children, content, openDelay = 100, closeDelay = 100 }: HoverCardProps) {
  const [open, setOpen] = React.useState(false);
  const enterTimer = React.useRef<NodeJS.Timeout | null>(null);
  const leaveTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    enterTimer.current = setTimeout(() => setOpen(true), openDelay);
  };

  const handleLeave = () => {
    if (enterTimer.current) clearTimeout(enterTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), closeDelay);
  };

  return (
    <HoverCardContext.Provider value={{ open, setOpen }}>
      <div
        data-slot="hover-card"
        className={className}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocus={handleEnter}
        onBlur={handleLeave}
      >
        {children}
        {open && (
          <div className="absolute z-50 mt-2 w-64 rounded-md border bg-popover p-4 text-popover-foreground shadow-md">
            {content}
          </div>
        )}
      </div>
    </HoverCardContext.Provider>
  );
}

// API de compatibilité (noms conservés)
export const HoverCardTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const HoverCardContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export { HoverCard };
