import { useState } from 'react';
import { formatPercent, formatSeconds, t, tableName } from '../../../i18n';
import { navigate } from '../../../app/router';
import { Button } from '../../../ui/Button';
import { Modal } from '../../../ui/Modal';
import { Screen } from '../../../ui/Screen';
import { HEALTH_STYLE, Heatmap } from '../components/Heatmap';
import { config } from '../config';
import { getLevel, levelFacts } from '../data';
import { completedCount, factHealth, hardestFacts, levelOfFact, tableAccuracy, totalStars, totals } from '../engine';
import { levels } from '../levels';
import { useMultiplication } from '../store';
import { Stat } from './LevelScreen';

/** Progress overview: heatmap, per-table bars, hardest facts, adventure status, totals. */
export function SummaryScreen() {
  const save = useMultiplication((s) => s.save);
  const [selected, setSelected] = useState<string | null>(null);
  if (!save) return null;
  const facts = save.facts;
  const sum = totals(facts);
  const hardest = hardestFacts(facts, 5, config);
  const tables = Array.from({ length: config.maxFactor - config.minFactor + 1 }, (_, i) => config.minFactor + i);
  const sel = selected ? facts[selected] : null;
  const selLevel = selected ? getLevel(levelOfFact(levelFacts, levels, selected) ?? '') : undefined;

  return (
    <Screen title={t('summary.title')} back="/mult">
      <div className="flex flex-col gap-5 pb-8">
        <section className="grid grid-cols-3 gap-2" aria-label={t('summary.general')}>
          <Stat label={t('summary.questions')} value={String(sum.attempts)} />
          <Stat label={t('summary.accuracy')} value={formatPercent(sum.accuracy)} />
          <Stat label={t('summary.avgTime')} value={sum.correct ? formatSeconds(sum.avgResponseMs) : '–'} />
        </section>

        <section className="rounded-3xl bg-white p-3 shadow-sm">
          <h2 className="mb-1 text-xl font-black">{t('summary.heatmap')}</h2>
          <p className="mb-2 text-sm font-bold text-slate-500">{t('summary.heatmapHint')}</p>
          <Heatmap facts={facts} config={config} onSelect={setSelected} />
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-black">{t('summary.hardest')}</h2>
          {hardest.length === 0 ? (
            <p className="font-bold text-slate-500">{t('summary.noHardest')}</p>
          ) : (
            <>
              <ul className="mb-3 flex flex-wrap gap-2">
                {hardest.map((f) => (
                  <li key={f.id} className="tabular rounded-2xl bg-rose-100 px-3 py-2 text-xl font-black text-rose-700">
                    {f.a} × {f.b}
                  </li>
                ))}
              </ul>
              <Button variant="success" className="w-full" onClick={() => navigate(`/mult/practice?facts=${hardest.map((f) => f.id).join(',')}`)} data-testid="study-these">
                🎯 {t('summary.studyThese')}
              </Button>
            </>
          )}
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-xl font-black">{t('summary.tables')}</h2>
          <div className="flex flex-col gap-2">
            {tables.map((n) => {
              const ta = tableAccuracy(facts, n);
              return (
                <div key={n} className="flex items-center gap-2">
                  <span className="w-14 shrink-0 text-right font-black">{tableName(n)}</span>
                  <div className="relative h-6 flex-1 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${ta.accuracy >= 0.85 ? 'bg-emerald-500' : ta.accuracy >= 0.6 ? 'bg-amber-400' : 'bg-rose-400'}`}
                      style={{ width: `${ta.attempts ? Math.max(4, ta.accuracy * 100) : 0}%` }}
                    />
                  </div>
                  <span className="tabular w-12 shrink-0 text-right text-sm font-black">{ta.attempts ? formatPercent(ta.accuracy) : '–'}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-4 shadow-sm" data-testid="summary-adventure">
          <h2 className="mb-3 text-xl font-black">{t('summary.adventure')}</h2>
          <div className="grid grid-cols-2 gap-2">
            <Stat label={t('summary.levelsDone')} value={`${completedCount(save.adventure)} / ${levels.length}`} />
            <Stat label={t('summary.totalStars')} value={`⭐ ${totalStars(save.adventure)}`} />
          </div>
        </section>
      </div>

      <Modal open={!!sel} onClose={() => setSelected(null)} variant="sheet" labelledBy="fact-title">
        {sel && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl font-black ${HEALTH_STYLE[factHealth(sel)].bg} ${HEALTH_STYLE[factHealth(sel)].text}`}>
                {HEALTH_STYLE[factHealth(sel)].icon}
              </span>
              <h2 id="fact-title" className="tabular text-4xl font-black">
                {sel.a} × {sel.b} = {sel.a * sel.b}
              </h2>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Stat label={t('summary.detail.asked')} value={t('summary.detail.times', { n: sel.attempts })} />
              <Stat label={t('summary.detail.correct')} value={String(sel.correct)} />
              <Stat label={t('summary.detail.wrong')} value={String(sel.wrong)} />
              <Stat label={t('summary.detail.avg')} value={sel.correct ? formatSeconds(sel.avgResponseMs) : '–'} />
              <Stat label={t('summary.detail.mastery')} value={`${'●'.repeat(sel.mastery)}${'○'.repeat(3 - sel.mastery)}`} />
              <Stat label={t('summary.detail.level')} value={selLevel ? t(`levels.${selLevel.nameKey}`) : '–'} />
            </div>
            <Button variant="secondary" onClick={() => setSelected(null)}>
              {t('common.close')}
            </Button>
          </div>
        )}
      </Modal>
    </Screen>
  );
}
