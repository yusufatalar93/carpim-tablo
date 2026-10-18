import confetti from 'canvas-confetti';

let reduced = false;

export function setEffectsReduced(v: boolean): void {
  reduced = v;
}

export function isReducedMotion(): boolean {
  return reduced;
}

/** Small sparkle burst at a screen position (0..1 coordinates). */
export function burst(x = 0.5, y = 0.5, power = 1): void {
  if (reduced) return;
  void confetti({
    particleCount: Math.round(18 * power),
    spread: 50 + 20 * power,
    startVelocity: 18 + 8 * power,
    gravity: 1.1,
    ticks: 70,
    scalar: 0.8,
    origin: { x, y },
    colors: ['#facc15', '#34d399', '#60a5fa', '#f472b6', '#fb923c'],
    disableForReducedMotion: true,
  });
}

/** Big celebration (level passed, final won). */
export function celebrate(durationMs = 1600): void {
  if (reduced) return;
  const end = Date.now() + durationMs;
  const frame = () => {
    void confetti({ particleCount: 4, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, disableForReducedMotion: true });
    void confetti({ particleCount: 4, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, disableForReducedMotion: true });
    if (Date.now() < end) requestAnimationFrame(frame);
  };
  frame();
}

/** Firework-style bursts in the sky. */
export function fireworks(count = 5): void {
  if (reduced) return;
  for (let i = 0; i < count; i++) {
    setTimeout(() => {
      void confetti({
        particleCount: 60,
        spread: 360,
        startVelocity: 25,
        ticks: 90,
        gravity: 0.6,
        origin: { x: 0.2 + Math.random() * 0.6, y: 0.15 + Math.random() * 0.3 },
        colors: ['#facc15', '#f472b6', '#60a5fa', '#34d399', '#fb923c', '#ffffff'],
        disableForReducedMotion: true,
      });
    }, i * 380);
  }
}
