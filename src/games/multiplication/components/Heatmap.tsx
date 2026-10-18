import { t } from '../../../i18n';
import { factHealth, factId, type FactHealth, type FactStatsMap, type GameConfig } from '../engine';

export const HEALTH_STYLE: Record<FactHealth, { bg: string; icon: string; text: string }> = {
  unseen: { bg: 'bg-slate-200', icon: '·', text: 'text-slate-500' },
  struggling: { bg: 'bg-rose-400', icon: '!', text: 'text-white' },
  medium: { bg: 'bg-amber-300', icon: '~', text: 'text-ink' },
  good: { bg: 'bg-emerald-500', icon: '✓', text: 'text-white' },
};

interface Props {
  facts: FactStatsMap;
  config: GameConfig;
  onSelect(id: string): void;
}

/** a × b grid; colour + icon show each fact's health (colour is never the only cue). */
export function Heatmap({ facts, config, onSelect }: Props) {
  const range = Array.from({ length: config.maxFactor - config.minFactor + 1 }, (_, i) => config.minFactor + i);
  return (
    <div className="w-full" data-testid="heatmap">
      <div className="grid gap-[3px]" style={{ gridTemplateColumns: `repeat(${range.length + 1}, minmax(0, 1fr))` }}>
        <div className="flex aspect-square items-center justify-center text-sm font-black text-slate-400">×</div>
        {range.map((b) => (
          <div key={`h${b}`} className="flex aspect-square items-center justify-center text-sm font-black text-sky-600">
            {b}
          </div>
        ))}
        {range.map((a) => (
          <Row key={a} a={a} range={range} facts={facts} config={config} onSelect={onSelect} />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap justify-center gap-2 text-sm font-bold">
        {(Object.keys(HEALTH_STYLE) as FactHealth[]).map((h) => (
          <span key={h} className="flex items-center gap-1">
            <span className={`flex h-5 w-5 items-center justify-center rounded-sm ${HEALTH_STYLE[h].bg} ${HEALTH_STYLE[h].text} text-xs font-black`}>{HEALTH_STYLE[h].icon}</span>
            {t(`summary.legend.${h}`)}
          </span>
        ))}
      </div>
    </div>
  );
}

function Row({ a, range, facts, config, onSelect }: { a: number; range: number[]; facts: FactStatsMap; config: GameConfig; onSelect(id: string): void }) {
  return (
    <>
      <div className="flex aspect-square items-center justify-center text-sm font-black text-sky-600">{a}</div>
      {range.map((b) => {
        const id = factId(a, b, config);
        const s = facts[id];
        if (!s) return <div key={b} />;
        const h = factHealth(s);
        const style = HEALTH_STYLE[h];
        const acc = s.attempts ? Math.round((s.correct / s.attempts) * 100) : null;
        return (
          <button
            key={b}
            type="button"
            onClick={() => onSelect(id)}
            className={`flex aspect-square items-center justify-center rounded-md text-[11px] font-black leading-none active:scale-90 ${style.bg} ${style.text}`}
            aria-label={`${a} × ${b}: ${t(`summary.legend.${h}`)}${acc !== null ? `, %${acc}` : ''}`}
            data-testid={`cell-${id}`}
            data-health={h}
          >
            {style.icon}
          </button>
        );
      })}
    </>
  );
}
