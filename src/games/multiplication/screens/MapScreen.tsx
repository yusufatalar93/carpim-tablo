import { useState } from 'react';
import { t, tableName } from '../../../i18n';
import { navigate } from '../../../app/router';
import { haptics } from '../../../platform';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { Stars } from '../../../ui/Stars';
import { WorldMap } from '../components/WorldMap';
import { totalStars, type LevelDef } from '../engine';
import { levelFacts, levelIndex } from '../data';
import { useReduceMotion } from '../hooks';
import { levels } from '../levels';
import { useMultiplication } from '../store';

export function MapScreen() {
  const save = useMultiplication((s) => s.save);
  const walk = useMultiplication((s) => s.pendingWalk);
  const clearWalk = useMultiplication((s) => s.clearPendingWalk);
  const reduceMotion = useReduceMotion();
  const [selected, setSelected] = useState<LevelDef | null>(null);
  const [lockedHint, setLockedHint] = useState(false);
  if (!save) return null;

  const status = selected ? save.adventure.levels[selected.id]?.status : undefined;
  const play = (level: LevelDef) => navigate(level.isFinal ? '/mult/final' : `/mult/level/${level.id}`);

  return (
    <div className="relative mx-auto flex h-full w-full max-w-[560px] flex-col">
      <div className="safe-pad pointer-events-none absolute inset-x-0 top-0 z-10 flex items-center gap-2 !pb-0">
        <button
          type="button"
          onClick={() => navigate('/mult')}
          aria-label={t('common.back')}
          className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/95 text-3xl font-black shadow-md active:scale-95"
        >
          ‹
        </button>
        <h1 className="flex-1 truncate rounded-2xl bg-white/80 px-3 py-2 text-xl font-black backdrop-blur">{t('map.title')}</h1>
        <div className="rounded-2xl bg-white/95 px-3 py-2 text-xl font-black shadow-md">⭐ {totalStars(save.adventure)}</div>
      </div>
      <WorldMap
        levels={levels}
        adventure={save.adventure}
        walk={walk}
        onWalkDone={clearWalk}
        reduceMotion={reduceMotion}
        onSelect={(level) => {
          const st = save.adventure.levels[level.id]?.status;
          if (st === 'locked') {
            haptics.play('error');
            setLockedHint(true);
            setTimeout(() => setLockedHint(false), 1800);
            return;
          }
          setSelected(level);
        }}
      />
      {lockedHint && (
        <div role="status" className="pointer-events-none absolute inset-x-4 bottom-8 z-20 rounded-2xl bg-ink/90 p-4 text-center text-lg font-bold text-white">
          🔒 {t('map.lockedHint')}
        </div>
      )}
      <Modal open={selected !== null} onClose={() => setSelected(null)} variant="sheet" labelledBy="level-sheet-title">
        {selected && (
          <div className="flex flex-col gap-3 text-center">
            <p className="text-lg font-bold text-slate-500">{t('map.level', { n: levelIndex(selected.id) + 1 })}</p>
            <h2 id="level-sheet-title" className="text-3xl font-black">
              {t(`levels.${selected.nameKey}`)}
            </h2>
            {selected.isFinal ? (
              <p className="text-xl font-bold text-violet-600">⚔️ {t('map.finalHint')}</p>
            ) : (
              <>
                <p className="text-2xl font-black text-sky-600">{selected.tables.map(tableName).join(', ')}</p>
                <p className="text-lg font-bold text-slate-500">{t('map.newFacts', { count: levelFacts[selected.id].newFacts.length })}</p>
              </>
            )}
            {status === 'completed' && <Stars count={save.adventure.levels[selected.id].bestStars} size={40} />}
            <Button size="lg" variant={status === 'completed' ? 'secondary' : 'success'} onClick={() => play(selected)} data-testid="play-level">
              ▶ {status === 'completed' ? t('map.replay') : t('map.play')}
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
}
