'use client';

import { memo, useState, useEffect } from 'react';
import { useConfigStore, type CaretStyle, type SmoothCaret } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { Switch } from '@/components/ui/switch';
import { Caret } from '@/components/typing/caret';
import { Check } from 'lucide-react';

type CaretStyleOption = 'off' | CaretStyle;

interface StyleOption {
  id: CaretStyleOption;
  name: string;
  description: string;
}

const styleOptions: StyleOption[] = [
  { id: 'off', name: 'Off', description: 'No caret visible' },
  { id: 'line', name: 'Line', description: 'Vertical line cursor' },
  { id: 'block', name: 'Block', description: 'Full character block' },
  { id: 'outline', name: 'Outline', description: 'Block outline only' },
  { id: 'underline', name: 'Underline', description: 'Horizontal underscore' },
];

interface SpeedOption {
  id: SmoothCaret;
  name: string;
  description: string;
}

const speedOptions: SpeedOption[] = [
  { id: 'off', name: 'Off', description: 'No animation' },
  { id: 'slow', name: 'Slow', description: '200ms transition' },
  { id: 'medium', name: 'Medium', description: '100ms transition' },
  { id: 'fast', name: 'Fast', description: '50ms transition' },
];

interface CaretSettingsProps {
  /** Additional class names */
  className?: string;
}

export const CaretSettings = memo(function CaretSettings({
  className = '',
}: CaretSettingsProps) {
  const { caret, setCaretStyle, setSmoothCaret } = useConfigStore();
  const [caretEnabled, setCaretEnabled] = useState(true);
  const [previewPosition, setPreviewPosition] = useState(0);

  // Animate preview caret
  useEffect(() => {
    if (caret.smoothCaret === 'off') return;

    const interval = setInterval(() => {
      setPreviewPosition((prev) => (prev >= 4 ? 0 : prev + 1));
    }, 800);

    return () => clearInterval(interval);
  }, [caret.smoothCaret]);

  const handleStyleSelect = (styleId: CaretStyleOption) => {
    if (styleId === 'off') {
      setCaretEnabled(false);
    } else {
      setCaretEnabled(true);
      setCaretStyle(styleId);
    }
  };

  const handleSmoothToggle = (checked: boolean) => {
    setSmoothCaret(checked ? 'medium' : 'off');
  };

  const handleSpeedSelect = (speedId: SmoothCaret) => {
    setSmoothCaret(speedId);
  };

  const currentStyle = caretEnabled ? caret.style : 'off';
  const isSmoothEnabled = caret.smoothCaret !== 'off';

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Caret Style Selection */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Caret Style</h4>
        <div className="flex flex-wrap gap-2">
          {styleOptions.map((style) => {
            const isActive = currentStyle === style.id;
            return (
              <button
                key={style.id}
                onClick={() => handleStyleSelect(style.id)}
                className={cn(
                  'relative px-4 py-2 rounded-lg',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                  isActive
                    ? 'border-main bg-main/10'
                    : 'border-sub/30 hover:border-sub bg-sub-alt/30'
                )}
                title={style.description}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-main' : 'text-text'
                  )}
                >
                  {style.name}
                </span>
                {isActive && (
                  <Check className="absolute top-1 right-1 h-3 w-3 text-main" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Smooth Caret Toggle */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-sub-alt/30">
        <div>
          <h4 className="text-text font-medium">Smooth Caret</h4>
          <p className="text-sub text-sm">
            Animate caret movement between characters
          </p>
        </div>
        <Switch
          checked={isSmoothEnabled}
          onCheckedChange={handleSmoothToggle}
          disabled={!caretEnabled}
        />
      </div>

      {/* Caret Speed Selection */}
      <div className={cn(!isSmoothEnabled && 'opacity-50 pointer-events-none')}>
        <h4 className="text-sm font-medium text-text mb-3">Caret Speed</h4>
        <div className="flex flex-wrap gap-2">
          {speedOptions
            .filter((s) => s.id !== 'off')
            .map((speed) => {
              const isActive = caret.smoothCaret === speed.id;
              return (
                <button
                  key={speed.id}
                  onClick={() => handleSpeedSelect(speed.id)}
                  disabled={!isSmoothEnabled}
                  className={cn(
                    'px-4 py-2 rounded-lg',
                    'border-2 transition-all duration-200',
                    'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                    isActive
                      ? 'border-main bg-main/10'
                      : 'border-sub/30 hover:border-sub bg-sub-alt/30'
                  )}
                  title={speed.description}
                >
                  <span
                    className={cn(
                      'text-sm font-medium',
                      isActive ? 'text-main' : 'text-text'
                    )}
                  >
                    {speed.name}
                  </span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Live Preview */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Live Preview</h4>
        <div className="p-4 rounded-lg bg-sub-alt/50 border border-sub/20">
          <div className="flex items-center h-8 font-mono text-xl">
            {['t', 'y', 'p', 'e', 'd'].map((char, index) => (
              <span key={index} className="relative inline-flex">
                {previewPosition === index && caretEnabled && (
                  <span
                    className="absolute left-0 top-0"
                    style={{
                      transform:
                        caret.smoothCaret !== 'off'
                          ? 'translateX(0)'
                          : undefined,
                      transition:
                        caret.smoothCaret !== 'off'
                          ? `all ${
                              caret.smoothCaret === 'slow'
                                ? '200ms'
                                : caret.smoothCaret === 'medium'
                                ? '100ms'
                                : '50ms'
                            } ease-out`
                          : undefined,
                    }}
                  >
                    <Caret
                      style={caret.style}
                      smooth={caret.smoothCaret}
                      blinkSpeed="medium"
                      height={24}
                    />
                  </span>
                )}
                <span
                  className={cn(
                    'px-0.5',
                    index < previewPosition ? 'text-text' : 'text-sub'
                  )}
                >
                  {char}
                </span>
              </span>
            ))}
          </div>

          <p className="mt-4 text-sm text-sub">
            {!caretEnabled
              ? 'Caret is disabled'
              : `Style: ${caret.style} | Smooth: ${caret.smoothCaret}`}
          </p>
        </div>
      </div>

      {/* Current Settings Summary */}
      <div className="flex items-center justify-between text-sm text-sub pt-2 border-t border-sub/20">
        <span>
          Style:{' '}
          <span className="text-text">
            {styleOptions.find((s) => s.id === currentStyle)?.name}
          </span>
        </span>
        <span>
          Speed:{' '}
          <span className="text-text">
            {speedOptions.find((s) => s.id === caret.smoothCaret)?.name}
          </span>
        </span>
      </div>
    </div>
  );
});

export default CaretSettings;
