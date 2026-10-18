import { motion } from 'framer-motion';
import { t } from '../../../i18n';
import { navigate } from '../../../app/router';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Screen } from '../../../ui/Screen';
import { Kid } from '../components/Kid';
import { completedCount, totalStars } from '../engine';
import { levels } from '../levels';
import { useMultiplication } from '../store';

/** Multiplication game menu: Adventure, Practice, Summary. */
export function MenuScreen() {
  const save = useMultiplication((s) => s.save);
  if (!save) return null;
  const done = completedCount(save.adventure);
  const current = Math.min(levels.length, done + 1);
  const items = [
    { key: 'adventure', emoji: '🗺️', route: '/mult/map', color: 'bg-amber-400 border-amber-600 text-ink' },
    { key: 'practice', emoji: '🎯', route: '/mult/practice', color: 'bg-emerald-500 border-emerald-700 text-white' },
    { key: 'summary', emoji: '📊', route: '/mult/summary', color: 'bg-violet-500 border-violet-700 text-white' },
  ];
  return (
    <Screen title={t('menu.title')} back="/">
      <div className="flex items-center gap-3 rounded-3xl bg-white p-4 shadow-xs">
        <Kid pose="idle" size={56} />
        <div className="flex-1">
          <p className="text-lg font-black" data-testid="menu-progress">
            {done >= levels.length ? t('menu.allDone') : t('menu.progress', { current, total: levels.length })}
          </p>
          <ProgressBar value={done / levels.length} className="mt-2" />
          <p className="mt-1 text-sm font-bold text-amber-600">⭐ {totalStars(save.adventure)}</p>
        </div>
      </div>
      <div className="mt-5 flex flex-col gap-4 pb-6">
        {items.map((it, i) => (
          <motion.button
            key={it.key}
            type="button"
            onClick={() => navigate(it.route)}
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08 }}
            className={`flex min-h-[96px] items-center gap-4 rounded-3xl border-b-[6px] px-6 text-3xl font-black shadow-md active:translate-y-[3px] active:border-b-[3px] ${it.color}`}
            data-testid={`menu-${it.key}`}
          >
            <span className="text-5xl" aria-hidden="true">{it.emoji}</span>
            {t(`menu.${it.key}`)}
          </motion.button>
        ))}
      </div>
    </Screen>
  );
}
