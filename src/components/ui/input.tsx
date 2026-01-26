"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Show error state styling */
  error?: boolean;
  /** Error message to display */
  errorMessage?: string;
  /** Icon to display on the left side */
  leftIcon?: React.ReactNode;
  /** Icon to display on the right side */
  rightIcon?: React.ReactNode;
  /** Container class name */
  containerClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      error,
      errorMessage,
      leftIcon,
      rightIcon,
      containerClassName,
      disabled,
      ...props
    },
    ref
  ) => {
    const hasLeftIcon = !!leftIcon;
    const hasRightIcon = !!rightIcon;

    return (
      <div className={cn("relative w-full", containerClassName)}>
        {leftIcon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-sub">
            {leftIcon}
          </div>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-md border border-sub bg-bg px-3 py-2 text-sm text-text transition-colors",
            "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-text",
            "placeholder:text-sub",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-main focus-visible:ring-offset-2 focus-visible:ring-offset-bg",
            "disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-error focus-visible:ring-error",
            hasLeftIcon && "pl-10",
            hasRightIcon && "pr-10",
            className
          )}
          ref={ref}
          disabled={disabled}
          aria-invalid={error}
          aria-describedby={errorMessage ? `${props.id}-error` : undefined}
          {...props}
        />
        {rightIcon && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sub">
            {rightIcon}
          </div>
        )}
        {error && errorMessage && (
          <p
            id={`${props.id}-error`}
            className="mt-1.5 text-sm text-error"
            role="alert"
          >
            {errorMessage}
          </p>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
