/**
 * Tiny Web Audio synthesizer (ZzFX-style): every sound is generated in code, so there are
 * no audio files and no licensing concerns. Only src/platform touches AudioContext.
 */
export type Wave = OscillatorType | 'noise';

export interface ToneSpec {
  /** Start frequency (Hz). Ignored for noise. */
  freq: number;
  /** Optional end frequency for a pitch slide. */
  slideTo?: number;
  /** Duration in seconds. */
  dur: number;
  /** Delay from the start of the sound, seconds. */
  at?: number;
  wave?: Wave;
  /** Peak gain 0..1. */
  gain?: number;
  /** Attack time in seconds. */
  attack?: number;
}

export type SoundSpec = ToneSpec[];

class SoundEngine {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  enabled = true;

  private ensure(): AudioContext | null {
    if (this.ctx) return this.ctx;
    try {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      this.ctx = new Ctor();
      this.master = this.ctx.createGain();
      this.master.gain.value = 0.5;
      this.master.connect(this.ctx.destination);
    } catch {
      this.ctx = null;
    }
    return this.ctx;
  }

  /**
   * iOS/Safari only allow audio after a user gesture. Call from the first pointer/key event;
   * it creates/resumes the context and plays a silent buffer to unlock output.
   */
  unlock(): void {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    try {
      const src = ctx.createBufferSource();
      src.buffer = ctx.createBuffer(1, 1, 22050);
      src.connect(ctx.destination);
      src.start(0);
    } catch {
      /* ignore */
    }
  }

  play(spec: SoundSpec): void {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx || !this.master) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const tone of spec) this.playTone(ctx, this.master, tone, t0);
  }

  private playTone(ctx: AudioContext, out: AudioNode, tone: ToneSpec, t0: number): void {
    const start = t0 + (tone.at ?? 0);
    const end = start + tone.dur;
    const gain = ctx.createGain();
    const peak = tone.gain ?? 0.3;
    const attack = Math.min(tone.attack ?? 0.005, tone.dur / 2);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + attack);
    gain.gain.exponentialRampToValueAtTime(0.0001, end);
    gain.connect(out);

    let src: AudioScheduledSourceNode;
    if (tone.wave === 'noise') {
      const b = ctx.createBufferSource();
      b.buffer = this.getNoise(ctx);
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = tone.freq || 1200;
      b.connect(filter);
      filter.connect(gain);
      src = b;
    } else {
      const osc = ctx.createOscillator();
      osc.type = tone.wave ?? 'sine';
      osc.frequency.setValueAtTime(tone.freq, start);
      if (tone.slideTo) osc.frequency.exponentialRampToValueAtTime(tone.slideTo, end);
      osc.connect(gain);
      src = osc;
    }
    src.start(start);
    src.stop(end + 0.05);
  }

  private getNoise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuffer) return this.noiseBuffer;
    const len = ctx.sampleRate * 0.5;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuffer = buf;
    return buf;
  }
}

export const sound = new SoundEngine();

/** Installs one-time listeners that unlock audio on the first user gesture (iOS). */
export function installAudioUnlock(): void {
  const handler = () => {
    sound.unlock();
    window.removeEventListener('pointerdown', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('pointerdown', handler, { passive: true });
  window.addEventListener('keydown', handler);
}
