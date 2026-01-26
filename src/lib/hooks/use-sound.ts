'use client';

export interface UseSoundOptions {
  /** Volume level from 0 to 1 */
  volume?: number;
  /** Whether sounds are enabled */
  enabled?: boolean;
  /** Base path for sound files */
  basePath?: string;
}

export interface UseSoundReturn {
  /** Play a random click sound */
  playClick: () => void;
  /** Play a random error sound */
  playError: () => void;
  /** Set the volume for all sounds */
  setVolume: (volume: number) => void;
  /** Enable or disable sounds */
  setEnabled: (enabled: boolean) => void;
  /** Check if sounds are ready to play */
  isReady: boolean;
  /** Check if any sounds are available */
  hasSounds: boolean;
}

// No-op functions to prevent any sound file loading (sound files don't exist)
const noop = () => {};

export function useSound(_options: UseSoundOptions = {}): UseSoundReturn {
  // Return dummy functions immediately - no sound files are loaded
  return {
    playClick: noop,
    playError: noop,
    setVolume: noop,
    setEnabled: noop,
    isReady: true,
    hasSounds: false,
  };
}

export default useSound;
