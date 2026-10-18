import { useEffect, useMemo, useRef, useState } from 'react';
import { formatPercent, formatSeconds, t } from '../../../i18n';
import { navigate } from '../../../app/router';
import { haptics } from '../../../platform';
import { Button } from '../../../ui/Button';
import { burst, celebrate } from '../../../ui/effects';
import { Modal } from '../../../ui/Modal';
import { ProgressBar } from '../../../ui/ProgressBar';
import { Stars } from '../../../ui/Stars';
import type { KidPose } from '../components/Kid';
import { LevelScene } from '../components/LevelScene';
import { config } from '../config';
import { levelFacts, getLevel } from '../data';
import { createLevelSession, createRng, isPlayable, type AnswerResult, type SessionSummary } from '../engine';
import { useTimeLimit } from '../hooks';
import { PlayView } from '../play/PlayView';
import { useGameLoop } from '../play/useGameLoop';
import { playSound } from '../sounds';
import { useMultiplication } from '../store';

interface Completion {
  summary: SessionSummary;
  improved: boolean;
  previousStars: number;
}

/** A normal adventure level: the kid walks to the next village as facts are mastered. */
export function LevelScreen({ levelId }: { levelId: string }) {
  const save = useMultiplication((s) => s.save);
  const level = getLevel(levelId);
  const playable = !!save && !!level && !level.isFinal && isPlayable(save.adventure, levelId);

  useEffect(() => {
    if (level?.isFinal) navigate('/mult/final', { replace: true });
    else if (save && !playable) navigate('/mult/map', { replace: true });
  }, [save, playable, level]);

  if (!save || !level || !playable) return null;
  return <LevelPlay levelId={levelId} />;
}

function LevelPlay({ levelId }: { levelId: string }) {
  const level = getLevel(levelId)!;
  const setFacts = useMultiplication((s) => s.setFacts);
  const finishLevel = useMultiplication((s) => s.finishLevel);
  const timeLimit = useTimeLimit();
  const [attempt, setAttempt] = useState(0);
  const session = useMemo(() => {
    const save = useMultiplication.getState().save!;
    const replay = save.adventure.levels[levelId]?.status === 'completed';
    return createLevelSession(levelFacts[levelId], save.facts, config, createRng(), timeLimit, { replay });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [levelId, attempt]);

  const [pose, setPose] = useState<KidPose>('idle');
  const [obstacleKey, setObstacleKey] = useState(0);
  const [sparkleKey, setSparkleKey] = useState(0);
  const [progress, setProgress] = useState(() => session.stepProgress());
  const [completion, setCompletion] = useState<Completion | null>(null);
  const poseTimer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setProgress(session.stepProgress());
    setCompletion(null);
    setPose('idle');
  }, [session]);

  const setPoseFor = (p: KidPose, ms: number, after: KidPose = 'idle') => {
    clearTimeout(poseTimer.current);
    setPose(p);
    poseTimer.current = setTimeout(() => setPose(after), ms);
  };

  const onAnswer = (r: AnswerResult) => {
    setFacts(session.facts);
    setProgress(session.stepProgress());
    if (r.correct) {
      playSound('ding', r.combo);
      haptics.play('success');
      setSparkleKey((k) => k + 1);
      if (r.combo >= 3) burst(0.3, 0.3, Math.min(2, r.combo / 4));
      setPoseFor(r.combo >= 3 ? 'run' : 'hop', r.combo >= 3 ? 700 : 450);
    } else {
      playSound('bonk');
      haptics.play('error');
      setObstacleKey((k) => k + 1);
      setPoseFor('stumble', 700);
    }
    if (r.levelPassed) {
      const summary = session.summary();
      const res = finishLevel(levelId, summary.stars, summary.accuracy);
      clearTimeout(poseTimer.current);
      setPose('walk');
      setTimeout(() => {
        setPose('cheer');
        playSound('levelComplete');
        haptics.play('celebrate');
        celebrate();
        setCompletion({ summary, improved: res.improved, previousStars: res.previousStars });
      }, 900);
    }
  };

  const loop = useGameLoop({
    session,
    config,
    onAnswer,
    onAfterFeedback: (r) => (r.levelPassed ? 'done' : 'continue'),
  });

  const { done, total } = session.progress();
  const sceneProgress = completion ? 1.15 : progress;

  return (
    <PlayView
      loop={loop}
      config={config}
      timeLimitMs={session.timeLimitMs}
      onQuit={() => navigate('/mult/map')}
      header={
        <div>
          <div className="mb-1 flex justify-between text-sm font-black text-slate-500">
            <span>{t(`levels.${level.nameKey}`)}</span>
          </div>
          <ProgressBar value={total ? done / total : 0} label={t('game.progress', { done, total })} />
        </div>
      }
      scene={
        <LevelScene scene={level.scene} progress={Math.min(1.15, sceneProgress)} pose={pose} obstacleKey={obstacleKey} sparkleKey={sparkleKey} arrived={!!completion} />
      }
    >
      <Modal open={!!completion} labelledBy="lc-title">
        {completion && (
          <div className="flex flex-col items-center gap-3 text-center" data-testid="level-complete">
            <h2 id="lc-title" className="text-3xl font-black text-emerald-600">
              🎉 {t('levelComplete.title')}
            </h2>
            <p className="text-lg font-bold">{t('levelComplete.arrived', { name: t(`levels.${level.nameKey}`) })}</p>
            <Stars count={completion.summary.stars} size={56} animate onStar={(i) => playSound('star', i)} />
            {completion.improved && completion.previousStars > 0 && (
              <p className="rounded-full bg-amber-100 px-3 py-1 font-black text-amber-700">{t('levelComplete.newBest')}</p>
            )}
            <div className="grid w-full grid-cols-3 gap-2">
              <Stat label={t('levelComplete.accuracy')} value={formatPercent(completion.summary.accuracy)} />
              <Stat label={t('levelComplete.avgTime')} value={formatSeconds(completion.summary.avgCorrectMs)} />
              <Stat label={t('levelComplete.bestCombo')} value={`x${completion.summary.bestCombo}`} />
            </div>
            <div className="mt-2 flex w-full flex-col gap-2">
              <Button size="lg" variant="success" onClick={() => navigate('/mult/map')} data-testid="back-to-map">
                🗺️ {t('common.backToMap')}
              </Button>
              <Button variant="secondary" onClick={() => setAttempt((a) => a + 1)}>
                🔁 {t('common.playAgain')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </PlayView>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white p-2 shadow-sm">
      <div className="text-xs font-bold text-slate-500">{label}</div>
      <div className="tabular text-xl font-black">{value}</div>
    </div>
  );
}
