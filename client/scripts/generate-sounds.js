// Script to generate simple sound effects as WAV files
// Run with: node scripts/generate-sounds.js

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// WAV file generation helpers
function createWavHeader(dataLength, sampleRate = 44100, channels = 1, bitsPerSample = 16) {
  const buffer = Buffer.alloc(44);
  const byteRate = sampleRate * channels * (bitsPerSample / 8);
  const blockAlign = channels * (bitsPerSample / 8);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write('WAVE', 8);

  // fmt subchunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (PCM)
  buffer.writeUInt16LE(channels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data subchunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataLength, 40);

  return buffer;
}

function generateTone(frequency, duration, sampleRate = 44100, envelope = 'decay') {
  const numSamples = Math.floor(sampleRate * duration);
  const samples = new Int16Array(numSamples);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;

    // Generate sine wave
    let sample = Math.sin(2 * Math.PI * frequency * t);

    // Apply envelope
    let env = 1;
    if (envelope === 'decay') {
      // Exponential decay
      env = Math.exp(-3 * t / duration);
    } else if (envelope === 'adsr') {
      // Simple ADSR
      const attack = 0.05;
      const decay = 0.1;
      const sustain = 0.7;
      const release = duration - attack - decay - 0.1;

      if (t < attack) {
        env = t / attack;
      } else if (t < attack + decay) {
        env = 1 - (1 - sustain) * ((t - attack) / decay);
      } else if (t < duration - 0.1) {
        env = sustain;
      } else {
        env = sustain * (duration - t) / 0.1;
      }
    }

    sample *= env;

    // Convert to 16-bit integer
    samples[i] = Math.floor(sample * 32767 * 0.8);
  }

  return samples;
}

function mixSamples(samplesArray) {
  const maxLength = Math.max(...samplesArray.map(s => s.length));
  const mixed = new Int16Array(maxLength);

  for (let i = 0; i < maxLength; i++) {
    let sum = 0;
    let count = 0;
    for (const samples of samplesArray) {
      if (i < samples.length) {
        sum += samples[i];
        count++;
      }
    }
    // Average and clip
    mixed[i] = Math.max(-32768, Math.min(32767, Math.floor(sum / count)));
  }

  return mixed;
}

function offsetSamples(samples, offsetSamples, totalLength) {
  const result = new Int16Array(totalLength);
  for (let i = 0; i < samples.length && i + offsetSamples < totalLength; i++) {
    result[i + offsetSamples] = samples[i];
  }
  return result;
}

function samplesToBuffer(samples) {
  const buffer = Buffer.alloc(samples.length * 2);
  for (let i = 0; i < samples.length; i++) {
    buffer.writeInt16LE(samples[i], i * 2);
  }
  return buffer;
}

function saveWav(filename, samples, sampleRate = 44100) {
  const dataBuffer = samplesToBuffer(samples);
  const header = createWavHeader(dataBuffer.length, sampleRate);
  const wav = Buffer.concat([header, dataBuffer]);
  writeFileSync(filename, wav);
  console.log(`Created: ${filename} (${wav.length} bytes)`);
}

// Generate check-in sound: gentle ascending ding
function generateCheckInSound() {
  const sampleRate = 44100;
  const duration = 0.4;

  // Two-note ascending chime (C5 to E5)
  const note1 = generateTone(523.25, duration, sampleRate, 'decay'); // C5
  const note2 = generateTone(659.25, duration, sampleRate, 'decay'); // E5

  // Offset second note slightly
  const totalSamples = Math.floor(sampleRate * (duration + 0.05));
  const note1Full = offsetSamples(note1, 0, totalSamples);
  const note2Full = offsetSamples(note2, Math.floor(sampleRate * 0.05), totalSamples);

  // Mix with note2 slightly quieter
  const mixed = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const val = note1Full[i] * 0.6 + note2Full[i] * 0.5;
    mixed[i] = Math.max(-32768, Math.min(32767, Math.floor(val)));
  }

  return mixed;
}

