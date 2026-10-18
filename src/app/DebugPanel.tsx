import { useState } from 'react';
import { useMultiplication } from '../games/multiplication/store';
import { levels } from '../games/multiplication/levels';
import type { Mastery } from '../games/multiplication/engine';
import { navigate } from './router';

/** Development-only tools (never rendered in production builds). Texts are intentionally not translated. */
export function DebugPanel() {
  const [open, setOpen] = useState(false);
  const debug = useMultiplication((s) => s.debug);
  const reset = useMultiplication((s) => s.resetProgress);
  const btn = 'rounded-lg bg-slate-700 px-2 py-2 text-sm font-bold text-white active:bg-slate-600';
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-2 left-2 z-[100] h-10 w-10 rounded-full bg-slate-800/70 text-lg text-white"
        aria-label="Debug"
        data-testid="debug-toggle"
      >
        🐞
      </button>
      {open && (
        <div className="fixed bottom-14 left-2 z-[100] w-72 rounded-2xl bg-slate-900/95 p-3 text-white shadow-2xl">
          <p className="mb-2 text-sm font-black">Debug panel (dev only)</p>
          <div className="mb-2 grid grid-cols-2 gap-1">
            <button className={btn} onClick={debug.unlockAll}>Unlock all</button>
            <button className={btn} onClick={debug.lockAll}>Lock all</button>
            <button className={btn} onClick={reset}>Reset progress</button>
            <button className={btn} onClick={() => { debug.completeUpTo(levels[levels.length - 2].id); navigate('/mult/final'); setOpen(false); }}>
              Start final
            </button>
          </div>
          <p className="text-xs font-bold text-slate-300">Complete up to level:</p>
          <div className="mb-2 grid grid-cols-4 gap-1">
            {levels.map((l, i) => (
              <button key={l.id} className={btn} onClick={() => debug.completeUpTo(l.id)}>{i + 1}</button>
            ))}
          </div>
          <p className="text-xs font-bold text-slate-300">Set all mastery:</p>
          <div className="mb-2 grid grid-cols-4 gap-1">
            {[0, 1, 2, 3].map((m) => (
              <button key={m} className={btn} onClick={() => debug.setAllMastery(m as Mastery)}>{m}</button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-1">
            <button className={btn} onClick={() => { navigate('/mult/school'); setOpen(false); }}>School scene</button>
            <button className={btn} onClick={() => { navigate('/mult/map'); setOpen(false); }}>Map</button>
          </div>
        </div>
      )}
    </>
  );
}
