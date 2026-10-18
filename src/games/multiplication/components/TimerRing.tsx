import { useEffect, useRef } from 'react';

interface Props {
  /** performance.now() when the question appeared; null = stopped. */
  startedAt: number | null;
  durationMs: number | null;
  urgentMs: number;
  size?: number;
  children?: React.ReactNode;
}

/**
 * Shrinking ring around the question. Animated via requestAnimationFrame on the DOM directly
 * (no React re-render per frame) to stay smooth on mid-range phones.
 */
export function TimerRing({ startedAt, durationMs, urgentMs, size = 200, children }: Props) {
  const circle = useRef<SVGCircleElement>(null);
  const r = size / 2 - 10;
  const len = 2 * Math.PI * r;

  useEffect(() => {
    const el = circle.current;
    if (!el) return;
    if (startedAt === null || durationMs === null) {
      el.style.strokeDashoffset = '0';
      el.style.stroke = '#22c55e';
      return;
    }
    let raf = 0;
    const frame = () => {
      const left = Math.max(0, durationMs - (performance.now() - startedAt));
      el.style.strokeDashoffset = String(len * (1 - left / durationMs));
      el.style.stroke = left <= urgentMs ? '#ef4444' : left <= durationMs / 2 ? '#f59e0b' : '#22c55e';
      if (left > 0) raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [startedAt, durationMs, urgentMs, len]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#e2e8f0" strokeWidth="12" fill="#fff" />
        {durationMs !== null && (
          <circle ref={circle} cx={size / 2} cy={size / 2} r={r} stroke="#22c55e" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray={len} />
        )}
      </svg>
      <div className="relative flex flex-col items-center">{children}</div>
    </div>
  );
}