// Generate milestone sound: celebratory ascending arpeggio
function generateMilestoneSound() {
  const sampleRate = 44100;
  const noteDuration = 0.25;
  const totalDuration = 0.8;

  // C major arpeggio: C5, E5, G5, C6
  const frequencies = [523.25, 659.25, 783.99, 1046.50];
  const notes = frequencies.map((freq, i) => {
    const note = generateTone(freq, noteDuration, sampleRate, 'decay');
    return offsetSamples(note, Math.floor(sampleRate * i * 0.12), Math.floor(sampleRate * totalDuration));
  });

  // Mix all notes
  const mixed = new Int16Array(Math.floor(sampleRate * totalDuration));
  for (let i = 0; i < mixed.length; i++) {
    let sum = 0;
    for (const note of notes) {
      sum += note[i] || 0;
    }
    mixed[i] = Math.max(-32768, Math.min(32767, Math.floor(sum * 0.4)));
  }

  return mixed;
}

// Generate click sound: subtle soft click
function generateClickSound() {
  const sampleRate = 44100;
  const duration = 0.08;

  // Very short high-frequency click with fast decay
  const note = generateTone(1200, duration, sampleRate, 'decay');

  // Apply even faster decay for click feel
  const samples = new Int16Array(note.length);
  for (let i = 0; i < note.length; i++) {
    const t = i / sampleRate;
    const fastDecay = Math.exp(-20 * t);
    samples[i] = Math.floor(note[i] * fastDecay * 0.5);
  }

  return samples;
}

// Generate error sound: low descending tone
function generateErrorSound() {
  const sampleRate = 44100;
  const duration = 0.35;

  // Two descending notes (E4 to C4)
  const note1 = generateTone(329.63, duration * 0.6, sampleRate, 'decay'); // E4
  const note2 = generateTone(261.63, duration * 0.6, sampleRate, 'decay'); // C4

  const totalSamples = Math.floor(sampleRate * duration);
  const note1Full = offsetSamples(note1, 0, totalSamples);
  const note2Full = offsetSamples(note2, Math.floor(sampleRate * 0.12), totalSamples);

  // Mix
  const mixed = new Int16Array(totalSamples);
  for (let i = 0; i < totalSamples; i++) {
    const val = note1Full[i] * 0.5 + note2Full[i] * 0.5;
    mixed[i] = Math.max(-32768, Math.min(32767, Math.floor(val)));
  }

  return mixed;
}

// Generate success sound: bright confirmation tone
function generateSuccessSound() {
  const sampleRate = 44100;
  const duration = 0.25;

  // Single bright chord (C major)
  const c5 = generateTone(523.25, duration, sampleRate, 'decay');
  const e5 = generateTone(659.25, duration, sampleRate, 'decay');
  const g5 = generateTone(783.99, duration, sampleRate, 'decay');

  // Mix chord
  const mixed = new Int16Array(c5.length);
  for (let i = 0; i < c5.length; i++) {
    const val = c5[i] * 0.4 + e5[i] * 0.35 + g5[i] * 0.35;
    mixed[i] = Math.max(-32768, Math.min(32767, Math.floor(val)));
  }

  return mixed;
}

// Main
const soundsDir = join(__dirname, '..', 'public', 'sounds');
if (!existsSync(soundsDir)) {
  mkdirSync(soundsDir, { recursive: true });
}

console.log('Generating sound effects...\n');

const checkInSamples = generateCheckInSound();
saveWav(join(soundsDir, 'checkin.wav'), checkInSamples);

const milestoneSamples = generateMilestoneSound();
saveWav(join(soundsDir, 'milestone.wav'), milestoneSamples);

const clickSamples = generateClickSound();
saveWav(join(soundsDir, 'click.wav'), clickSamples);

const errorSamples = generateErrorSound();
saveWav(join(soundsDir, 'error.wav'), errorSamples);

const successSamples = generateSuccessSound();
saveWav(join(soundsDir, 'success.wav'), successSamples);

console.log('\nDone! Sound files created in public/sounds/');
console.log('\nNote: Files are WAV format.');
