// Accordion without external Radix dependency
import * as React from "react";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type AccordionProps = {
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  className?: string;
  children: React.ReactNode;
};

type AccordionContextValue = {
  type: "single" | "multiple";
  openValues: Set<string>;
  toggle: (value: string) => void;
};

const AccordionContext = React.createContext<AccordionContextValue | null>(null);
const AccordionItemContext = React.createContext<string | null>(null);

export function Accordion({ type = "single", defaultValue, className, children }: AccordionProps) {
  const [openValues, setOpenValues] = React.useState<Set<string>>(() => {
    if (type === "multiple") {
      return new Set(Array.isArray(defaultValue) ? defaultValue : defaultValue ? [defaultValue] : []);
    }
    return new Set(typeof defaultValue === "string" ? [defaultValue] : []);
  });

  const toggle = React.useCallback(
    (value: string) => {
      setOpenValues(prev => {
        const next = new Set(prev);
        if (type === "single") {
          next.has(value) ? next.delete(value) : (next.clear(), next.add(value));
        } else {
          next.has(value) ? next.delete(value) : next.add(value);
        }
        return next;
      });
    },
    [type]
  );

  const ctx = React.useMemo(() => ({ type, openValues, toggle }), [type, openValues, toggle]);

  return (
    <AccordionContext.Provider value={ctx}>
      <div data-slot="accordion" className={className}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

type AccordionItemProps = React.PropsWithChildren<{ value: string; className?: string }>;

export function AccordionItem({ value, className, children }: AccordionItemProps) {
  return (
    <div data-slot="accordion-item" className={cn("border-b last:border-b-0", className)}>
      <AccordionItemContext.Provider value={value}>{children}</AccordionItemContext.Provider>
    </div>
  );
}

type TriggerProps = React.ButtonHTMLAttributes<HTMLButtonElement> & { children: React.ReactNode };

export function AccordionTrigger({ className, children, ...props }: TriggerProps) {
  const ctx = React.useContext(AccordionContext);
  const itemValue = React.useContext(AccordionItemContext);
  if (!ctx || !itemValue) return null;
  const isOpen = ctx.openValues.has(itemValue);

  return (
    <div className="flex">
      <button
        type="button"
        data-slot="accordion-trigger"
        onClick={() => ctx.toggle(itemValue)}
        className={cn(
          "focus-visible:border-ring focus-visible:ring-ring/50 flex flex-1 items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium transition-all outline-none hover:underline focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50",
          isOpen && "[&>svg]:rotate-180",
          className
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
      </button>
    </div>
  );
}

type ContentProps = { className?: string; children: React.ReactNode };

export function AccordionContent({ className, children }: ContentProps) {
  const ctx = React.useContext(AccordionContext);
  const itemValue = React.useContext(AccordionItemContext);
  if (!ctx || !itemValue) return null;
  const isOpen = ctx.openValues.has(itemValue);

  return (
    <div
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-sm transition-all duration-200",
        isOpen ? "animate-accordion-down" : "animate-accordion-up max-h-0"
      )}
      style={{ maxHeight: isOpen ? "1000px" : undefined }}
    >
      <div className={cn("pt-0 pb-4", className)}>{isOpen && children}</div>
    </div>
  );
}
