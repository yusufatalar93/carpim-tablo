import { useEffect, useRef, useState } from 'react';
import { haptics } from '../platform';

interface Props {
  label: string;
  onConfirm(): void;
  holdMs?: number;
}

/** Destructive action confirmed by pressing and holding (kid-proof). */
export function HoldButton({ label, onConfirm, holdMs = 1500 }: Props) {
  const [progress, setProgress] = useState(0);
  const raf = useRef<number | null>(null);
  const start = useRef(0);

  const stop = () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    raf.current = null;
    setProgress(0);
  };

  const tick = () => {
    const p = Math.min(1, (performance.now() - start.current) / holdMs);
    setProgress(p);
    if (p >= 1) {
      raf.current = null;
      haptics.play('error');
      onConfirm();
      setTimeout(() => setProgress(0), 300);
      return;
    }
    raf.current = requestAnimationFrame(tick);
  };

  useEffect(() => stop, []);

  return (
    <button
      type="button"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture?.(e.pointerId);
        start.current = performance.now();
        raf.current = requestAnimationFrame(tick);
      }}
      onPointerUp={stop}
      onPointerCancel={stop}
      onPointerLeave={stop}
      onContextMenu={(e) => e.preventDefault()}
      className="relative min-h-[56px] w-full overflow-hidden rounded-2xl border-b-4 border-rose-700 bg-rose-500 px-4 text-xl font-extrabold text-white"
    >
      <span className="absolute inset-y-0 left-0 bg-rose-800/50" style={{ width: `${progress * 100}%` }} />
      <span className="relative">{label}</span>
    </button>
  );
}
