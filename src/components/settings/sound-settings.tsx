'use client';

import { memo, useCallback } from 'react';
import { useConfigStore, type ClickSound, type ErrorSound, type SoundVolume } from '@/store/config-store';
import { cn } from '@/lib/utils/cn';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX, Play } from 'lucide-react';

interface ClickSoundOption {
  id: ClickSound;
  name: string;
  description: string;
}

const clickSoundOptions: ClickSoundOption[] = [
  { id: 'off', name: 'Off', description: 'No click sound' },
  { id: 'click', name: 'Click', description: 'Soft click sound' },
  { id: 'beep', name: 'Beep', description: 'Electronic beep' },
  { id: 'pop', name: 'Pop', description: 'Bubble pop sound' },
  { id: 'nk_cream', name: 'NK Cream', description: 'Mechanical keyboard' },
  { id: 'typewriter', name: 'Typewriter', description: 'Classic typewriter' },
];

interface ErrorSoundOption {
  id: ErrorSound;
  name: string;
  description: string;
}

const errorSoundOptions: ErrorSoundOption[] = [
  { id: 'off', name: 'Off', description: 'No error sound' },
  { id: 'beep', name: 'Beep', description: 'Error beep' },
  { id: 'damage', name: 'Damage', description: 'Game damage sound' },
];

interface SoundSettingsProps {
  /** Additional class names */
  className?: string;
}

export const SoundSettings = memo(function SoundSettings({
  className = '',
}: SoundSettingsProps) {
  const {
    sound,
    setVolume,
    setClickSound,
    setErrorSound,
    toggleSoundOnClick,
    toggleSoundOnError,
  } = useConfigStore();

  const volumePercent = sound.volume * 100;

  const handleVolumeChange = useCallback(
    (value: number[]) => {
      const newVolume = value[0] / 100;
      // Round to nearest valid SoundVolume value
      const validVolumes: SoundVolume[] = [0, 0.25, 0.5, 0.75, 1];
      const closest = validVolumes.reduce((prev, curr) => {
        return Math.abs(curr - newVolume) < Math.abs(prev - newVolume)
          ? curr
          : prev;
      });
      setVolume(closest);
    },
    [setVolume]
  );

  const handleClickSoundSelect = (soundId: ClickSound) => {
    setClickSound(soundId);
    if (soundId !== 'off' && !sound.soundOnClick) {
      toggleSoundOnClick();
    }
  };

  const handleErrorSoundSelect = (soundId: ErrorSound) => {
    setErrorSound(soundId);
    if (soundId !== 'off' && !sound.soundOnError) {
      toggleSoundOnError();
    }
  };

  const playTestSound = (type: 'click' | 'error') => {
    // Play the actual sound for testing
    const soundId = type === 'click' ? sound.clickSound : sound.errorSound;
    if (soundId === 'off') return;

    try {
      const audio = new Audio(`/sounds/${type}/${soundId}.mp3`);
      audio.volume = sound.volume;

      // Handle load errors gracefully
      audio.onerror = () => {
        console.warn(`[SoundSettings] Test sound not available: /sounds/${type}/${soundId}.mp3`);
        // Silently fail - sound file doesn't exist
      };

      audio.play().catch((error) => {
        // Ignore autoplay errors or missing file errors
        if (error.name !== 'NotAllowedError') {
          console.warn(`[SoundSettings] Could not play test sound: ${error.message}`);
        }
      });
    } catch (error) {
      // Silently handle any errors creating the Audio element
      console.warn('[SoundSettings] Error creating audio element:', error);
    }
  };

  const isMuted = sound.volume === 0;

  return (
    <div className={`space-y-6 ${className}`.trim()}>
      {/* Master Volume */}
      <div className="p-4 rounded-lg bg-sub-alt/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {isMuted ? (
              <VolumeX className="h-5 w-5 text-sub" />
            ) : (
              <Volume2 className="h-5 w-5 text-main" />
            )}
            <div>
              <h4 className="text-text font-medium">Master Volume</h4>
              <p className="text-sub text-sm">Control overall sound volume</p>
            </div>
          </div>
          <span className="text-main font-mono text-sm">
            {Math.round(volumePercent)}%
          </span>
        </div>
        <Slider
          value={[volumePercent]}
          onValueChange={handleVolumeChange}
          min={0}
          max={100}
          step={25}
        />
        <div className="flex justify-between mt-2 text-xs text-sub">
          <span>Mute</span>
          <span>25%</span>
          <span>50%</span>
          <span>75%</span>
          <span>100%</span>
        </div>
      </div>

      {/* Click Sound Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-text">Click Sound</h4>
          <Switch
            checked={sound.soundOnClick}
            onCheckedChange={toggleSoundOnClick}
            disabled={sound.clickSound === 'off'}
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {clickSoundOptions.map((option) => {
            const isActive = sound.clickSound === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleClickSoundSelect(option.id)}
                className={cn(
                  'group relative flex flex-col items-start',
                  'px-3 py-2 rounded-lg',
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
                <span className="text-xs text-sub truncate w-full">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Test Click Sound Button */}
        {sound.clickSound !== 'off' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playTestSound('click')}
            className="mt-3 text-sub hover:text-main"
          >
            <Play className="h-4 w-4 mr-2" />
            Test Click Sound
          </Button>
        )}
      </div>

      {/* Error Sound Selection */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-text">Error Sound</h4>
          <Switch
            checked={sound.soundOnError}
            onCheckedChange={toggleSoundOnError}
            disabled={sound.errorSound === 'off'}
          />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {errorSoundOptions.map((option) => {
            const isActive = sound.errorSound === option.id;
            return (
              <button
                key={option.id}
                onClick={() => handleErrorSoundSelect(option.id)}
                className={cn(
                  'group relative flex flex-col items-start',
                  'px-3 py-2 rounded-lg',
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
                <span className="text-xs text-sub truncate w-full">
                  {option.description}
                </span>
              </button>
            );
          })}
        </div>

        {/* Test Error Sound Button */}
        {sound.errorSound !== 'off' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => playTestSound('error')}
            className="mt-3 text-sub hover:text-main"
          >
            <Play className="h-4 w-4 mr-2" />
            Test Error Sound
          </Button>
        )}
      </div>

      {/* Current Settings Summary */}
      <div className="p-3 rounded-lg bg-sub-alt/50 border border-sub/20">
        <div className="flex flex-wrap gap-4 text-sm">
          <div>
            <span className="text-sub">Volume:</span>
            <span className="ml-2 text-text">{Math.round(volumePercent)}%</span>
          </div>
          <div>
            <span className="text-sub">Click:</span>
            <span className="ml-2 text-text">
              {clickSoundOptions.find((s) => s.id === sound.clickSound)?.name}
            </span>
          </div>
          <div>
            <span className="text-sub">Error:</span>
            <span className="ml-2 text-text">
              {errorSoundOptions.find((s) => s.id === sound.errorSound)?.name}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

export default SoundSettings;
