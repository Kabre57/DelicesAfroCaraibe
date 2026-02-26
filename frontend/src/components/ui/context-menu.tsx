"use client";

import * as React from "react";
import { CheckIcon, ChevronRightIcon, CircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type MenuItem = {
  label: React.ReactNode;
  onSelect?: () => void;
  disabled?: boolean;
  inset?: boolean;
  checked?: boolean;
  children?: MenuItem[];
};

type ContextMenuProps = {
  items: MenuItem[];
  className?: string;
  children: React.ReactNode;
};

const ContextMenuContext = React.createContext<{
  open: boolean;
  setOpen: (o: boolean) => void;
} | null>(null);

export function ContextMenu({ items, className, children }: ContextMenuProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <ContextMenuContext.Provider value={{ open, setOpen }}>
      <div
        data-slot="context-menu"
        className={className}
        onContextMenu={(e) => {
          e.preventDefault();
          setOpen(true);
        }}
        onClick={() => setOpen(false)}
      >
        {children}
        {open && (
          <div className="absolute z-50 mt-2 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
            <MenuList items={items} />
          </div>
        )}
      </div>
    </ContextMenuContext.Provider>
  );
}

function MenuList({ items }: { items: MenuItem[] }) {
  return (
    <div className="grid gap-1">
      {items.map((item, i) => (
        <MenuItemRow key={i} item={item} />
      ))}
    </div>
  );
}

function MenuItemRow({ item }: { item: MenuItem }) {
  const hasChildren = !!item.children?.length;
  return (
    <div
      role="menuitem"
      className={cn(
        "flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground",
        item.disabled && "pointer-events-none opacity-50",
        item.inset && "pl-8"
      )}
      onClick={(e) => {
        e.stopPropagation();
        if (item.disabled) return;
        if (item.onSelect) item.onSelect();
      }}
    >
      {item.checked === true && <CheckIcon className="h-4 w-4" />}
      {item.checked === false && <CircleIcon className="h-4 w-4" />}
      <span className="flex-1">{item.label}</span>
      {hasChildren && <ChevronRightIcon className="h-4 w-4" />}
      {hasChildren && (
        <div className="absolute left-full top-0 ml-1 min-w-[180px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md">
          <MenuList items={item.children!} />
        </div>
      )}
    </div>
  );
}

// Exports alignés avec l’API Radix pour ne pas casser les imports existants.
export const ContextMenuTrigger = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ContextMenuContent = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ContextMenuItem = (_props: any) => null;
export const ContextMenuSeparator = () => <div className="my-1 h-px bg-border" />;
export const ContextMenuLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">{children}</div>
);
export const ContextMenuSub = (_props: any) => null;
export const ContextMenuSubTrigger = (_props: any) => null;
export const ContextMenuSubContent = (_props: any) => null;
export const ContextMenuCheckboxItem = (_props: any) => null;
export const ContextMenuRadioGroup = (_props: any) => null;
export const ContextMenuRadioItem = (_props: any) => null;
export const ContextMenuGroup = (_props: any) => null;
export const ContextMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const ContextMenuArrow = () => null;
export const ContextMenuShortcut = ({ children }: { children: React.ReactNode }) => (
  <span className="ml-auto text-xs tracking-widest text-muted-foreground">{children}</span>
);
