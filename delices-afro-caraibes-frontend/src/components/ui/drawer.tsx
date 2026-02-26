"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DrawerProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
  className?: string;
};

const DrawerContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

function Drawer({ open: controlled, defaultOpen = false, onOpenChange, children, className }: DrawerProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlled !== undefined;
  const open = isControlled ? controlled : uncontrolledOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setUncontrolledOpen(value);
    onOpenChange?.(value);
  };

  return (
    <DrawerContext.Provider value={{ open, setOpen }}>
      <div data-slot="drawer" className={className}>
        {children}
      </div>
    </DrawerContext.Provider>
  );
}

function DrawerTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) return null;
  return (
    <button data-slot="drawer-trigger" onClick={() => ctx.setOpen(true)} {...props}>
      {children}
    </button>
  );
}

function DrawerOverlay(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-overlay" className="fixed inset-0 z-50 bg-black/50" {...props} />;
}

function DrawerContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) return null;

  return ctx.open ? (
    <div data-slot="drawer-portal" className="fixed inset-0 z-50 flex">
      <DrawerOverlay onClick={() => ctx.setOpen(false)} />
      <div
        data-slot="drawer-content"
        className={cn(
          "bg-background text-foreground fixed bottom-0 left-0 right-0 z-50 max-h-[80vh] rounded-t-lg border p-4 shadow-lg sm:left-auto sm:right-0 sm:top-0 sm:bottom-0 sm:max-h-full sm:w-[400px]",
          className
        )}
        {...props}
      >
        {children}
      </div>
    </div>
  ) : null;
}

function DrawerClose({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(DrawerContext);
  if (!ctx) return null;
  return (
    <button data-slot="drawer-close" onClick={() => ctx.setOpen(false)} {...props}>
      {children}
    </button>
  );
}

function DrawerHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-header" className="flex flex-col gap-1 p-4" {...props} />;
}

function DrawerFooter(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="drawer-footer" className="mt-auto flex flex-col gap-2 p-4" {...props} />;
}

function DrawerTitle(props: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 data-slot="drawer-title" className="text-lg font-semibold" {...props} />;
}

function DrawerDescription(props: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p data-slot="drawer-description" className="text-sm text-muted-foreground" {...props} />;
}

export {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerClose,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
};
