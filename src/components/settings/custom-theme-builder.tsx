'use client';

import { memo, useState, useEffect } from 'react';
import { useConfigStore, type CustomThemeColors } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { RotateCcw, Save, Palette } from 'lucide-react';

interface ColorInputProps {
  label: string;
  colorKey: keyof CustomThemeColors;
  value: string;
  onChange: (key: keyof CustomThemeColors, color: string) => void;
  description?: string;
}

const ColorInput = memo(function ColorInput({
  label,
  colorKey,
  value,
  onChange,
  description,
}: ColorInputProps) {
  const [hexValue, setHexValue] = useState(value);

  useEffect(() => {
    setHexValue(value);
  }, [value]);

  const handleHexChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(newValue)) {
      onChange(colorKey, newValue);
    }
  };

  const handleColorPickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setHexValue(newValue);
    onChange(colorKey, newValue);
  };

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-sub-alt/30 border border-sub/20">
      <div className="relative">
        <input
          type="color"
          value={value}
          onChange={handleColorPickerChange}
          className="w-10 h-10 rounded cursor-pointer border-2 border-sub/30 hover:border-main transition-colors"
          style={{ backgroundColor: value }}
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <label className="text-text font-medium text-sm">{label}</label>
        </div>
        {description && (
          <p className="text-sub text-xs mt-0.5">{description}</p>
        )}
      </div>
      <input
        type="text"
        value={hexValue}
        onChange={handleHexChange}
        placeholder="#000000"
        className={cn(
          'w-24 px-2 py-1.5 rounded text-sm font-mono',
          'bg-bg border border-sub/30 text-text',
          'focus:border-main focus:outline-none',
          'placeholder:text-sub/50'
        )}
      />
    </div>
  );
});

interface ThemePreviewProps {
  colors: CustomThemeColors;
}

const ThemePreview = memo(function ThemePreview({ colors }: ThemePreviewProps) {
  return (
    <div
      className="rounded-lg overflow-hidden border border-sub/30"
      style={{ backgroundColor: colors.bg }}
    >
      {/* Header preview */}
      <div
        className="p-3 border-b"
        style={{ borderColor: colors.sub, backgroundColor: colors.subAlt }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: colors.main }}
          />
          <span className="text-sm font-medium" style={{ color: colors.text }}>
            gorilla type
          </span>
        </div>
      </div>

      {/* Typing preview */}
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-xs" style={{ color: colors.sub }}>
            time 30s
          </span>
          <span className="text-xs" style={{ color: colors.main }}>
            | english
          </span>
        </div>

        <div className="font-mono text-lg space-y-1">
          {/* Typed text */}
          <div className="flex flex-wrap gap-x-2">
            <span style={{ color: colors.text }}>the quick brown</span>
            <span style={{ color: colors.error }}>fxo</span>
            <span style={{ color: colors.sub }}>jumps over the lazy dog</span>
          </div>
        </div>

        {/* Caret indicator */}
        <div className="flex items-center gap-1 mt-2">
          <div
            className="w-0.5 h-5 animate-pulse"
            style={{ backgroundColor: colors.caret }}
          />
          <span className="text-xs" style={{ color: colors.sub }}>
            caret
          </span>
        </div>

        {/* Stats preview */}
        <div className="flex gap-4 mt-4 pt-3 border-t" style={{ borderColor: colors.sub }}>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.main }}>
              65
            </div>
            <div className="text-xs" style={{ color: colors.sub }}>
              wpm
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.text }}>
              98%
            </div>
            <div className="text-xs" style={{ color: colors.sub }}>
              acc
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold" style={{ color: colors.error }}>
              2
            </div>
            <div className="text-xs" style={{ color: colors.sub }}>
              errors
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const colorLabels: { key: keyof CustomThemeColors; label: string; description: string }[] = [
  { key: 'bg', label: 'Background', description: 'Main background color' },
  { key: 'main', label: 'Main', description: 'Accent color for highlights' },
  { key: 'caret', label: 'Caret', description: 'Typing cursor color' },
  { key: 'sub', label: 'Sub', description: 'Secondary text color' },
  { key: 'subAlt', label: 'Sub Alt', description: 'Alternative background' },
  { key: 'text', label: 'Text', description: 'Primary text color' },
  { key: 'error', label: 'Error', description: 'Error highlight color' },
  { key: 'errorExtra', label: 'Error Extra', description: 'Secondary error color' },
];

