'use client';

import { memo, useState } from 'react';
import { useConfigStore, type Theme, type CustomThemeColors } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { Check, Palette, ChevronDown, ChevronUp } from 'lucide-react';
import { CustomThemeBuilder } from './custom-theme-builder';

interface ThemePreview {
  id: Theme;
  name: string;
  colors: {
    bg: string;
    text: string;
    sub: string;
    main: string;
    error: string;
  };
}

const themes: ThemePreview[] = [
  {
    id: 'serika-dark',
    name: 'Serika Dark',
    colors: {
      bg: '#323437',
      text: '#d1d0c5',
      sub: '#646669',
      main: '#e2b714',
      error: '#ca4754',
    },
  },
  {
    id: 'serika',
    name: 'Serika',
    colors: {
      bg: '#e1e1e3',
      text: '#323437',
      sub: '#7a7d82',
      main: '#c9a40e',
      error: '#ca4754',
    },
  },
  {
    id: 'solarized-light',
    name: 'Solarized Light',
    colors: {
      bg: '#fdf6e3',
      text: '#657b83',
      sub: '#93a1a1',
      main: '#b58900',
      error: '#dc322f',
    },
  },
  {
    id: 'github-light',
    name: 'GitHub Light',
    colors: {
      bg: '#ffffff',
      text: '#24292f',
      sub: '#6e7781',
      main: '#0969da',
      error: '#cf222e',
    },
  },
  {
    id: 'nord-light',
    name: 'Nord Light',
    colors: {
      bg: '#eceff4',
      text: '#2e3440',
      sub: '#7b88a1',
      main: '#5e81ac',
      error: '#bf616a',
    },
  },
  {
    id: 'dracula',
    name: 'Dracula',
    colors: {
      bg: '#282a36',
      text: '#f8f8f2',
      sub: '#6272a4',
      main: '#bd93f9',
      error: '#ff5555',
    },
  },
  {
    id: 'nord',
    name: 'Nord',
    colors: {
      bg: '#2e3440',
      text: '#eceff4',
      sub: '#4c566a',
      main: '#88c0d0',
      error: '#bf616a',
    },
  },
  {
    id: 'monokai',
    name: 'Monokai',
    colors: {
      bg: '#272822',
      text: '#f8f8f2',
      sub: '#75715e',
      main: '#a6e22e',
      error: '#f92672',
    },
  },
  {
    id: 'solarized-dark',
    name: 'Solarized Dark',
    colors: {
      bg: '#002b36',
      text: '#839496',
      sub: '#586e75',
      main: '#b58900',
      error: '#dc322f',
    },
  },
  {
    id: 'gruvbox-dark',
    name: 'Gruvbox Dark',
    colors: {
      bg: '#282828',
      text: '#ebdbb2',
      sub: '#928374',
      main: '#fabd2f',
      error: '#fb4934',
    },
  },
  {
    id: 'catppuccin-mocha',
    name: 'Catppuccin Mocha',
    colors: {
      bg: '#1e1e2e',
      text: '#cdd6f4',
      sub: '#6c7086',
      main: '#f5c2e7',
      error: '#f38ba8',
    },
  },
  {
    id: 'tokyo-night',
    name: 'Tokyo Night',
    colors: {
      bg: '#1a1b26',
      text: '#a9b1d6',
      sub: '#565f89',
      main: '#7aa2f7',
      error: '#f7768e',
    },
  },
  {
    id: 'github-dark',
    name: 'GitHub Dark',
    colors: {
      bg: '#0d1117',
      text: '#c9d1d9',
      sub: '#8b949e',
      main: '#58a6ff',
      error: '#f85149',
    },
  },
  {
    id: 'one-dark',
    name: 'One Dark',
    colors: {
      bg: '#282c34',
      text: '#abb2bf',
      sub: '#5c6370',
      main: '#61afef',
      error: '#e06c75',
    },
  },
  {
    id: 'cyber',
    name: 'Cyber',
    colors: {
      bg: '#0a0a0f',
      text: '#00ff9f',
      sub: '#008f5f',
      main: '#00ff9f',
      error: '#ff0055',
    },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    colors: {
      bg: '#0d1117',
      text: '#c9d1d9',
      sub: '#8b949e',
      main: '#58a6ff',
      error: '#f85149',
    },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    colors: {
      bg: '#1b2838',
      text: '#c7d5e0',
      sub: '#66c0f4',
      main: '#66c0f4',
      error: '#cf6679',
    },
  },
  {
    id: 'matrix',
    name: 'Matrix',
    colors: {
      bg: '#0d0d0d',
      text: '#00ff00',
      sub: '#008800',
      main: '#00ff00',
      error: '#ff0000',
    },
  },
];


interface ThemeSelectorProps {
  /** Additional class names */
  className?: string;
}

