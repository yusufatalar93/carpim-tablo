import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState, type ReactNode } from 'react';
import { t } from '../../../i18n';
import { Keypad } from '../../../ui/Keypad';
import { TimerRing } from '../components/TimerRing';
import type { GameConfig } from '../engine';
import type { useGameLoop } from './useGameLoop';

interface Props {
  loop: ReturnType<typeof useGameLoop>;
  config: GameConfig;
  timeLimitMs: number | null;
  /** Header row (progress bar etc.). */
  header: ReactNode;
  /** Scene above the question (road / battle). */
  scene?: ReactNode;
  onQuit(): void;
  /** Overlays (level complete, wave won...). */
  children?: ReactNode;
}

function useCompact(): boolean {
  const [compact, setCompact] = useState(() => typeof window !== 'undefined' && window.innerHeight < 720);
  useEffect(() => {
    const on = () => setCompact(window.innerHeight < 720);
    window.addEventListener('resize', on);
    return () => window.removeEventListener('resize', on);
  }, []);
  return compact;
}

/** Shared in-game layout: header, scene, timer ring with the question, keypad. */
export function PlayView({ loop, config, timeLimitMs, header, scene, onQuit, children }: Props) {
  const compact = useCompact();
  const { phase, question, input, lastResult, count } = loop;
  const [shakeKey, setShakeKey] = useState(0);
  const showResult = phase === 'feedback' || phase === 'paused' || phase === 'done';
  const wrong = showResult && lastResult && !lastResult.correct;
  const correct = showResult && lastResult?.correct;

  useEffect(() => {
    if (phase === 'feedback' && lastResult && !lastResult.correct) setShakeKey((k) => k + 1);
  }, [phase, lastResult]);

  const ringSize = compact ? 150 : 190;
  const q = showResult && lastResult ? lastResult.question : question;

  return (
    <div className="safe-pad mx-auto flex h-full w-full max-w-[560px] flex-col gap-2 overflow-hidden">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onQuit}
          aria-label={t('common.quit')}
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white text-2xl font-black shadow-xs active:scale-95"
          data-testid="quit"
        >
          ✕
        </button>
        <div className="flex-1">{header}</div>
      </div>

      <div key={shakeKey} className={`flex min-h-0 flex-1 flex-col gap-2 ${shakeKey ? 'shake' : ''}`}>
        {scene && <div className="relative min-h-[96px] flex-1 overflow-hidden rounded-3xl">{scene}</div>}

        <div className="relative flex shrink-0 items-center justify-center">
          <TimerRing startedAt={phase === 'question' ? loop.startedAt : null} durationMs={timeLimitMs} urgentMs={config.urgentMs} size={ringSize}>
            {q && phase !== 'countdown' ? (
              <div className="flex flex-col items-center" aria-live="polite">
                <div className={`tabular font-black leading-none ${compact ? 'text-4xl' : 'text-5xl'}`} data-testid="question" data-a={q.a} data-b={q.b}>
                  {q.a} × {q.b}
                </div>
                {wrong ? (
                  <div className="mt-1 flex flex-col items-center">
                    <span className="text-xs font-bold text-rose-500">{lastResult.timedOut ? t('game.timeUp') : t('game.wrong')}</span>
                    <span className={`tabular font-black text-emerald-600 ${compact ? 'text-3xl' : 'text-4xl'}`} data-testid="reveal">
                      = {lastResult.question.answer}
                    </span>
                  </div>
                ) : (
                  <div
                    className={`tabular mt-2 min-w-[96px] rounded-2xl border-4 px-3 text-center font-black ${compact ? 'text-3xl' : 'text-4xl'} ${
                      correct ? 'border-emerald-400 bg-emerald-50 text-emerald-600' : 'border-sky-200 bg-sky-50 text-ink'
                    }`}
                    aria-label={t('game.answer')}
                    data-testid="answer"
                  >
                    {correct ? `${lastResult!.question.answer} ✓` : input || ' '}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-4xl font-black text-sky-500">{phase === 'countdown' ? '' : '…'}</div>
            )}
          </TimerRing>
          <AnimatePresence>
            {phase === 'countdown' && (
              <motion.div
                key={count}
                className="absolute inset-0 flex items-center justify-center text-7xl font-black text-sky-500"
                initial={{ scale: 2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.3 }}
                data-testid="countdown"
              >
                {count > 0 ? count : t('game.go')}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {correct && lastResult!.combo >= 3 && (
              <motion.div
                key={lastResult!.combo}
                className="absolute right-0 top-0 rotate-6 rounded-2xl bg-amber-400 px-3 py-1 text-xl font-black text-ink shadow-lg"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.3, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35 }}
              >
                {t('game.combo', { n: lastResult!.combo })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className={`shrink-0 ${compact ? 'h-[236px]' : 'h-[280px]'}`}>
        <Keypad onDigit={loop.typeDigit} onErase={loop.erase} onSubmit={loop.submit} disabled={phase !== 'question'} canSubmit={input !== ''} />
      </div>
      {children}
    </div>
  );
}
