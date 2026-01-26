"use client";

import * as React from "react";
import * as DropdownMenuPrimitive from "@radix-ui/react-dropdown-menu";
import { Check, ChevronRight, Circle } from "lucide-react";

/* ============================================
   DROPDOWN MENU COMPONENT
   Using @radix-ui/react-dropdown-menu
   ============================================ */

const Dropdown = DropdownMenuPrimitive.Root;

const DropdownTrigger = DropdownMenuPrimitive.Trigger;

const DropdownGroup = DropdownMenuPrimitive.Group;

const DropdownPortal = DropdownMenuPrimitive.Portal;

const DropdownSub = DropdownMenuPrimitive.Sub;

const DropdownRadioGroup = DropdownMenuPrimitive.RadioGroup;

/* ----------------------------------------
   Dropdown Sub Trigger
   ---------------------------------------- */
const DropdownSubTrigger = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubTrigger>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubTrigger> & {
    inset?: boolean;
  }
>(({ className = "", inset, children, ...props }, ref) => (
  <DropdownMenuPrimitive.SubTrigger
    ref={ref}
    className={`
      flex cursor-pointer select-none items-center
      rounded-md px-2 py-1.5 text-sm outline-none
      text-text
      focus:bg-sub-alt focus:text-main
      data-[state=open]:bg-sub-alt data-[state=open]:text-main
      ${inset ? "pl-8" : ""}
      ${className}
    `.trim()}
    {...props}
  >
    {children}
    <ChevronRight className="ml-auto h-4 w-4" />
  </DropdownMenuPrimitive.SubTrigger>
));
DropdownSubTrigger.displayName = DropdownMenuPrimitive.SubTrigger.displayName;

/* ----------------------------------------
   Dropdown Sub Content
   ---------------------------------------- */
const DropdownSubContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.SubContent>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.SubContent>
>(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.SubContent
    ref={ref}
    className={`
      z-50 min-w-[8rem] overflow-hidden
      rounded-lg border border-sub bg-bg p-1 shadow-lg
      data-[state=open]:animate-fade-in-up
      data-[state=closed]:animate-fade-out
      ${className}
    `.trim()}
    {...props}
  />
));
DropdownSubContent.displayName = DropdownMenuPrimitive.SubContent.displayName;

/* ----------------------------------------
   Dropdown Content
   ---------------------------------------- */
const DropdownContent = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Content>
>(({ className = "", sideOffset = 4, ...props }, ref) => (
  <DropdownMenuPrimitive.Portal>
    <DropdownMenuPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={`
        z-50 min-w-[8rem] overflow-hidden
        rounded-lg border border-sub bg-bg p-1 shadow-lg
        data-[state=open]:animate-fade-in-up
        data-[state=closed]:animate-fade-out
        data-[side=bottom]:slide-in-from-top-2
        data-[side=left]:slide-in-from-right-2
        data-[side=right]:slide-in-from-left-2
        data-[side=top]:slide-in-from-bottom-2
        ${className}
      `.trim()}
      {...props}
    />
  </DropdownMenuPrimitive.Portal>
));
DropdownContent.displayName = DropdownMenuPrimitive.Content.displayName;

/* ----------------------------------------
   Dropdown Item
   ---------------------------------------- */
const DropdownItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Item> & {
    inset?: boolean;
  }
>(({ className = "", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Item
    ref={ref}
    className={`
      relative flex cursor-pointer select-none items-center
      rounded-md px-2 py-1.5 text-sm outline-none
      text-text transition-colors
      focus:bg-sub-alt focus:text-main
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${inset ? "pl-8" : ""}
      ${className}
    `.trim()}
    {...props}
  />
));
DropdownItem.displayName = DropdownMenuPrimitive.Item.displayName;

/* ----------------------------------------
   Dropdown Checkbox Item
   ---------------------------------------- */
const DropdownCheckboxItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.CheckboxItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.CheckboxItem>
>(({ className = "", children, checked, ...props }, ref) => (
  <DropdownMenuPrimitive.CheckboxItem
    ref={ref}
    className={`
      relative flex cursor-pointer select-none items-center
      rounded-md py-1.5 pl-8 pr-2 text-sm outline-none
      text-text transition-colors
      focus:bg-sub-alt focus:text-main
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className}
    `.trim()}
    checked={checked}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-main" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.CheckboxItem>
));
DropdownCheckboxItem.displayName = DropdownMenuPrimitive.CheckboxItem.displayName;

/* ----------------------------------------
   Dropdown Radio Item
   ---------------------------------------- */
const DropdownRadioItem = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.RadioItem>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.RadioItem>
>(({ className = "", children, ...props }, ref) => (
  <DropdownMenuPrimitive.RadioItem
    ref={ref}
    className={`
      relative flex cursor-pointer select-none items-center
      rounded-md py-1.5 pl-8 pr-2 text-sm outline-none
      text-text transition-colors
      focus:bg-sub-alt focus:text-main
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className}
    `.trim()}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <DropdownMenuPrimitive.ItemIndicator>
        <Circle className="h-2 w-2 fill-main text-main" />
      </DropdownMenuPrimitive.ItemIndicator>
    </span>
    {children}
  </DropdownMenuPrimitive.RadioItem>
));
DropdownRadioItem.displayName = DropdownMenuPrimitive.RadioItem.displayName;

/* ----------------------------------------
   Dropdown Label
   ---------------------------------------- */
const DropdownLabel = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Label> & {
    inset?: boolean;
  }
>(({ className = "", inset, ...props }, ref) => (
  <DropdownMenuPrimitive.Label
    ref={ref}
    className={`
      px-2 py-1.5 text-sm font-semibold text-main
      ${inset ? "pl-8" : ""}
      ${className}
    `.trim()}
    {...props}
  />
));
DropdownLabel.displayName = DropdownMenuPrimitive.Label.displayName;

/* ----------------------------------------
   Dropdown Separator
   ---------------------------------------- */
const DropdownSeparator = React.forwardRef<
  React.ElementRef<typeof DropdownMenuPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof DropdownMenuPrimitive.Separator>
>(({ className = "", ...props }, ref) => (
  <DropdownMenuPrimitive.Separator
    ref={ref}
    className={`
      -mx-1 my-1 h-px bg-sub
      ${className}
    `.trim()}
    {...props}
  />
));
DropdownSeparator.displayName = DropdownMenuPrimitive.Separator.displayName;

/* ----------------------------------------
   Dropdown Shortcut
   ---------------------------------------- */
const DropdownShortcut = ({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) => {
  return (
    <span
      className={`
        ml-auto text-xs tracking-widest text-sub
        ${className}
      `.trim()}
      {...props}
    />
  );
};
DropdownShortcut.displayName = "DropdownShortcut";

export {
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownCheckboxItem,
  DropdownRadioItem,
  DropdownLabel,
  DropdownSeparator,
  DropdownShortcut,
  DropdownGroup,
  DropdownPortal,
  DropdownSub,
  DropdownSubContent,
  DropdownSubTrigger,
  DropdownRadioGroup,
};