export const ThemeSelector = memo(function ThemeSelector({
  className = '',
}: ThemeSelectorProps) {
  const { visual, setTheme, customTheme } = useConfigStore();
  const currentTheme = visual.theme;
  const [showCustomBuilder, setShowCustomBuilder] = useState(currentTheme === 'custom');

  const handleThemeSelect = (themeId: Theme) => {
    setTheme(themeId);
    if (themeId === 'custom') {
      setShowCustomBuilder(true);
    }
  };

  // Get custom theme colors for preview
  const customThemePreview: ThemePreview | null = customTheme ? {
    id: 'custom',
    name: 'Custom',
    colors: {
      bg: customTheme.bg,
      text: customTheme.text,
      sub: customTheme.sub,
      main: customTheme.main,
      error: customTheme.error,
    },
  } : {
    id: 'custom',
    name: 'Custom',
    colors: {
      bg: '#323437',
      text: '#d1d0c5',
      sub: '#646669',
      main: '#e2b714',
      error: '#ca4754',
    },
  };

  // Get current theme info
  const getCurrentThemeInfo = () => {
    if (currentTheme === 'custom') {
      return customThemePreview;
    }
    return themes.find((t) => t.id === currentTheme);
  };

  const currentThemeInfo = getCurrentThemeInfo();

  return (
    <div className={`${className}`.trim()}>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
        {/* Preset themes */}
        {themes.map((theme) => {
          const isActive = currentTheme === theme.id;

          return (
            <button
              key={theme.id}
              onClick={() => handleThemeSelect(theme.id)}
              className={cn(
                'group relative flex flex-col rounded-lg overflow-hidden',
                'border-2 transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                isActive
                  ? 'border-main ring-2 ring-main/30'
                  : 'border-sub/30 hover:border-sub'
              )}
              title={theme.name}
            >
              {/* Theme Preview */}
              <div
                className="relative w-full aspect-[4/3] p-2"
                style={{ backgroundColor: theme.colors.bg }}
              >
                {/* Preview Text Elements */}
                <div className="flex flex-col gap-1">
                  {/* Main text preview */}
                  <div
                    className="h-1.5 w-3/4 rounded-sm"
                    style={{ backgroundColor: theme.colors.text }}
                  />
                  <div
                    className="h-1.5 w-1/2 rounded-sm"
                    style={{ backgroundColor: theme.colors.sub }}
                  />
                  {/* Accent color preview */}
                  <div className="flex gap-1 mt-1">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.colors.main }}
                    />
                    <div
                      className="h-1.5 w-1/3 rounded-sm self-center"
                      style={{ backgroundColor: theme.colors.main }}
                    />
                  </div>
                  {/* Error color preview */}
                  <div
                    className="h-1 w-1/4 rounded-sm"
                    style={{ backgroundColor: theme.colors.error }}
                  />
                </div>

                {/* Active Indicator */}
                {isActive && (
                  <div className="absolute top-1 right-1 bg-main rounded-full p-0.5">
                    <Check className="h-3 w-3 text-bg" />
                  </div>
                )}
              </div>

              {/* Theme Name */}
              <div
                className="px-2 py-1.5 text-center"
                style={{ backgroundColor: theme.colors.bg }}
              >
                <span
                  className="text-xs font-medium truncate block"
                  style={{ color: theme.colors.text }}
                >
                  {theme.name}
                </span>
              </div>
            </button>
          );
        })}

        {/* Custom Theme Button */}
        <button
          onClick={() => {
            handleThemeSelect('custom');
            setShowCustomBuilder(true);
          }}
          className={cn(
            'group relative flex flex-col rounded-lg overflow-hidden',
            'border-2 transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
            currentTheme === 'custom'
              ? 'border-main ring-2 ring-main/30'
              : 'border-sub/30 hover:border-sub border-dashed'
          )}
          title="Custom Theme"
        >
          {/* Custom Theme Preview */}
          <div
            className="relative w-full aspect-[4/3] p-2 flex items-center justify-center"
            style={{ backgroundColor: customThemePreview.colors.bg }}
          >
            <Palette
              className="w-6 h-6"
              style={{ color: customThemePreview.colors.main }}
            />
            {/* Active Indicator */}
            {currentTheme === 'custom' && (
              <div className="absolute top-1 right-1 bg-main rounded-full p-0.5">
                <Check className="h-3 w-3 text-bg" />
              </div>
            )}
          </div>

          {/* Theme Name */}
          <div
            className="px-2 py-1.5 text-center"
            style={{ backgroundColor: customThemePreview.colors.bg }}
          >
            <span
              className="text-xs font-medium truncate block"
              style={{ color: customThemePreview.colors.text }}
            >
              Custom
            </span>
          </div>
        </button>
      </div>

      {/* Current Theme Info */}
      <div className="mt-4 p-3 rounded-lg bg-sub-alt/50 border border-sub/20">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-sub text-sm">Current theme:</span>
            <span className="ml-2 text-text font-medium">
              {currentThemeInfo?.name || currentTheme}
            </span>
          </div>
          <div className="flex gap-2">
            {currentThemeInfo?.colors &&
              Object.entries(currentThemeInfo.colors).map(([key, color]) => (
                <div
                  key={key}
                  className="w-4 h-4 rounded-full border border-sub/30"
                  style={{ backgroundColor: color }}
                  title={key}
                />
              ))}
          </div>
        </div>
      </div>

      {/* Custom Theme Builder Toggle */}
      <div className="mt-4">
        <button
          onClick={() => setShowCustomBuilder(!showCustomBuilder)}
          className={cn(
            'w-full flex items-center justify-between',
            'px-4 py-3 rounded-lg',
            'bg-sub-alt/30 border border-sub/20',
            'hover:border-sub transition-colors',
            'text-left'
          )}
        >
          <div className="flex items-center gap-3">
            <Palette className="w-5 h-5 text-main" />
            <div>
              <div className="text-text font-medium">Custom Theme Builder</div>
              <div className="text-sub text-sm">Create your own personalized theme</div>
            </div>
          </div>
          {showCustomBuilder ? (
            <ChevronUp className="w-5 h-5 text-sub" />
          ) : (
            <ChevronDown className="w-5 h-5 text-sub" />
          )}
        </button>

        {/* Custom Theme Builder Panel */}
        {showCustomBuilder && (
          <div className="mt-4 p-4 rounded-lg bg-sub-alt/20 border border-sub/20 animate-fade-in">
            <CustomThemeBuilder />
          </div>
        )}
      </div>
    </div>
  );
});

export default ThemeSelector;
