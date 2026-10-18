interface Props {
  checked: boolean;
  onChange(v: boolean): void;
  label: string;
}

export function Toggle({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex min-h-[56px] w-full items-center justify-between gap-4 rounded-2xl bg-white px-4 text-xl font-bold shadow-sm"
    >
      <span>{label}</span>
      <span className={`relative h-9 w-16 shrink-0 rounded-full transition ${checked ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-1 h-7 w-7 rounded-full bg-white shadow transition-all ${checked ? 'left-8' : 'left-1'}`} />
      </span>
    </button>
  );
}

interface SegmentedProps<T extends string | number> {
  value: T;
  options: { value: T; label: string }[];
  onChange(v: T): void;
  label: string;
}

export function Segmented<T extends string | number>({ value, options, onChange, label }: SegmentedProps<T>) {
  return (
    <div role="radiogroup" aria-label={label} className="flex gap-2 rounded-2xl bg-white p-1.5 shadow-sm">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={`min-h-[52px] flex-1 rounded-xl px-2 text-lg font-extrabold transition ${o.value === value ? 'bg-sky-500 text-white shadow' : 'text-ink hover:bg-slate-100'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
