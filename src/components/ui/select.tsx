"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

/* ============================================
   SELECT COMPONENT
   Using @radix-ui/react-select
   ============================================ */

const Select = SelectPrimitive.Root;

const SelectGroup = SelectPrimitive.Group;

const SelectValue = SelectPrimitive.Value;

/* ----------------------------------------
   Select Trigger
   ---------------------------------------- */
const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={`
      flex h-10 w-full items-center justify-between
      rounded-lg border border-sub bg-sub-alt
      px-3 py-2 text-sm text-text
      ring-offset-bg
      transition-colors duration-200
      placeholder:text-sub
      focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2
      disabled:cursor-not-allowed disabled:opacity-50
      hover:border-main
      [&>span]:line-clamp-1
      ${className}
    `.trim()}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="h-4 w-4 text-sub opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName;

/* ----------------------------------------
   Select Scroll Up Button
   ---------------------------------------- */
const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ className = "", ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    className={`
      flex cursor-default items-center justify-center py-1
      text-sub
      ${className}
    `.trim()}
    {...props}
  >
    <ChevronUp className="h-4 w-4" />
  </SelectPrimitive.ScrollUpButton>
));
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName;

/* ----------------------------------------
   Select Scroll Down Button
   ---------------------------------------- */
const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ className = "", ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    className={`
      flex cursor-default items-center justify-center py-1
      text-sub
      ${className}
    `.trim()}
    {...props}
  >
    <ChevronDown className="h-4 w-4" />
  </SelectPrimitive.ScrollDownButton>
));
SelectScrollDownButton.displayName = SelectPrimitive.ScrollDownButton.displayName;

/* ----------------------------------------
   Select Content
   ---------------------------------------- */
const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className = "", children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      className={`
        relative z-50 max-h-96 min-w-[8rem] overflow-hidden
        rounded-lg border border-sub bg-bg
        shadow-lg
        data-[state=open]:animate-fade-in-up
        data-[state=closed]:animate-fade-out
        ${
          position === "popper"
            ? "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1"
            : ""
        }
        ${className}
      `.trim()}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        className={`
          p-1
          ${
            position === "popper"
              ? "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"
              : ""
          }
        `.trim()}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = SelectPrimitive.Content.displayName;

/* ----------------------------------------
   Select Label
   ---------------------------------------- */
const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ className = "", ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    className={`
      py-1.5 pl-8 pr-2 text-sm font-semibold text-main
      ${className}
    `.trim()}
    {...props}
  />
));
SelectLabel.displayName = SelectPrimitive.Label.displayName;

/* ----------------------------------------
   Select Item
   ---------------------------------------- */
const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className = "", children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={`
      relative flex w-full cursor-pointer select-none items-center
      rounded-md py-1.5 pl-8 pr-2 text-sm text-text
      outline-none
      transition-colors duration-150
      focus:bg-sub-alt focus:text-main
      data-[disabled]:pointer-events-none data-[disabled]:opacity-50
      ${className}
    `.trim()}
    {...props}
  >
    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="h-4 w-4 text-main" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = SelectPrimitive.Item.displayName;

/* ----------------------------------------
   Select Separator
   ---------------------------------------- */
const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className = "", ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    className={`
      -mx-1 my-1 h-px bg-sub
      ${className}
    `.trim()}
    {...props}
  />
));
SelectSeparator.displayName = SelectPrimitive.Separator.displayName;

/* ============================================
   SELECT WITH LABEL
   ============================================ */

interface SelectWithLabelProps {
  label: string;
  description?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  className?: string;
  disabled?: boolean;
}

const SelectWithLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  SelectWithLabelProps
>(
  (
    {
      label,
      description,
      placeholder = "Select an option",
      value,
      onValueChange,
      options,
      className = "",
      disabled,
    },
    ref
  ) => {
    const id = React.useId();

    return (
      <div className={`w-full ${className}`.trim()}>
        <div className="mb-2">
          <label htmlFor={id} className="text-sm font-medium text-text">
            {label}
          </label>
          {description && <p className="text-xs text-sub">{description}</p>}
        </div>
        <Select value={value} onValueChange={onValueChange} disabled={disabled}>
          <SelectTrigger ref={ref} id={id}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }
);
SelectWithLabel.displayName = "SelectWithLabel";

/* ============================================
   GROUPED SELECT
   ============================================ */

interface SelectGroupOption {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
}

interface GroupedSelectProps {
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  groups: SelectGroupOption[];
  className?: string;
  disabled?: boolean;
}

const GroupedSelect = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  GroupedSelectProps
>(
  (
    {
      placeholder = "Select an option",
      value,
      onValueChange,
      groups,
      className = "",
      disabled,
    },
    ref
  ) => {
    return (
      <Select value={value} onValueChange={onValueChange} disabled={disabled}>
        <SelectTrigger ref={ref} className={className}>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {groups.map((group, index) => (
            <React.Fragment key={group.label}>
              {index > 0 && <SelectSeparator />}
              <SelectGroup>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                  >
                    {option.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </React.Fragment>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
GroupedSelect.displayName = "GroupedSelect";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
  SelectWithLabel,
  GroupedSelect,
};
export type { SelectWithLabelProps, SelectGroupOption, GroupedSelectProps };
