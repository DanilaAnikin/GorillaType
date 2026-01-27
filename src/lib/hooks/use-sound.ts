'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { useConfigStore, type ClickSound, type ErrorSound } from '@/store/config-store';

// Sound manifest mapping sound IDs to file paths
const SOUND_MANIFEST = {
  click: {
    click: '/sounds/click/click.mp3',
    beep: '/sounds/click/beep.mp3',
    pop: '/sounds/click/pop.mp3',
    nk_cream: '/sounds/click/nk_cream.mp3',
    typewriter: '/sounds/click/typewriter.mp3',
  },
  error: {
    beep: '/sounds/error/beep.mp3',
    damage: '/sounds/error/damage.mp3',
  },
} as const;

// Type definitions
type ClickSoundId = Exclude<ClickSound, 'off'>;
type ErrorSoundId = Exclude<ErrorSound, 'off'>;

export interface UseSoundOptions {
  /** Volume level from 0 to 1 */
  volume?: number;
  /** Whether sounds are enabled */
  enabled?: boolean;
  /** Base path for sound files */
  basePath?: string;
}

export interface UseSoundReturn {
  /** Play the selected click sound */
  playClick: () => void;
  /** Play the selected error sound */
  playError: () => void;
  /** Set the volume for all sounds */
  setVolume: (volume: number) => void;
  /** Enable or disable sounds */
  setEnabled: (enabled: boolean) => void;
  /** Preload all sound files */
  preloadSounds: () => void;
  /** Check if sounds are ready to play */
  isReady: boolean;
  /** Check if any sounds are available */
  hasSounds: boolean;
}

// Cache for Howl instances - shared across hook instances
const soundCache = new Map<string, Howl>();

// Track which sounds failed to load
const failedSounds = new Set<string>();

// Callbacks to notify when a sound fails to load
const failureCallbacks = new Set<(path: string) => void>();

/**
 * Check if a specific sound is available (not failed)
 */
export function isSoundAvailable(path: string): boolean {
  return !failedSounds.has(path);
}

/**
 * Check if any sounds have failed to load
 */
export function hasFailedSounds(): boolean {
  return failedSounds.size > 0;
}

/**
 * Get the set of failed sound paths
 */
export function getFailedSounds(): ReadonlySet<string> {
  return failedSounds;
}

/**
 * Get or create a Howl instance for a sound
 */
function getOrCreateHowl(path: string, volume: number, onFailure?: (path: string) => void): Howl | null {
  // Don't attempt to load sounds that already failed
  if (failedSounds.has(path)) {
    return null;
  }

  // Return cached instance if available
  if (soundCache.has(path)) {
    const howl = soundCache.get(path)!;
    howl.volume(volume);
    return howl;
  }

  // Create new Howl instance
  try {
    const howl = new Howl({
      src: [path],
      volume,
      preload: true,
      html5: false, // Use Web Audio API for lower latency
      onloaderror: (_id, error) => {
        console.warn(`[useSound] Failed to load sound file: ${path}. The app will continue without this sound.`, error);
        failedSounds.add(path);
        soundCache.delete(path);
        // Notify all registered callbacks
        failureCallbacks.forEach(cb => cb(path));
        if (onFailure) onFailure(path);
      },
    });

    soundCache.set(path, howl);
    return howl;
  } catch (error) {
    console.warn(`[useSound] Error creating sound instance for: ${path}. The app will continue without this sound.`, error);
    failedSounds.add(path);
    if (onFailure) onFailure(path);
    return null;
  }
}

/**
 * Preload a specific sound file
 */
function preloadSound(path: string, volume: number = 0.5): void {
  getOrCreateHowl(path, volume);
}

/**
 * Play a sound with the given path and volume
 */
function playSound(path: string, volume: number): void {
  const howl = getOrCreateHowl(path, volume);
  if (howl) {
    try {
      howl.play();
    } catch (error) {
      console.warn(`Error playing sound: ${path}`, error);
    }
  }
}

/**
 * Hook for playing typing sounds with Howler.js
 *
 * Integrates with the config store for sound settings.
 * Lazy-loads sounds when first needed and caches them.
 */
