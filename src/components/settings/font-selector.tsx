'use client';

import { memo, useState, useEffect } from 'react';
import { useConfigStore, type FontFamily, type FontSize } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { Slider } from '@/components/ui/slider';
import { Check } from 'lucide-react';

interface FontOption {
  id: FontFamily;
  name: string;
  family: string;
  description: string;
}

const fontOptions: FontOption[] = [
  {
    id: 'roboto_mono',
    name: 'Roboto Mono',
    family: '"Roboto Mono", monospace',
    description: 'Clean and modern monospace',
  },
  {
    id: 'jetbrains_mono',
    name: 'JetBrains Mono',
    family: '"JetBrains Mono", monospace',
    description: 'Developer favorite with ligatures',
  },
  {
    id: 'fira_code',
    name: 'Fira Code',
    family: '"Fira Code", monospace',
    description: 'Programming ligatures',
  },
  {
    id: 'source_code_pro',
    name: 'Source Code Pro',
    family: '"Source Code Pro", monospace',
    description: 'Adobe open source font',
  },
  {
    id: 'ibm_plex_mono',
    name: 'IBM Plex Mono',
    family: '"IBM Plex Mono", monospace',
    description: 'Corporate technical font',
  },
];

const fontSizeOptions: { id: FontSize; label: string; size: number }[] = [
  { id: 'small', label: 'Small', size: 1 },
  { id: 'medium', label: 'Medium', size: 1.25 },
  { id: 'large', label: 'Large', size: 1.5 },
  { id: 'extra_large', label: 'Extra Large', size: 2 },
];

interface FontSelectorProps {
  /** Additional class names */
  className?: string;
}

export const FontSelector = memo(function FontSelector({
  className = '',
}: FontSelectorProps) {
  const { visual, setFontFamily, setFontSize } = useConfigStore();
  const currentFont = visual.fontFamily;
  const currentSize = visual.fontSize;

  // Custom size slider value (1-2 rem range mapped to 0-100)
  const [customSize, setCustomSize] = useState(() => {
    const sizeOption = fontSizeOptions.find((s) => s.id === currentSize);
    return sizeOption ? (sizeOption.size - 1) * 100 : 25;
  });

  const handleFontSelect = (fontId: FontFamily) => {
    setFontFamily(fontId);
  };

  const handleSizeSelect = (sizeId: FontSize) => {
    setFontSize(sizeId);
    const sizeOption = fontSizeOptions.find((s) => s.id === sizeId);
    if (sizeOption) {
      setCustomSize((sizeOption.size - 1) * 100);
    }
  };

  const handleSliderChange = (value: number[]) => {
    const sliderValue = value[0];
    setCustomSize(sliderValue);

    // Map slider value to closest font size
    const remSize = 1 + sliderValue / 100;
    const closest = fontSizeOptions.reduce((prev, curr) => {
      return Math.abs(curr.size - remSize) < Math.abs(prev.size - remSize)
        ? curr
        : prev;
    });
    setFontSize(closest.id);
  };

  const currentFontOption = fontOptions.find((f) => f.id === currentFont);
  const previewRemSize = 1 + customSize / 100;

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Font Family Selection */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Font Family</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {fontOptions.map((font) => {
            const isActive = currentFont === font.id;
            return (
              <button
                key={font.id}
                onClick={() => handleFontSelect(font.id)}
                className={cn(
                  'group relative flex items-center justify-between',
                  'px-4 py-3 rounded-lg',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                  isActive
                    ? 'border-main bg-main/10'
                    : 'border-sub/30 hover:border-sub bg-sub-alt/30'
                )}
              >
                <div className="text-left">
                  <span
                    className={cn(
                      'block font-medium',
                      isActive ? 'text-main' : 'text-text'
                    )}
                    style={{ fontFamily: font.family }}
                  >
                    {font.name}
                  </span>
                  <span className="text-xs text-sub">{font.description}</span>
                </div>
                {isActive && (
                  <Check className="h-5 w-5 text-main flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Font Size Selection */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Font Size</h4>

        {/* Size Presets */}
        <div className="flex flex-wrap gap-2 mb-4">
          {fontSizeOptions.map((size) => {
            const isActive = currentSize === size.id;
            return (
              <button
                key={size.id}
                onClick={() => handleSizeSelect(size.id)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm',
                  'border transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-main',
                  isActive
                    ? 'border-main bg-main text-bg'
                    : 'border-sub/30 text-sub hover:border-sub hover:text-text'
                )}
              >
                {size.label}
              </button>
            );
          })}
        </div>

        {/* Size Slider */}
        <div className="px-2">
          <Slider
            value={[customSize]}
            onValueChange={handleSliderChange}
            min={0}
            max={100}
            step={1}
            showValue
            formatValue={(v) => `${(1 + v / 100).toFixed(2)} rem`}
          />
        </div>
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Preview</h4>
        <div
          className="p-4 rounded-lg bg-sub-alt/50 border border-sub/20"
          style={{ fontFamily: currentFontOption?.family }}
        >
          <p
            className="text-text leading-relaxed"
            style={{ fontSize: `${previewRemSize}rem` }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
          <p
            className="text-sub mt-2"
            style={{ fontSize: `${previewRemSize * 0.875}rem` }}
          >
            0123456789 !@#$%^&*()
          </p>
          <div
            className="mt-3 flex gap-2 text-main"
            style={{ fontSize: `${previewRemSize}rem` }}
          >
            <span className="text-text">correct</span>
            <span className="text-error">error</span>
            <span className="text-sub">untyped</span>
          </div>
        </div>
      </div>

      {/* Current Selection Info */}
      <div className="flex items-center justify-between text-sm text-sub">
        <span>
          Current: <span className="text-text">{currentFontOption?.name}</span>
        </span>
        <span>
          Size:{' '}
          <span className="text-text">
            {fontSizeOptions.find((s) => s.id === currentSize)?.label}
          </span>
        </span>
      </div>
    </div>
  );
});

export default FontSelector;
