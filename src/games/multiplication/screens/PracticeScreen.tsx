import { useMemo, useRef, useState } from 'react';
import { t, tableName } from '../../../i18n';
import { navigate } from '../../../app/router';
import { haptics } from '../../../platform';
import { Button } from '../../../ui/Button';
import { burst } from '../../../ui/effects';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Screen } from '../../../ui/Screen';
import { Segmented, Toggle } from '../../../ui/Toggle';
import type { KidPose } from '../components/Kid';
import { Kid } from '../components/Kid';
import { LevelScene } from '../components/LevelScene';
import { config } from '../config';
import { createPracticeSession, createRng, parseFactId, type AnswerResult, type PracticeSource } from '../engine';
import { useTimeLimit } from '../hooks';
import { PlayView } from '../play/PlayView';
import { useGameLoop } from '../play/useGameLoop';
import { playSound } from '../sounds';
import { useMultiplication } from '../store';
import { Stat } from './LevelScreen';

type Mode = 'weak' | 'tables' | 'facts';

interface Setup {
  source: PracticeSource;
  length: number;
  timer: boolean;
}

interface RoundResult {
  correct: number;
  wrong: number;
  hardest: { id: string; wrong: number }[];
}

/** Practice: no map or monster, lower pressure; updates statistics only. */
export function PracticeScreen({ presetFacts }: { presetFacts?: string[] }) {
  const [setup, setSetup] = useState<Setup | null>(null);
  const [result, setResult] = useState<RoundResult | null>(null);
  const [round, setRound] = useState(0);

  if (result && setup) {
    return (
      <PracticeResult
        result={result}
        onAgain={() => {
          setResult(null);
          setRound((r) => r + 1);
        }}
        onSetup={() => {
          setResult(null);
          setSetup(null);
        }}
      />
    );
  }
  if (setup) return <PracticePlay key={round} setup={setup} onDone={setResult} />;
  return <PracticeSetup presetFacts={presetFacts} onStart={setSetup} />;
}