const defaultColors: CustomThemeColors = {
  bg: '#323437',
  main: '#e2b714',
  caret: '#e2b714',
  sub: '#646669',
  subAlt: '#2c2e31',
  text: '#d1d0c5',
  error: '#ca4754',
  errorExtra: '#7e2a33',
};

interface CustomThemeBuilderProps {
  className?: string;
}

export const CustomThemeBuilder = memo(function CustomThemeBuilder({
  className = '',
}: CustomThemeBuilderProps) {
  const { customTheme, setCustomThemeColor, saveCustomTheme, clearCustomTheme } = useConfigStore();
  const [themeName, setThemeName] = useState('My Custom Theme');
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Use custom theme colors or default
  const currentColors: CustomThemeColors = customTheme || defaultColors;

  const handleColorChange = (key: keyof CustomThemeColors, color: string) => {
    setCustomThemeColor(key, color);
  };

  const handleSave = () => {
    saveCustomTheme(themeName);
    setSaveMessage('Theme saved!');
    setTimeout(() => setSaveMessage(null), 2000);
  };

  const handleReset = () => {
    // Reset to default colors by setting each one
    Object.entries(defaultColors).forEach(([key, value]) => {
      setCustomThemeColor(key as keyof CustomThemeColors, value);
    });
  };

  const handleClear = () => {
    clearCustomTheme();
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-main/10">
          <Palette className="w-5 h-5 text-main" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-text">Custom Theme Builder</h3>
          <p className="text-sm text-sub">Create your own personalized theme</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Color inputs */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-text mb-3">Theme Colors</h4>
          {colorLabels.map(({ key, label, description }) => (
            <ColorInput
              key={key}
              label={label}
              colorKey={key}
              value={currentColors[key]}
              onChange={handleColorChange}
              description={description}
            />
          ))}
        </div>

        {/* Preview */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-text mb-3">Live Preview</h4>
          <ThemePreview colors={currentColors} />

          {/* Save section */}
          <div className="space-y-3 pt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={themeName}
                onChange={(e) => setThemeName(e.target.value)}
                placeholder="Theme name"
                className={cn(
                  'flex-1 px-3 py-2 rounded-lg text-sm',
                  'bg-sub-alt border border-sub/30 text-text',
                  'focus:border-main focus:outline-none',
                  'placeholder:text-sub/50'
                )}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className={cn(
                  'flex-1 flex items-center justify-center gap-2',
                  'px-4 py-2.5 rounded-lg font-medium text-sm',
                  'bg-main text-bg',
                  'hover:opacity-90 transition-opacity',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
                )}
              >
                <Save className="w-4 h-4" />
                Save Theme
              </button>

              <button
                onClick={handleReset}
                className={cn(
                  'flex items-center justify-center gap-2',
                  'px-4 py-2.5 rounded-lg font-medium text-sm',
                  'bg-sub-alt text-sub border border-sub/30',
                  'hover:text-text hover:border-sub transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg'
                )}
                title="Reset to default colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {saveMessage && (
              <div className="text-sm text-main text-center animate-fade-in">
                {saveMessage}
              </div>
            )}

            <button
              onClick={handleClear}
              className={cn(
                'w-full px-4 py-2 rounded-lg text-sm',
                'text-sub hover:text-error transition-colors',
                'border border-transparent hover:border-error/30'
              )}
            >
              Clear Custom Theme & Use Preset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CustomThemeBuilder;
