"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

/* ============================================
   SWITCH COMPONENT
   Using @radix-ui/react-switch
   ============================================ */

type SwitchSize = "sm" | "md" | "lg";

interface SwitchProps
  extends React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root> {
  size?: SwitchSize;
}

/* ----------------------------------------
   Size Configurations
   ---------------------------------------- */
const sizeConfig: Record<
  SwitchSize,
  { root: string; thumb: string; translate: string }
> = {
  sm: {
    root: "h-4 w-7",
    thumb: "h-3 w-3",
    translate: "data-[state=checked]:translate-x-3",
  },
  md: {
    root: "h-5 w-9",
    thumb: "h-4 w-4",
    translate: "data-[state=checked]:translate-x-4",
  },
  lg: {
    root: "h-6 w-11",
    thumb: "h-5 w-5",
    translate: "data-[state=checked]:translate-x-5",
  },
};

/* ----------------------------------------
   Switch Component
   ---------------------------------------- */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchProps
>(({ className = "", size = "md", ...props }, ref) => {
  const config = sizeConfig[size];

  return (
    <SwitchPrimitive.Root
      className={`
        peer inline-flex shrink-0 cursor-pointer items-center
        rounded-full border-2 border-transparent
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:cursor-not-allowed disabled:opacity-50
        data-[state=checked]:bg-main data-[state=unchecked]:bg-sub
        ${config.root}
        ${className}
      `.trim()}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={`
          pointer-events-none block rounded-full
          bg-bg shadow-lg ring-0
          transition-transform duration-200
          data-[state=unchecked]:translate-x-0
          ${config.thumb}
          ${config.translate}
        `.trim()}
      />
    </SwitchPrimitive.Root>
  );
});
Switch.displayName = SwitchPrimitive.Root.displayName;

/* ============================================
   SWITCH WITH LABEL
   ============================================ */

interface SwitchWithLabelProps extends SwitchProps {
  label: string;
  description?: string;
  labelPosition?: "left" | "right";
}

const SwitchWithLabel = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  SwitchWithLabelProps
>(
  (
    {
      label,
      description,
      labelPosition = "right",
      className = "",
      size = "md",
      ...props
    },
    ref
  ) => {
    const id = React.useId();

    const labelElement = (
      <div className={labelPosition === "left" ? "mr-3" : "ml-3"}>
        <label
          htmlFor={id}
          className="text-sm font-medium leading-none text-text cursor-pointer"
        >
          {label}
        </label>
        {description && (
          <p className="text-xs text-sub mt-0.5">{description}</p>
        )}
      </div>
    );

    return (
      <div
        className={`
          flex items-center
          ${className}
        `.trim()}
      >
        {labelPosition === "left" && labelElement}
        <Switch ref={ref} id={id} size={size} {...props} />
        {labelPosition === "right" && labelElement}
      </div>
    );
  }
);
SwitchWithLabel.displayName = "SwitchWithLabel";

/* ============================================
   SWITCH VARIANTS
   ============================================ */

/* ----------------------------------------
   Colored Switch (success/error states)
   ---------------------------------------- */
interface ColoredSwitchProps extends SwitchProps {
  variant?: "default" | "success" | "error";
}

const ColoredSwitch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  ColoredSwitchProps
>(({ className = "", variant = "default", size = "md", ...props }, ref) => {
  const config = sizeConfig[size];

  const variantStyles = {
    default: "data-[state=checked]:bg-main",
    success: "data-[state=checked]:bg-success",
    error: "data-[state=checked]:bg-error",
  };

  return (
    <SwitchPrimitive.Root
      className={`
        peer inline-flex shrink-0 cursor-pointer items-center
        rounded-full border-2 border-transparent
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg
        disabled:cursor-not-allowed disabled:opacity-50
        data-[state=unchecked]:bg-sub
        ${variantStyles[variant]}
        ${config.root}
        ${className}
      `.trim()}
      {...props}
      ref={ref}
    >
      <SwitchPrimitive.Thumb
        className={`
          pointer-events-none block rounded-full
          bg-bg shadow-lg ring-0
          transition-transform duration-200
          data-[state=unchecked]:translate-x-0
          ${config.thumb}
          ${config.translate}
        `.trim()}
      />
    </SwitchPrimitive.Root>
  );
});
ColoredSwitch.displayName = "ColoredSwitch";

export { Switch, SwitchWithLabel, ColoredSwitch };
export type { SwitchSize, SwitchProps, SwitchWithLabelProps, ColoredSwitchProps };
