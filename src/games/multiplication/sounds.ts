import { sound, type SoundSpec } from '../../platform/audio';

/** All game sound effects, synthesized in code (no audio files). */
const N = { C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 };

const specs = {
  tap: [{ freq: 600, dur: 0.04, wave: 'triangle', gain: 0.08 }],
  tick: [{ freq: 1400, dur: 0.035, wave: 'square', gain: 0.06 }],
  countdown: [{ freq: 660, dur: 0.14, wave: 'triangle', gain: 0.25 }],
  go: [
    { freq: 880, dur: 0.12, wave: 'triangle', gain: 0.25 },
    { freq: 1320, dur: 0.25, wave: 'triangle', gain: 0.25, at: 0.1 },
  ],
  bonk: [
    { freq: 260, slideTo: 110, dur: 0.22, wave: 'triangle', gain: 0.35 },
    { freq: 400, dur: 0.08, wave: 'noise', gain: 0.15 },
  ],
  levelComplete: [N.C5, N.E5, N.G5, N.C6, N.G5, N.C6].map((freq, i) => ({ freq, dur: i === 5 ? 0.5 : 0.14, at: i * 0.12, wave: 'triangle', gain: 0.25 })),
  unlock: [N.G5, N.C6, N.E6, N.G6].map((freq, i) => ({ freq, dur: 0.12, at: i * 0.07, wave: 'sine', gain: 0.2 })),
  step: [{ freq: 300, dur: 0.05, wave: 'noise', gain: 0.12 }],
  punch: [
    { freq: 900, dur: 0.06, wave: 'noise', gain: 0.3 },
    { freq: 180, slideTo: 90, dur: 0.15, wave: 'sine', gain: 0.4 },
  ],
  growl: [{ freq: 140, slideTo: 90, dur: 0.3, wave: 'sawtooth', gain: 0.15 }],
  waveWon: [N.E5, N.G5, N.C6, N.E6].map((freq, i) => ({ freq, dur: 0.16, at: i * 0.1, wave: 'square', gain: 0.12 })),
  waveLost: [N.G5, N.E5, N.C5].map((freq, i) => ({ freq, dur: 0.2, at: i * 0.18, wave: 'triangle', gain: 0.2 })),
  victory: [N.C5, N.C5, N.G5, N.G5, N.A5, N.A5, N.G5, N.F5, N.F5, N.E5, N.E5, N.D5, N.D5, N.C6].map((freq, i) => ({
    freq,
    dur: i === 13 ? 0.6 : 0.16,
    at: i * 0.18,
    wave: 'triangle',
    gain: 0.22,
  })),
  firework: [
    { freq: 200, slideTo: 1200, dur: 0.35, wave: 'sine', gain: 0.08 },
    { freq: 2000, dur: 0.3, at: 0.35, wave: 'noise', gain: 0.2 },
  ],
} satisfies Record<string, SoundSpec>;

export type SoundName = keyof typeof specs | 'ding' | 'star';

/** Plays a named effect. `level` raises pitch (combo for "ding", star index for "star"). */
export function playSound(name: SoundName, level = 0): void {
  if (name === 'ding') {
    const f = N.A5 * Math.pow(2, Math.min(level, 8) / 12);
    sound.play([
      { freq: f, dur: 0.18, wave: 'sine', gain: 0.3 },
      { freq: f * 2, dur: 0.12, wave: 'sine', gain: 0.1 },
      { freq: f * 1.5, dur: 0.2, at: 0.06, wave: 'triangle', gain: 0.12 },
    ]);
    return;
  }
  if (name === 'star') {
    const f = [N.E5, N.G5, N.C6][Math.min(level, 2)];
    sound.play([
      { freq: f, dur: 0.3, wave: 'sine', gain: 0.25 },
      { freq: f * 2, dur: 0.25, at: 0.04, wave: 'sine', gain: 0.1 },
    ]);
    return;
  }
  sound.play(specs[name] as SoundSpec);
}
