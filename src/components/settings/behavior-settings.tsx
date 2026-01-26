'use client';

import { memo } from 'react';
import { useConfigStore } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { Switch } from '@/components/ui/switch';
import {
  AlertCircle,
  Shield,
  EyeOff,
  Zap,
  Unlock,
  Space,
} from 'lucide-react';

type StopOnError = 'off' | 'word' | 'letter';
type ConfidenceMode = 'off' | 'on' | 'max';

interface SettingOption<T> {
  id: T;
  name: string;
  description: string;
}

const stopOnErrorOptions: SettingOption<StopOnError>[] = [
  { id: 'off', name: 'Off', description: 'Continue typing regardless of errors' },
  { id: 'word', name: 'Word', description: 'Stop at word boundary on error' },
  { id: 'letter', name: 'Letter', description: 'Stop immediately on error' },
];

const confidenceModeOptions: SettingOption<ConfidenceMode>[] = [
  { id: 'off', name: 'Off', description: 'Backspace allowed normally' },
  { id: 'on', name: 'On', description: 'No backspace on correct characters' },
  { id: 'max', name: 'Max', description: 'No backspace at all' },
];

interface ToggleSetting {
  key: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  getValue: () => boolean;
  onToggle: () => void;
}

interface BehaviorSettingsProps {
  /** Additional class names */
  className?: string;
}

export const BehaviorSettings = memo(function BehaviorSettings({
  className = '',
}: BehaviorSettingsProps) {
  const {
    behavior,
    setStopOnError,
    setConfidenceMode,
    toggleBlindMode,
    toggleLazyMode,
    toggleFreedomMode,
    toggleStrictSpace,
  } = useConfigStore();

  const toggleSettings: ToggleSetting[] = [
    {
      key: 'blindMode',
      label: 'Blind Mode',
      description: 'Hide all feedback while typing (no error highlighting)',
      icon: EyeOff,
      getValue: () => behavior.blindMode,
      onToggle: toggleBlindMode,
    },
    {
      key: 'lazyMode',
      label: 'Lazy Mode',
      description: 'Ignore accented characters (treat them as base letters)',
      icon: Zap,
      getValue: () => behavior.lazyMode,
      onToggle: toggleLazyMode,
    },
    {
      key: 'freedomMode',
      label: 'Freedom Mode',
      description: 'Allow moving freely to any word at any time',
      icon: Unlock,
      getValue: () => behavior.freedomMode,
      onToggle: toggleFreedomMode,
    },
    {
      key: 'strictSpace',
      label: 'Strict Space',
      description: 'Pressing space at the end of word with errors fails test',
      icon: Space,
      getValue: () => behavior.strictSpace,
      onToggle: toggleStrictSpace,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Stop on Error */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <AlertCircle className="h-4 w-4 text-main" />
          <h4 className="text-sm font-medium text-text">Stop on Error</h4>
        </div>
        <p className="text-sub text-sm mb-3">
          Control how typing errors affect your progress
        </p>
        <div className="flex flex-wrap gap-2">
          {stopOnErrorOptions.map((option) => {
            const isActive = behavior.stopOnError === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setStopOnError(option.id)}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                  isActive
                    ? 'border-main bg-main/10'
                    : 'border-sub/30 hover:border-sub bg-sub-alt/30'
                )}
                title={option.description}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-main' : 'text-text'
                  )}
                >
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-sub">
          {stopOnErrorOptions.find((o) => o.id === behavior.stopOnError)?.description}
        </p>
      </div>

      {/* Confidence Mode */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Shield className="h-4 w-4 text-main" />
          <h4 className="text-sm font-medium text-text">Confidence Mode</h4>
        </div>
        <p className="text-sub text-sm mb-3">
          Restrict backspace usage to build typing confidence
        </p>
        <div className="flex flex-wrap gap-2">
          {confidenceModeOptions.map((option) => {
            const isActive = behavior.confidenceMode === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setConfidenceMode(option.id)}
                className={cn(
                  'px-4 py-2 rounded-lg',
                  'border-2 transition-all duration-200',
                  'focus:outline-none focus:ring-2 focus:ring-main focus:ring-offset-2 focus:ring-offset-bg',
                  isActive
                    ? 'border-main bg-main/10'
                    : 'border-sub/30 hover:border-sub bg-sub-alt/30'
                )}
                title={option.description}
              >
                <span
                  className={cn(
                    'text-sm font-medium',
                    isActive ? 'text-main' : 'text-text'
                  )}
                >
                  {option.name}
                </span>
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs text-sub">
          {confidenceModeOptions.find((o) => o.id === behavior.confidenceMode)?.description}
        </p>
      </div>

      {/* Toggle Settings */}
      <div className="space-y-1">
        <h4 className="text-sm font-medium text-text mb-3">
          Additional Options
        </h4>
        {toggleSettings.map((setting) => {
          const Icon = setting.icon;
          const isActive = setting.getValue();

          return (
            <div
              key={setting.key}
              className={cn(
                'flex items-center justify-between p-4 rounded-lg',
                'transition-colors duration-200',
                isActive ? 'bg-main/10' : 'bg-sub-alt/30'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    'h-5 w-5',
                    isActive ? 'text-main' : 'text-sub'
                  )}
                />
                <div>
                  <h5
                    className={cn(
                      'font-medium',
                      isActive ? 'text-main' : 'text-text'
                    )}
                  >
                    {setting.label}
                  </h5>
                  <p className="text-sub text-sm">{setting.description}</p>
                </div>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setting.onToggle}
              />
            </div>
          );
        })}
      </div>

      {/* Current Settings Summary */}
      <div className="p-3 rounded-lg bg-sub-alt/50 border border-sub/20">
        <h4 className="text-sm font-medium text-text mb-2">
          Active Behavior Settings
        </h4>
        <div className="flex flex-wrap gap-2">
          {behavior.stopOnError !== 'off' && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Stop on {behavior.stopOnError}
            </span>
          )}
          {behavior.confidenceMode !== 'off' && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Confidence: {behavior.confidenceMode}
            </span>
          )}
          {behavior.blindMode && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Blind Mode
            </span>
          )}
          {behavior.lazyMode && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Lazy Mode
            </span>
          )}
          {behavior.freedomMode && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Freedom Mode
            </span>
          )}
          {behavior.strictSpace && (
            <span className="px-2 py-1 rounded text-xs bg-main/20 text-main">
              Strict Space
            </span>
          )}
          {behavior.stopOnError === 'off' &&
            behavior.confidenceMode === 'off' &&
            !behavior.blindMode &&
            !behavior.lazyMode &&
            !behavior.freedomMode &&
            !behavior.strictSpace && (
              <span className="text-xs text-sub">
                All default settings active
              </span>
            )}
        </div>
      </div>
    </div>
  );
});

export default BehaviorSettings;
