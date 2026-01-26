"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

/* ============================================
   TABS COMPONENT
   Using @radix-ui/react-tabs
   ============================================ */

const Tabs = TabsPrimitive.Root;

/* ----------------------------------------
   Tabs List
   ---------------------------------------- */
const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`
      inline-flex h-10 items-center justify-center
      rounded-lg bg-sub-alt p-1
      ${className}
    `.trim()}
    {...props}
  />
));
TabsList.displayName = TabsPrimitive.List.displayName;

/* ----------------------------------------
   Tabs Trigger
   ---------------------------------------- */
const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`
      inline-flex items-center justify-center
      whitespace-nowrap rounded-md px-3 py-1.5
      text-sm font-medium text-sub
      ring-offset-bg
      transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      data-[state=active]:bg-bg data-[state=active]:text-main data-[state=active]:shadow-sm
      hover:text-text
      ${className}
    `.trim()}
    {...props}
  />
));
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

/* ----------------------------------------
   Tabs Content
   ---------------------------------------- */
const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={`
      mt-2
      ring-offset-bg
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2
      data-[state=active]:animate-fade-in
      ${className}
    `.trim()}
    {...props}
  />
));
TabsContent.displayName = TabsPrimitive.Content.displayName;

/* ============================================
   TABS VARIANTS
   ============================================ */

/* ----------------------------------------
   Underlined Tabs List
   ---------------------------------------- */
const TabsListUnderlined = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`
      inline-flex h-10 items-center justify-start
      w-full border-b border-sub
      ${className}
    `.trim()}
    {...props}
  />
));
TabsListUnderlined.displayName = "TabsListUnderlined";

/* ----------------------------------------
   Underlined Tabs Trigger
   ---------------------------------------- */
const TabsTriggerUnderlined = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`
      relative inline-flex items-center justify-center
      whitespace-nowrap px-4 py-2
      text-sm font-medium text-sub
      ring-offset-bg
      transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      data-[state=active]:text-main
      hover:text-text
      after:absolute after:bottom-0 after:left-0 after:right-0
      after:h-0.5 after:scale-x-0 after:bg-main
      after:transition-transform after:duration-200
      data-[state=active]:after:scale-x-100
      ${className}
    `.trim()}
    {...props}
  />
));
TabsTriggerUnderlined.displayName = "TabsTriggerUnderlined";

/* ----------------------------------------
   Pill Tabs List
   ---------------------------------------- */
const TabsListPill = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={`
      inline-flex items-center gap-1
      ${className}
    `.trim()}
    {...props}
  />
));
TabsListPill.displayName = "TabsListPill";

/* ----------------------------------------
   Pill Tabs Trigger
   ---------------------------------------- */
const TabsTriggerPill = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className = "", ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={`
      inline-flex items-center justify-center
      whitespace-nowrap rounded-full px-4 py-1.5
      text-sm font-medium text-sub
      border border-transparent
      ring-offset-bg
      transition-all duration-200
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2
      disabled:pointer-events-none disabled:opacity-50
      data-[state=active]:bg-main data-[state=active]:text-bg
      hover:border-sub hover:text-text
      ${className}
    `.trim()}
    {...props}
  />
));
TabsTriggerPill.displayName = "TabsTriggerPill";

export {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
  // Underlined variant
  TabsListUnderlined,
  TabsTriggerUnderlined,
  // Pill variant
  TabsListPill,
  TabsTriggerPill,
};
