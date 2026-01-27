#!/usr/bin/env node

/**
 * Generate WAV sound files for Gorilla Type typing test app.
 *
 * Creates simple synthesized sounds using raw PCM data written
 * directly as WAV files. No external dependencies needed.
 *
 * Output directory: public/sounds/
 */

const fs = require('fs'); // eslint-disable-line @typescript-eslint/no-require-imports
const path = require('path'); // eslint-disable-line @typescript-eslint/no-require-imports

const SAMPLE_RATE = 44100;
const NUM_CHANNELS = 1;
const BITS_PER_SAMPLE = 16;
const MAX_AMPLITUDE = 32767;

const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'sounds');

/**
 * Create a WAV file buffer from PCM sample data (Int16 array).
 */
function createWavBuffer(samples) {
  const dataLength = samples.length * 2; // 16-bit = 2 bytes per sample
  const headerLength = 44;
  const fileLength = headerLength + dataLength;

  const buffer = Buffer.alloc(fileLength);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(fileLength - 8, 4);        // File size minus RIFF header
  buffer.write('WAVE', 8);

  // fmt sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);                    // Sub-chunk size (16 for PCM)
  buffer.writeUInt16LE(1, 20);                     // Audio format (1 = PCM)
  buffer.writeUInt16LE(NUM_CHANNELS, 22);          // Number of channels
  buffer.writeUInt32LE(SAMPLE_RATE, 24);           // Sample rate
  buffer.writeUInt32LE(SAMPLE_RATE * NUM_CHANNELS * BITS_PER_SAMPLE / 8, 28); // Byte rate
  buffer.writeUInt16LE(NUM_CHANNELS * BITS_PER_SAMPLE / 8, 32);               // Block align
  buffer.writeUInt16LE(BITS_PER_SAMPLE, 34);       // Bits per sample

  // data sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  // Write PCM samples
  for (let i = 0; i < samples.length; i++) {
    const clamped = Math.max(-MAX_AMPLITUDE, Math.min(MAX_AMPLITUDE, Math.round(samples[i])));
    buffer.writeInt16LE(clamped, headerLength + i * 2);
  }

  return buffer;
}

/**
 * Generate samples for a given duration in seconds.
 */
function numSamples(durationMs) {
  return Math.floor(SAMPLE_RATE * durationMs / 1000);
}

/**
 * Apply an exponential decay envelope to samples.
 */
function applyDecay(samples, decayRate = 5) {
  const len = samples.length;
  for (let i = 0; i < len; i++) {
    const t = i / len;
    samples[i] *= Math.exp(-decayRate * t);
  }
  return samples;
}

/**
 * Apply a linear fade-out to avoid clicks at the end.
 */
function applyFadeOut(samples, fadeSamples = 100) {
  const len = samples.length;
  const start = Math.max(0, len - fadeSamples);
  for (let i = start; i < len; i++) {
    const fade = (len - i) / fadeSamples;
    samples[i] *= fade;
  }
  return samples;
}

// ============================================================
// Sound generators
// ============================================================

/**
 * click.wav - Simple short click (50ms, 800Hz square wave with fast decay)
 */
function generateClick() {
  const duration = 50;
  const freq = 800;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // Square wave
    const phase = (t * freq) % 1;
    samples[i] = (phase < 0.5 ? 1 : -1) * MAX_AMPLITUDE * 0.4;
  }

  applyDecay(samples, 8);
  applyFadeOut(samples);
  return samples;
}

/**
 * beep.wav - Short beep (40ms, 1000Hz sine wave)
 */
function generateBeep() {
  const duration = 40;
  const freq = 1000;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * MAX_AMPLITUDE * 0.5;
  }

  applyDecay(samples, 6);
  applyFadeOut(samples);
  return samples;
}

/**
 * pop.wav - Pop sound (30ms, 600Hz with pitch drop)
 */
function generatePop() {
  const duration = 30;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    // Pitch drops from 600Hz to 200Hz
    const freq = 600 - 400 * progress;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * MAX_AMPLITUDE * 0.5;
  }

  applyDecay(samples, 10);
  applyFadeOut(samples);
  return samples;
}

/**
 * nk-cream.wav - Mechanical keyboard click (60ms, 400Hz + 1200Hz harmonics)
 */
function generateNkCream() {
  const duration = 60;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // Fundamental + harmonic for richer mechanical sound
    const fundamental = Math.sin(2 * Math.PI * 400 * t) * 0.5;
    const harmonic1 = Math.sin(2 * Math.PI * 1200 * t) * 0.25;
    const harmonic2 = Math.sin(2 * Math.PI * 2400 * t) * 0.1;
    // Add a small noise burst at the start for the "thock" feel
    const noise = (i < numSamples(5)) ? (Math.random() * 2 - 1) * 0.3 : 0;
    samples[i] = (fundamental + harmonic1 + harmonic2 + noise) * MAX_AMPLITUDE * 0.45;
  }

  applyDecay(samples, 7);
  applyFadeOut(samples);
  return samples;
}