export function useSound(options: UseSoundOptions = {}): UseSoundReturn {
  const {
    volume: optionVolume,
    enabled: optionEnabled,
  } = options;

  // Get sound settings from config store
  const soundSettings = useConfigStore((state) => state.sound);

  // Use options if provided, otherwise fall back to store settings
  const volume = optionVolume ?? soundSettings.volume;
  const clickSoundEnabled = optionEnabled ?? soundSettings.soundOnClick;
  const errorSoundEnabled = optionEnabled ?? soundSettings.soundOnError;
  const clickSound = soundSettings.clickSound;
  const errorSound = soundSettings.errorSound;

  // Track internal state
  const [isReady, setIsReady] = useState(false);
  const [hasSounds, setHasSounds] = useState(!hasFailedSounds());

  // Refs to track current settings without causing re-renders
  const volumeRef = useRef(volume);
  const clickSoundEnabledRef = useRef(clickSoundEnabled);
  const errorSoundEnabledRef = useRef(errorSoundEnabled);
  const clickSoundRef = useRef(clickSound);
  const errorSoundRef = useRef(errorSound);

  // Update refs when settings change
  useEffect(() => {
    volumeRef.current = volume;
    clickSoundEnabledRef.current = clickSoundEnabled;
    errorSoundEnabledRef.current = errorSoundEnabled;
    clickSoundRef.current = clickSound;
    errorSoundRef.current = errorSound;
  }, [volume, clickSoundEnabled, errorSoundEnabled, clickSound, errorSound]);

  // Register for sound failure notifications
  useEffect(() => {
    const handleSoundFailure = (path: string) => {
      console.warn(`[useSound] Sound unavailable: ${path}`);
      // Check if any sounds are still available
      const allClickSoundsFailed = Object.values(SOUND_MANIFEST.click).every(p => failedSounds.has(p));
      const allErrorSoundsFailed = Object.values(SOUND_MANIFEST.error).every(p => failedSounds.has(p));
      if (allClickSoundsFailed && allErrorSoundsFailed) {
        setHasSounds(false);
      }
    };

    failureCallbacks.add(handleSoundFailure);
    return () => {
      failureCallbacks.delete(handleSoundFailure);
    };
  }, []);

  // Preload the currently selected sounds
  useEffect(() => {
    if (clickSound !== 'off') {
      const path = SOUND_MANIFEST.click[clickSound as ClickSoundId];
      if (path && !failedSounds.has(path)) {
        preloadSound(path, volume);
      }
    }

    if (errorSound !== 'off') {
      const path = SOUND_MANIFEST.error[errorSound as ErrorSoundId];
      if (path && !failedSounds.has(path)) {
        preloadSound(path, volume);
      }
    }

    setIsReady(true);
  }, [clickSound, errorSound, volume]);

  // Update volume on all cached sounds
  useEffect(() => {
    soundCache.forEach((howl) => {
      howl.volume(volume);
    });
  }, [volume]);

  /**
   * Play the currently selected click sound
   * Silently does nothing if the sound is unavailable or disabled
   */
  const playClick = useCallback(() => {
    const currentClickSound = clickSoundRef.current;
    const enabled = clickSoundEnabledRef.current;
    const currentVolume = volumeRef.current;

    if (!enabled || currentClickSound === 'off' || currentVolume === 0) {
      return;
    }

    const path = SOUND_MANIFEST.click[currentClickSound as ClickSoundId];
    if (path && !failedSounds.has(path)) {
      playSound(path, currentVolume);
    }
    // Silently do nothing if sound is unavailable
  }, []);

  /**
   * Play the currently selected error sound
   * Silently does nothing if the sound is unavailable or disabled
   */
  const playError = useCallback(() => {
    const currentErrorSound = errorSoundRef.current;
    const enabled = errorSoundEnabledRef.current;
    const currentVolume = volumeRef.current;

    if (!enabled || currentErrorSound === 'off' || currentVolume === 0) {
      return;
    }

    const path = SOUND_MANIFEST.error[currentErrorSound as ErrorSoundId];
    if (path && !failedSounds.has(path)) {
      playSound(path, currentVolume);
    }
    // Silently do nothing if sound is unavailable
  }, []);

  /**
   * Set volume for all sounds (0-1 range)
   */
  const setVolume = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    volumeRef.current = clampedVolume;

    // Update all cached Howl instances
    soundCache.forEach((howl) => {
      howl.volume(clampedVolume);
    });
  }, []);

  /**
   * Enable or disable sounds
   */
  const setEnabled = useCallback((enabled: boolean) => {
    clickSoundEnabledRef.current = enabled;
    errorSoundEnabledRef.current = enabled;
  }, []);

  /**
   * Preload all sound files
   * Skips sounds that have already failed to load
   */
  const preloadSounds = useCallback(() => {
    const currentVolume = volumeRef.current;

    // Preload all click sounds (skip failed ones)
    Object.values(SOUND_MANIFEST.click).forEach((path) => {
      if (!failedSounds.has(path)) {
        preloadSound(path, currentVolume);
      }
    });

    // Preload all error sounds (skip failed ones)
    Object.values(SOUND_MANIFEST.error).forEach((path) => {
      if (!failedSounds.has(path)) {
        preloadSound(path, currentVolume);
      }
    });

    // Only set hasSounds to true if not all sounds have failed
    const allClickSoundsFailed = Object.values(SOUND_MANIFEST.click).every(p => failedSounds.has(p));
    const allErrorSoundsFailed = Object.values(SOUND_MANIFEST.error).every(p => failedSounds.has(p));
    setHasSounds(!(allClickSoundsFailed && allErrorSoundsFailed));
  }, []);

  // Cleanup on unmount - unload sounds that are no longer needed
  useEffect(() => {
    return () => {
      // Note: We don't clear the cache on unmount as sounds may be reused
      // by other components. The cache is managed at the module level.
      // To fully clean up, call Howler.unload() if needed.
    };
  }, []);

  return {
    playClick,
    playError,
    setVolume,
    setEnabled,
    preloadSounds,
    isReady,
    hasSounds,
  };
}

/**
 * Utility function to unload all cached sounds
 * Call this when you want to free up memory
 */
export function unloadAllSounds(): void {
  soundCache.forEach((howl) => {
    howl.unload();
  });
  soundCache.clear();
  failedSounds.clear();
}

/**
 * Get the sound manifest for external use
 */
export function getSoundManifest() {
  return SOUND_MANIFEST;
}

export default useSound;
