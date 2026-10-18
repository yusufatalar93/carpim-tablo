interface Props {
  value: number; // 0..1
  label?: string;
  color?: string;
  className?: string;
}

export function ProgressBar({ value, label, color = 'bg-emerald-500', className = '' }: Props) {
  const pct = Math.max(0, Math.min(1, value)) * 100;
  return (
    <div className={`relative h-7 w-full overflow-hidden rounded-full bg-white shadow-inner ring-2 ring-black/5 ${className}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)} aria-label={label}>
      <div className={`h-full rounded-full ${color} transition-[width] duration-500 ease-out`} style={{ width: `${pct}%` }} />
      {label && <span className="tabular absolute inset-0 flex items-center justify-center text-sm font-black text-ink">{label}</span>}
    </div>
  );
}
