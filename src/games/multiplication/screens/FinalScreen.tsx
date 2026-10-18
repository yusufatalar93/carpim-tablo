import { useEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../../i18n';
import { navigate } from '../../../app/router';
import { haptics } from '../../../platform';
import { Button } from '../../../ui/Button';
import { celebrate, fireworks } from '../../../ui/effects';
import { Modal } from '../../../ui/Modal';
import { ProgressBar } from '../../../ui/ProgressBar';
import { BattleScene } from '../components/BattleScene';
import type { KidPose } from '../components/Kid';
import { Kid } from '../components/Kid';
import { Monster, type MonsterState } from '../components/Monster';
import { config } from '../config';
import { finalLevel } from '../data';
import { createFinalSession, createRng, isPlayable, type AnswerResult, type BattleState } from '../engine';
import { useTimeLimit } from '../hooks';
import { PlayView } from '../play/PlayView';
import { useGameLoop } from '../play/useGameLoop';
import { playSound } from '../sounds';
import { useMultiplication } from '../store';

type Overlay = 'intro' | 'won' | 'lost' | 'victory' | null;

/** Final level: monster battle at the school gate, split into waves. */
export function FinalScreen() {
  const save = useMultiplication((s) => s.save);
  const playable = !!save && isPlayable(save.adventure, finalLevel.id);
  useEffect(() => {
    if (save && !playable) navigate('/mult/map', { replace: true });
  }, [save, playable]);
  if (!save || !playable) return null;
  return <FinalBattle />;
}

function FinalBattle() {
  const setFacts = useMultiplication((s) => s.setFacts);
  const winWave = useMultiplication((s) => s.winWave);
  const finishLevel = useMultiplication((s) => s.finishLevel);
  const wavesWon = useMultiplication((s) => s.save!.adventure.final.wavesWon);
  const timeLimit = useTimeLimit();
  const session = useMemo(() => {
    const save = useMultiplication.getState().save!;
    const replay = save.adventure.levels[finalLevel.id]?.status === 'completed';
    return createFinalSession(save.facts, config, createRng(), timeLimit, { replay });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [overlay, setOverlay] = useState<Overlay>('intro');
  const [battle, setBattle] = useState<BattleState>(session.battle!);
  const [kidPose, setKidPose] = useState<KidPose>('idle');
  const [monsterState, setMonsterState] = useState<MonsterState>('enter');
  const [hitKey, setHitKey] = useState(0);
  const [gateOpen, setGateOpen] = useState(false);
  const [progress, setProgress] = useState(() => session.progress());
  const timer = useRef<ReturnType<typeof setTimeout>>();

  const settle = (ms: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setKidPose('idle');
      setMonsterState((s) => (s === 'flee' ? s : 'idle'));
    }, ms);
  };

  const onAnswer = (r: AnswerResult) => {
    setFacts(session.facts);
    setProgress(session.progress());
    if (r.battle) setBattle(r.battle);
    if (r.correct) {
      playSound('punch');
      playSound('ding', r.combo);
      haptics.play('success');
      setKidPose('attack');
      setMonsterState('hit');
      setHitKey((k) => k + 1);
    } else {
      playSound('growl');
      playSound('bonk');
      haptics.play('error');
      setKidPose('stumble');
      setMonsterState('lunge');
    }
    settle(500);

    if (r.finalComplete) {
      clearTimeout(timer.current);
      const summary = session.summary();
      finishLevel(finalLevel.id, summary.stars, summary.accuracy);
      setMonsterState('flee');
      setTimeout(() => {
        setGateOpen(true);
        setKidPose('cheer');
        playSound('victory');
        haptics.play('celebrate');
        fireworks(6);
        celebrate(2200);
        setTimeout(() => setOverlay('victory'), 1800);
      }, 1000);
    } else if (r.battle?.status === 'won') {
      clearTimeout(timer.current);
      setMonsterState('flee');
      setKidPose('cheer');
      winWave();
      playSound('waveWon');
      celebrate(900);
      setTimeout(() => setOverlay('won'), 900);
    } else if (r.battle?.status === 'lost') {
      playSound('waveLost');
      setTimeout(() => setOverlay('lost'), 700);
    }
  };

  const loop = useGameLoop({
    session,
    config,
    autoStart: false,
    onAnswer,
    onAfterFeedback: (r) => (r.finalComplete ? 'done' : r.battle && r.battle.status !== 'fighting' ? 'pause' : 'continue'),
  });

  const startWave = (fresh: boolean) => {
    if (fresh) {
      setBattle(session.nextWave());
      setMonsterState('enter');
      setKidPose('idle');
    }
    setOverlay(null);
    loop.start();
  };

  const waveNumber = wavesWon + (overlay === 'won' ? 0 : 1);

  return (
    <PlayView
      loop={loop}
      config={config}
      timeLimitMs={session.timeLimitMs}
      onQuit={() => navigate('/mult/map')}
      header={
        <div>
          <div className="mb-1 flex justify-between text-sm font-black text-slate-500">
            <span>{t('final.wave', { n: waveNumber })}</span>
            <span data-testid="final-progress">{t('final.completed', { done: progress.done, total: progress.total })}</span>
          </div>
          <ProgressBar value={progress.total ? progress.done / progress.total : 0} color="bg-violet-500" />
        </div>
      }
      scene={
        <div className="relative h-full w-full">
          <BattleScene
            distance={battle.distance}
            kidPose={kidPose}
            monsterState={monsterState}
            monsterVariant={wavesWon}
            boss={battle.isBoss}
            hitKey={hitKey}
            gateOpen={gateOpen}
          />
          <div className="absolute inset-x-3 top-2 flex items-center gap-2">
            <span className="text-lg" aria-hidden="true">🧒</span>
            <div className="h-3 flex-1 overflow-hidden rounded-full bg-white/70" role="meter" aria-valuenow={battle.distance} aria-valuemin={0} aria-valuemax={100}>
              <div className="h-full rounded-full bg-linear-to-r from-rose-400 via-amber-400 to-emerald-500 transition-all duration-300" style={{ width: `${battle.distance}%` }} />
            </div>
            <span className="text-lg" aria-hidden="true">🏫</span>
          </div>
          {battle.isBoss && overlay === null && (
            <div className="absolute left-1/2 top-7 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-sm font-black text-white">{t('final.boss')}</div>
          )}
        </div>
      }
    >
      <Modal open={overlay === 'intro'} labelledBy="fi-title">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex items-end gap-4">
            <Kid pose="idle" size={60} />
            <Monster variant={wavesWon} boss={battle.isBoss} size={90} />
          </div>
          <h2 id="fi-title" className="text-3xl font-black text-violet-700">
            {t('final.title')}
          </h2>
          <p className="text-lg font-bold">{battle.isBoss ? t('final.boss') : t('final.intro')}</p>
          <p className="font-bold text-slate-500">{t('final.completed', { done: progress.done, total: progress.total })}</p>
          <Button size="lg" variant="success" className="w-full" onClick={() => startWave(false)} data-testid="final-start">
            ⚔️ {t('final.wave', { n: waveNumber })}
          </Button>
        </div>
      </Modal>
      <Modal open={overlay === 'won'} labelledBy="fw-title">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 id="fw-title" className="text-3xl font-black text-emerald-600">
            🎉 {t('final.waveWon')}
          </h2>
          <p className="text-lg font-bold">{t('final.completed', { done: progress.done, total: progress.total })}</p>
          <Button size="lg" variant="success" className="w-full" onClick={() => startWave(true)} data-testid="next-wave">
            ⚔️ {t('final.nextWave')}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/mult/map')}>
            🗺️ {t('common.backToMap')}
          </Button>
        </div>
      </Modal>
      <Modal open={overlay === 'lost'} labelledBy="fl-title">
        <div className="flex flex-col items-center gap-3 text-center">
          <Kid pose="idle" size={60} />
          <h2 id="fl-title" className="text-3xl font-black text-amber-600">
            💪 {t('final.waveLost')}
          </h2>
          <p className="text-lg font-bold">{t('final.progressKept')}</p>
          <Button size="lg" variant="warning" className="w-full" onClick={() => startWave(true)} data-testid="retry-wave">
            🔁 {t('final.retry')}
          </Button>
          <Button variant="secondary" className="w-full" onClick={() => navigate('/mult/map')}>
            🗺️ {t('common.backToMap')}
          </Button>
        </div>
      </Modal>
      <Modal open={overlay === 'victory'} labelledBy="fv-title">
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 id="fv-title" className="text-4xl font-black text-emerald-600">
            🏫 {t('final.victory')}
          </h2>
          <Kid pose="cheer" size={80} />
          <Button size="lg" variant="success" className="w-full" onClick={() => navigate('/mult/school')} data-testid="enter-school">
            🚪 {t('final.enterSchool')}
          </Button>
        </div>
      </Modal>
    </PlayView>
  );
}
