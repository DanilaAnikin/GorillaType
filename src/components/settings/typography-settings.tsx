'use client';

import { memo } from 'react';
import { useConfigStore } from '@/store/config-store';
import { Slider } from '@/components/ui/slider';

interface TypographySettingsProps {
  /** Additional class names */
  className?: string;
}

const fontFamilyMap: Record<string, string> = {
  roboto_mono: '"Roboto Mono", monospace',
  jetbrains_mono: '"JetBrains Mono", monospace',
  fira_code: '"Fira Code", monospace',
  source_code_pro: '"Source Code Pro", monospace',
  ibm_plex_mono: '"IBM Plex Mono", monospace',
};

export const TypographySettings = memo(function TypographySettings({
  className = '',
}: TypographySettingsProps) {
  const { visual, setLineHeight, setLetterSpacing } = useConfigStore();
  const { lineHeight = 1.5, letterSpacing = 0, fontFamily, fontSize } = visual;

  // Map fontSize to actual rem value for preview
  const fontSizeMap: Record<string, number> = {
    small: 1,
    medium: 1.25,
    large: 1.5,
    extra_large: 2,
  };
  const previewFontSize = fontSizeMap[fontSize] || 1.25;
  const fontFamilyCss = fontFamilyMap[fontFamily] || '"Roboto Mono", monospace';

  // Convert lineHeight value (1.0 to 2.5) to slider value (0 to 150)
  const lineHeightSliderValue = (lineHeight - 1.0) * 100;

  // Convert letterSpacing value (-0.05 to 0.2) to slider value (0 to 25)
  const letterSpacingSliderValue = (letterSpacing + 0.05) * 100;

  const handleLineHeightChange = (value: number[]) => {
    // Convert slider value (0-150) to lineHeight (1.0-2.5)
    const newLineHeight = 1.0 + value[0] / 100;
    setLineHeight(newLineHeight);
  };

  const handleLetterSpacingChange = (value: number[]) => {
    // Convert slider value (0-25) to letterSpacing (-0.05 to 0.2)
    const newLetterSpacing = -0.05 + value[0] / 100;
    setLetterSpacing(newLetterSpacing);
  };

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Line Height Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text">Line Height</label>
          <span className="text-sm font-medium text-main">{lineHeight.toFixed(1)}</span>
        </div>
        <Slider
          value={[lineHeightSliderValue]}
          onValueChange={handleLineHeightChange}
          min={0}
          max={150}
          step={10}
          showValue
          formatValue={(v) => `${(1.0 + v / 100).toFixed(1)}`}
        />
        <p className="text-xs text-sub mt-1">
          Adjust the vertical spacing between lines (1.0 to 2.5)
        </p>
      </div>

      {/* Letter Spacing Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-text">Letter Spacing</label>
          <span className="text-sm font-medium text-main">{letterSpacing.toFixed(2)}em</span>
        </div>
        <Slider
          value={[letterSpacingSliderValue]}
          onValueChange={handleLetterSpacingChange}
          min={0}
          max={25}
          step={1}
          showValue
          formatValue={(v) => `${(-0.05 + v / 100).toFixed(2)}em`}
        />
        <p className="text-xs text-sub mt-1">
          Adjust the horizontal spacing between characters (-0.05em to 0.2em)
        </p>
      </div>

      {/* Preview */}
      <div>
        <h4 className="text-sm font-medium text-text mb-3">Typography Preview</h4>
        <div
          className="p-4 rounded-lg bg-sub-alt/50 border border-sub/20"
          style={{ fontFamily: fontFamilyCss }}
        >
          <p
            className="text-text"
            style={{
              fontSize: `${previewFontSize}rem`,
              lineHeight: lineHeight,
              letterSpacing: `${letterSpacing}em`,
            }}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
          <p
            className="text-sub mt-2"
            style={{
              fontSize: `${previewFontSize * 0.875}rem`,
              lineHeight: lineHeight,
              letterSpacing: `${letterSpacing}em`,
            }}
          >
            0123456789 !@#$%^&*()
          </p>
          <div
            className="mt-3 flex gap-2"
            style={{
              fontSize: `${previewFontSize}rem`,
              lineHeight: lineHeight,
              letterSpacing: `${letterSpacing}em`,
            }}
          >
            <span className="text-text">correct</span>
            <span className="text-error">error</span>
            <span className="text-sub">untyped</span>
          </div>
        </div>
      </div>

      {/* Current Values Info */}
      <div className="flex items-center justify-between text-sm text-sub">
        <span>
          Line Height: <span className="text-text">{lineHeight.toFixed(1)}</span>
        </span>
        <span>
          Letter Spacing: <span className="text-text">{letterSpacing.toFixed(2)}em</span>
        </span>
      </div>
    </div>
  );
});

export default TypographySettings;
