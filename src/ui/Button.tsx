import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { haptics } from '../platform';

type Variant = 'primary' | 'secondary' | 'success' | 'warning' | 'ghost';

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-sky-500 text-white border-sky-700 hover:bg-sky-400',
  secondary: 'bg-white text-ink border-slate-300 hover:bg-slate-50',
  success: 'bg-emerald-500 text-white border-emerald-700 hover:bg-emerald-400',
  warning: 'bg-amber-400 text-ink border-amber-600 hover:bg-amber-300',
  ghost: 'bg-transparent text-ink border-transparent shadow-none hover:bg-black/5',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: 'md' | 'lg';
  icon?: ReactNode;
}

/** Chunky, kid-friendly button. Min touch target 56×56. */
export function Button({ variant = 'primary', size = 'md', icon, className = '', children, onClick, ...rest }: Props) {
  const sizing = size === 'lg' ? 'min-h-[64px] px-6 text-2xl' : 'min-h-[56px] px-5 text-xl';
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border-b-4 font-extrabold transition active:translate-y-[2px] active:border-b-2 disabled:opacity-50 disabled:active:translate-y-0 ${VARIANTS[variant]} ${sizing} ${className}`}
      onClick={(e) => {
        haptics.play('tap');
        onClick?.(e);
      }}
      {...rest}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      {children}
    </button>
  );
}