function PracticeSetup({ presetFacts, onStart }: { presetFacts?: string[]; onStart(s: Setup): void }) {
  const validPreset = (presetFacts ?? []).filter((id) => parseFactId(id));
  const [mode, setMode] = useState<Mode>(validPreset.length ? 'facts' : 'weak');
  const [tables, setTables] = useState<number[]>([]);
  const [length, setLength] = useState(config.practice.defaultLength);
  const [timer, setTimer] = useState(config.practice.timerDefaultOn);
  const allTables = Array.from({ length: config.maxFactor - config.minFactor + 1 }, (_, i) => config.minFactor + i);
  const modes: { value: Mode; label: string }[] = [
    { value: 'weak', label: t('practice.modeWeak') },
    { value: 'tables', label: t('practice.modeTables') },
    ...(validPreset.length ? [{ value: 'facts' as Mode, label: t('practice.modeFacts') }] : []),
  ];
  const canStart = mode !== 'tables' || tables.length > 0;

  return (
    <Screen title={t('practice.title')} back="/mult">
      <div className="flex flex-col gap-4 pb-6">
        <Segmented<Mode> label={t('practice.title')} value={mode} options={modes} onChange={setMode} />
        {mode === 'weak' && <p className="text-center text-lg font-bold text-slate-600">{t('practice.modeWeakDesc')}</p>}
        {mode === 'facts' && (
          <div className="flex flex-wrap justify-center gap-2">
            {validPreset.map((id) => {
              const f = parseFactId(id)!;
              return (
                <span key={id} className="tabular rounded-2xl bg-rose-100 px-3 py-2 text-xl font-black text-rose-700">
                  {f.a} × {f.b}
                </span>
              );
            })}
          </div>
        )}
        {mode === 'tables' && (
          <div>
            <div className="grid grid-cols-5 gap-2" role="group" aria-label={t('practice.modeTables')}>
              {allTables.map((n) => {
                const on = tables.includes(n);
                return (
                  <button
                    key={n}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setTables((ts) => (on ? ts.filter((x) => x !== n) : [...ts, n]))}
                    className={`min-h-[56px] rounded-2xl border-b-4 text-2xl font-black ${on ? 'border-sky-700 bg-sky-500 text-white' : 'border-slate-300 bg-white text-ink'}`}
                    data-testid={`table-${n}`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-center font-bold text-slate-500">{tables.length ? [...tables].sort((a, b) => a - b).map(tableName).join(', ') : t('practice.pickTable')}</p>
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-slate-600">{t('practice.length')}</span>
          <Segmented<number> label={t('practice.length')} value={length} options={config.practice.roundLengths.map((n) => ({ value: n, label: String(n) }))} onChange={setLength} />
        </div>
        <Toggle label={`⏱️ ${t('practice.timer')}`} checked={timer} onChange={setTimer} />
        <Button
          size="lg"
          variant="success"
          disabled={!canStart}
          data-testid="practice-start"
          onClick={() =>
            onStart({
              length,
              timer,
              source: mode === 'tables' ? { kind: 'tables', tables } : mode === 'facts' ? { kind: 'facts', factIds: validPreset } : { kind: 'weak' },
            })
          }
        >
          ▶ {t('practice.start')}
        </Button>
        <div className="flex justify-center">
          <Kid pose="idle" size={70} />
        </div>
      </div>
    </Screen>
  );
}

function PracticePlay({ setup, onDone }: { setup: Setup; onDone(r: RoundResult): void }) {
  const setFacts = useMultiplication((s) => s.setFacts);
  const timeLimit = useTimeLimit();
  const session = useMemo(
    () => createPracticeSession(setup.source, setup.length, useMultiplication.getState().save!.facts, config, createRng(), setup.timer ? timeLimit : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  const wrongs = useRef<Record<string, number>>({});
  const [pose, setPose] = useState<KidPose>('idle');
  const [sparkle, setSparkle] = useState(0);
  const [obstacle, setObstacle] = useState(0);
  const [answered, setAnswered] = useState(0);
  const poseTimer = useRef<ReturnType<typeof setTimeout>>();

  const onAnswer = (r: AnswerResult) => {
    setFacts(session.facts);
    setAnswered((n) => n + 1);
    clearTimeout(poseTimer.current);
    if (r.correct) {
      playSound('ding', r.combo);
      haptics.play('success');
      setSparkle((k) => k + 1);
      setPose(r.combo >= 3 ? 'run' : 'hop');
      if (r.combo >= 5) burst(0.5, 0.3, 1);
    } else {
      wrongs.current[r.question.factId] = (wrongs.current[r.question.factId] ?? 0) + 1;
      playSound('bonk');
      haptics.play('error');
      setObstacle((k) => k + 1);
      setPose('stumble');
    }
    poseTimer.current = setTimeout(() => setPose('idle'), 600);
  };

  const loop = useGameLoop({
    session,
    config,
    onAnswer,
    onAfterFeedback: (r) => {
      if (!r.roundComplete) return 'continue';
      const s = session.summary();
      playSound('levelComplete');
      onDone({
        correct: s.correct,
        wrong: s.answered - s.correct,
        hardest: Object.entries(wrongs.current)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([id, wrong]) => ({ id, wrong })),
      });
      return 'done';
    },
  });

  return (
    <PlayView
      loop={loop}
      config={config}
      timeLimitMs={session.timeLimitMs}
      onQuit={() => navigate('/mult')}
      header={
        <div>
          <div className="mb-1 text-sm font-black text-slate-500">
            🎯 {t('practice.title')} {session.timeLimitMs === null && `· ${t('practice.noPressure')}`}
          </div>
          <ProgressBar value={answered / setup.length} color="bg-sky-500" label={t('game.progress', { done: answered, total: setup.length })} />
        </div>
      }
      scene={<LevelScene scene="home" progress={answered / setup.length} pose={pose} obstacleKey={obstacle} sparkleKey={sparkle} arrived={false} />}
    />
  );
}

function PracticeResult({ result, onAgain, onSetup }: { result: RoundResult; onAgain(): void; onSetup(): void }) {
  return (
    <Screen title={t('practice.resultTitle')} back="/mult">
      <div className="flex flex-col items-center gap-4 pb-6" data-testid="practice-result">
        <Kid pose="cheer" size={90} />
        <div className="grid w-full grid-cols-2 gap-2">
          <Stat label={`✅ ${t('practice.correct')}`} value={String(result.correct)} />
          <Stat label={`❌ ${t('practice.wrong')}`} value={String(result.wrong)} />
        </div>
        <section className="w-full rounded-3xl bg-white p-4 text-center shadow-xs">
          <h2 className="mb-2 text-xl font-black">{t('practice.hardest')}</h2>
          {result.hardest.length === 0 ? (
            <p className="font-bold text-emerald-600">🌟 {t('practice.noHard')}</p>
          ) : (
            <ul className="flex flex-wrap justify-center gap-2">
              {result.hardest.map(({ id }) => {
                const f = parseFactId(id)!;
                return (
                  <li key={id} className="tabular rounded-2xl bg-rose-100 px-3 py-2 text-xl font-black text-rose-700">
                    {f.a} × {f.b} = {f.a * f.b}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
        <div className="flex w-full flex-col gap-2">
          <Button size="lg" variant="success" onClick={onAgain}>
            🔁 {t('practice.again')}
          </Button>
          <Button variant="secondary" onClick={onSetup}>
            ⚙️ {t('practice.title')}
          </Button>
          <Button variant="ghost" onClick={() => navigate('/mult')}>
            {t('common.menu')}
          </Button>
        </div>
      </div>
    </Screen>
  );
}
