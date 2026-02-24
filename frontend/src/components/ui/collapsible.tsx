import * as React from "react";

type CollapsibleProps = {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  children: React.ReactNode;
};

const CollapsibleContext = React.createContext<{
  open: boolean;
  toggle: () => void;
} | null>(null);

function Collapsible({ open: controlled, defaultOpen = false, onOpenChange, className, children }: CollapsibleProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const isControlled = controlled !== undefined;
  const open = isControlled ? controlled : uncontrolledOpen;
  const toggle = React.useCallback(() => {
    const next = !open;
    if (!isControlled) setUncontrolledOpen(next);
    onOpenChange?.(next);
  }, [open, isControlled, onOpenChange]);

  return (
    <CollapsibleContext.Provider value={{ open, toggle }}>
      <div data-slot="collapsible" className={className}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  );
}

function CollapsibleTrigger({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) return null;
  return (
    <button
      type="button"
      aria-expanded={ctx.open}
      data-slot="collapsible-trigger"
      onClick={ctx.toggle}
      {...props}
    >
      {children}
    </button>
  );
}

function CollapsibleContent({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const ctx = React.useContext(CollapsibleContext);
  if (!ctx) return null;
  return ctx.open ? (
    <div data-slot="collapsible-content" {...props}>
      {children}
    </div>
  ) : null;
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent };
