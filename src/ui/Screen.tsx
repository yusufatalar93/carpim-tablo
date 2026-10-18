import type { ReactNode } from 'react';
import { t } from '../i18n';
import { navigate } from '../app/router';

interface Props {
  title?: string;
  back?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Use the full height without inner scrolling (game screens). */
  fixed?: boolean;
}

/** Page frame: safe-area padding, centered max-width column, optional header with a back button. */
export function Screen({ title, back, right, children, className = '', fixed }: Props) {
  return (
    <div className={`safe-pad mx-auto flex h-full w-full max-w-[560px] flex-col ${fixed ? 'overflow-hidden' : 'overflow-y-auto'} ${className}`}>
      {(title || back) && (
        <header className="mb-3 flex min-h-[56px] items-center gap-2">
          {back && (
            <button
              type="button"
              aria-label={t('common.back')}
              onClick={() => navigate(back)}
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-3xl font-black shadow-xs active:scale-95"
            >
              ‹
            </button>
          )}
          {title && <h1 className="flex-1 truncate text-2xl font-black">{title}</h1>}
          {right}
        </header>
      )}
      {children}
    </div>
  );
}