/**
 * typewriter.wav - Typewriter clack (80ms, 300Hz with noise burst)
 */
function generateTypewriter() {
  const duration = 80;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    // Low tone base
    const tone = Math.sin(2 * Math.PI * 300 * t) * 0.3;
    // Noise burst (louder at start, fading quickly)
    const noiseEnv = Math.exp(-15 * progress);
    const noise = (Math.random() * 2 - 1) * noiseEnv * 0.6;
    // Click transient at the very start
    const transient = (i < numSamples(3)) ? (Math.random() * 2 - 1) * 0.8 : 0;
    samples[i] = (tone + noise + transient) * MAX_AMPLITUDE * 0.45;
  }

  applyDecay(samples, 5);
  applyFadeOut(samples);
  return samples;
}

/**
 * error-beep.wav - Error beep (100ms, 440Hz descending)
 */
function generateErrorBeep() {
  const duration = 100;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    const progress = i / n;
    // Descend from 440Hz to 220Hz
    const freq = 440 - 220 * progress;
    samples[i] = Math.sin(2 * Math.PI * freq * t) * MAX_AMPLITUDE * 0.5;
  }

  applyDecay(samples, 4);
  applyFadeOut(samples);
  return samples;
}

/**
 * error-damage.wav - Damage sound (150ms, 200Hz buzz)
 */
function generateErrorDamage() {
  const duration = 150;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    const t = i / SAMPLE_RATE;
    // Buzz: combination of low frequency + distortion
    const base = Math.sin(2 * Math.PI * 200 * t);
    const distorted = Math.sin(2 * Math.PI * 200 * t * 3) * 0.3;
    const noise = (Math.random() * 2 - 1) * 0.15;
    // Clipping for harsh buzz effect
    let sample = (base * 0.6 + distorted + noise);
    sample = Math.max(-0.8, Math.min(0.8, sample));
    samples[i] = sample * MAX_AMPLITUDE * 0.5;
  }

  applyDecay(samples, 3);
  applyFadeOut(samples);
  return samples;
}

/**
 * complete.wav - Pleasant completion chime (300ms, C-E-G chord arpeggio)
 */
function generateComplete() {
  const duration = 400;
  const n = numSamples(duration);
  const samples = new Float64Array(n);

  // C4=261.63, E4=329.63, G4=392.00, C5=523.25
  const notes = [
    { freq: 523.25, start: 0,   dur: 300 },   // C5
    { freq: 659.25, start: 80,  dur: 250 },   // E5
    { freq: 783.99, start: 160, dur: 200 },   // G5
    { freq: 1046.50, start: 240, dur: 160 },  // C6
  ];

  for (let i = 0; i < n; i++) {
    const tMs = (i / SAMPLE_RATE) * 1000;
    let val = 0;

    for (const note of notes) {
      if (tMs >= note.start && tMs < note.start + note.dur) {
        const noteT = (tMs - note.start) / note.dur;
        const env = Math.exp(-3 * noteT); // Decay envelope per note
        const t = i / SAMPLE_RATE;
        val += Math.sin(2 * Math.PI * note.freq * t) * env * 0.3;
      }
    }

    samples[i] = val * MAX_AMPLITUDE;
  }

  applyFadeOut(samples, 200);
  return samples;
}

// ============================================================
// Main: Generate and write all sound files
// ============================================================

function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const sounds = [
    { name: 'click.wav',        generator: generateClick,       desc: 'Simple short click' },
    { name: 'beep.wav',         generator: generateBeep,        desc: 'Short beep' },
    { name: 'pop.wav',          generator: generatePop,         desc: 'Pop sound' },
    { name: 'nk-cream.wav',     generator: generateNkCream,     desc: 'Mechanical keyboard click' },
    { name: 'typewriter.wav',   generator: generateTypewriter,  desc: 'Typewriter clack' },
    { name: 'error-beep.wav',   generator: generateErrorBeep,   desc: 'Error beep' },
    { name: 'error-damage.wav', generator: generateErrorDamage, desc: 'Damage sound' },
    { name: 'complete.wav',     generator: generateComplete,    desc: 'Completion chime' },
  ];

  console.log(`Generating ${sounds.length} sound files in ${OUTPUT_DIR}\n`);

  for (const sound of sounds) {
    const samples = sound.generator();
    const wav = createWavBuffer(samples);
    const filePath = path.join(OUTPUT_DIR, sound.name);
    fs.writeFileSync(filePath, wav);
    const sizeKB = (wav.length / 1024).toFixed(1);
    console.log(`  [OK] ${sound.name.padEnd(20)} ${sizeKB.padStart(6)} KB  - ${sound.desc}`);
  }

  console.log('\nAll sound files generated successfully!');
}

main();
