"use client";

import * as React from "react";
import * as SliderPrimitive from "@radix-ui/react-slider";

/* ============================================
   SLIDER COMPONENT
   Using @radix-ui/react-slider
   ============================================ */

interface SliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

/* ----------------------------------------
   Slider Component
   ---------------------------------------- */
const Slider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(
  (
    { className = "", showValue = false, formatValue, value, ...props },
    ref
  ) => {
    const displayValue = value?.[0] ?? props.defaultValue?.[0] ?? 0;
    const formattedValue = formatValue
      ? formatValue(displayValue)
      : String(displayValue);

    return (
      <div className="relative w-full">
        <SliderPrimitive.Root
          ref={ref}
          className={`
            relative flex w-full touch-none select-none items-center
            ${className}
          `.trim()}
          value={value}
          {...props}
        >
          <SliderPrimitive.Track
            className="
              relative h-2 w-full grow overflow-hidden
              rounded-full bg-sub-alt
            "
          >
            <SliderPrimitive.Range
              className="
                absolute h-full bg-main
                transition-all duration-100
              "
            />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            className="
              block h-5 w-5 rounded-full
              border-2 border-main bg-bg
              shadow-md
              ring-offset-bg
              transition-colors duration-200
              focus-visible:outline-none focus-visible:ring-2
              focus-visible:ring-main focus-visible:ring-offset-2
              disabled:pointer-events-none disabled:opacity-50
              hover:bg-sub-alt
              cursor-grab active:cursor-grabbing
            "
          />
        </SliderPrimitive.Root>
        {showValue && (
          <div className="mt-1 text-center text-sm text-sub">
            {formattedValue}
          </div>
        )}
      </div>
    );
  }
);
Slider.displayName = SliderPrimitive.Root.displayName;

/* ============================================
   RANGE SLIDER (dual thumbs)
   ============================================ */

interface RangeSliderProps
  extends React.ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  showValues?: boolean;
  formatValue?: (value: number) => string;
}

const RangeSlider = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  RangeSliderProps
>(({ className = "", showValues = false, formatValue, value, ...props }, ref) => {
  const minValue = value?.[0] ?? props.defaultValue?.[0] ?? 0;
  const maxValue = value?.[1] ?? props.defaultValue?.[1] ?? 100;
  const formattedMin = formatValue ? formatValue(minValue) : String(minValue);
  const formattedMax = formatValue ? formatValue(maxValue) : String(maxValue);

  return (
    <div className="relative w-full">
      <SliderPrimitive.Root
        ref={ref}
        className={`
          relative flex w-full touch-none select-none items-center
          ${className}
        `.trim()}
        value={value}
        {...props}
      >
        <SliderPrimitive.Track
          className="
            relative h-2 w-full grow overflow-hidden
            rounded-full bg-sub-alt
          "
        >
          <SliderPrimitive.Range
            className="
              absolute h-full bg-main
              transition-all duration-100
            "
          />
        </SliderPrimitive.Track>
        <SliderPrimitive.Thumb
          className="
            block h-5 w-5 rounded-full
            border-2 border-main bg-bg
            shadow-md
            ring-offset-bg
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-main focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            hover:bg-sub-alt
            cursor-grab active:cursor-grabbing
          "
        />
        <SliderPrimitive.Thumb
          className="
            block h-5 w-5 rounded-full
            border-2 border-main bg-bg
            shadow-md
            ring-offset-bg
            transition-colors duration-200
            focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-main focus-visible:ring-offset-2
            disabled:pointer-events-none disabled:opacity-50
            hover:bg-sub-alt
            cursor-grab active:cursor-grabbing
          "
        />
      </SliderPrimitive.Root>
      {showValues && (
        <div className="mt-1 flex justify-between text-sm text-sub">
          <span>{formattedMin}</span>
          <span>{formattedMax}</span>
        </div>
      )}
    </div>
  );
});
RangeSlider.displayName = "RangeSlider";

/* ============================================
   SLIDER WITH LABEL
   ============================================ */

interface SliderWithLabelProps extends SliderProps {
  label: string;
  description?: string;
}

const SliderWithLabel = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderWithLabelProps
>(({ label, description, className = "", value, formatValue, ...props }, ref) => {
  const displayValue = value?.[0] ?? props.defaultValue?.[0] ?? 0;
  const formattedValue = formatValue
    ? formatValue(displayValue)
    : String(displayValue);

  return (
    <div className={`w-full ${className}`.trim()}>
      <div className="flex items-center justify-between mb-2">
        <div>
          <label className="text-sm font-medium text-text">{label}</label>
          {description && (
            <p className="text-xs text-sub">{description}</p>
          )}
        </div>
        <span className="text-sm font-medium text-main">{formattedValue}</span>
      </div>
      <Slider ref={ref} value={value} formatValue={formatValue} {...props} />
    </div>
  );
});
SliderWithLabel.displayName = "SliderWithLabel";

/* ============================================
   SLIDER VARIANTS
   ============================================ */

/* ----------------------------------------
   Thin Slider
   ---------------------------------------- */
const SliderThin = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className = "", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`
      relative flex w-full touch-none select-none items-center
      ${className}
    `.trim()}
    {...props}
  >
    <SliderPrimitive.Track
      className="
        relative h-1 w-full grow overflow-hidden
        rounded-full bg-sub-alt
      "
    >
      <SliderPrimitive.Range
        className="
          absolute h-full bg-main
          transition-all duration-100
        "
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="
        block h-3 w-3 rounded-full
        border-2 border-main bg-bg
        shadow-sm
        ring-offset-bg
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-main focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        hover:bg-sub-alt
        cursor-grab active:cursor-grabbing
      "
    />
  </SliderPrimitive.Root>
));
SliderThin.displayName = "SliderThin";

/* ----------------------------------------
   Thick Slider
   ---------------------------------------- */
const SliderThick = React.forwardRef<
  React.ElementRef<typeof SliderPrimitive.Root>,
  SliderProps
>(({ className = "", ...props }, ref) => (
  <SliderPrimitive.Root
    ref={ref}
    className={`
      relative flex w-full touch-none select-none items-center
      ${className}
    `.trim()}
    {...props}
  >
    <SliderPrimitive.Track
      className="
        relative h-4 w-full grow overflow-hidden
        rounded-full bg-sub-alt
      "
    >
      <SliderPrimitive.Range
        className="
          absolute h-full bg-main
          transition-all duration-100
        "
      />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb
      className="
        block h-6 w-6 rounded-full
        border-2 border-main bg-bg
        shadow-lg
        ring-offset-bg
        transition-colors duration-200
        focus-visible:outline-none focus-visible:ring-2
        focus-visible:ring-main focus-visible:ring-offset-2
        disabled:pointer-events-none disabled:opacity-50
        hover:bg-sub-alt
        cursor-grab active:cursor-grabbing
      "
    />
  </SliderPrimitive.Root>
));
SliderThick.displayName = "SliderThick";

export {
  Slider,
  RangeSlider,
  SliderWithLabel,
  SliderThin,
  SliderThick,
};
export type { SliderProps, RangeSliderProps, SliderWithLabelProps };
