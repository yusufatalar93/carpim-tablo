import { t } from '../i18n';
import { haptics } from '../platform';

interface Props {
  onDigit(d: number): void;
  onErase(): void;
  onSubmit(): void;
  disabled?: boolean;
  canSubmit?: boolean;
}

/** Large numeric keypad for thumbs (0–9, erase, OK). */
export function Keypad({ onDigit, onErase, onSubmit, disabled, canSubmit = true }: Props) {
  const key = 'flex h-full min-h-[56px] items-center justify-center rounded-2xl border-b-4 text-3xl font-black transition active:translate-y-[2px] active:border-b-2 disabled:opacity-40';
  const press = (fn: () => void) => () => {
    haptics.play('tap');
    fn();
  };
  return (
    <div className="grid grid-cols-3 grid-rows-4 gap-2" role="group" aria-label={t('game.keypad')}>
      {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
        <button key={d} type="button" disabled={disabled} onClick={press(() => onDigit(d))} className={`${key} border-slate-300 bg-white text-ink`} data-testid={`key-${d}`}>
          {d}
        </button>
      ))}
      <button type="button" disabled={disabled} onClick={press(onErase)} aria-label={t('game.erase')} className={`${key} border-rose-300 bg-rose-100 text-rose-600`} data-testid="key-erase">
        ⌫
      </button>
      <button type="button" disabled={disabled} onClick={press(() => onDigit(0))} className={`${key} border-slate-300 bg-white text-ink`} data-testid="key-0">
        0
      </button>
      <button
        type="button"
        disabled={disabled || !canSubmit}
        onClick={press(onSubmit)}
        className={`${key} border-emerald-700 bg-emerald-500 text-xl! text-white`}
        data-testid="key-ok"
      >
        {t('game.submit')}
      </button>
    </div>
  );
}
