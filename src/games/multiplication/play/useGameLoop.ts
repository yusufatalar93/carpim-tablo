import { useCallback, useEffect, useRef, useState } from 'react';
import type { AnswerResult, GameConfig, GameSession, Question } from '../engine';
import { playSound } from '../sounds';

export type Phase = 'idle' | 'countdown' | 'question' | 'feedback' | 'paused' | 'done';

/** What to do after the feedback of an answer has been shown. */
export type AfterAnswer = 'continue' | 'pause' | 'done';

interface Options {
  session: GameSession;
  config: GameConfig;
  /** Called right after an answer is evaluated (sounds, scene, persistence). */
  onAnswer?(result: AnswerResult): void;
  /** Called after the feedback delay; decides whether to keep going. Default: done if the session is complete. */
  onAfterFeedback?(result: AnswerResult): AfterAnswer;
  autoStart?: boolean;
}

const CORRECT_FEEDBACK_MS = 450;
const MAX_DIGITS = 3;

/**
 * Drives the question flow shared by all modes: 3-2-1 countdown, questions back-to-back,
 * per-question timer, keypad/keyboard input, and the wrong-answer reveal.
 */
export function useGameLoop({ session, config, onAnswer, onAfterFeedback, autoStart = true }: Options) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [count, setCount] = useState(config.countdownFrom);
  const [question, setQuestion] = useState<Question | null>(null);
  const [input, setInput] = useState('');
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [lastResult, setLastResult] = useState<AnswerResult | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const phaseRef = useRef<Phase>('idle');
  const inputRef = useRef('');
  const startRef = useRef<number | null>(null);
  const cbs = useRef({ onAnswer, onAfterFeedback });
  cbs.current = { onAnswer, onAfterFeedback };

  const setPhaseBoth = (p: Phase) => {
    phaseRef.current = p;
    setPhase(p);
  };
  const clearTimers = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  };
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));

  const ask = useCallback(() => {
    clearTimers();
    const q = session.nextQuestion();
    setQuestion(q);
    setInput('');
    inputRef.current = '';
    setLastResult(null);
    const now = performance.now();
    startRef.current = now;
    setStartedAt(now);
    setPhaseBoth('question');
    const limit = session.timeLimitMs;
    if (limit !== null) {
      for (let s = Math.ceil(config.urgentMs / 1000); s >= 1; s--) {
        const at = limit - s * 1000;
        if (at > 0) later(() => phaseRef.current === 'question' && playSound('tick'), at);
      }
      later(() => phaseRef.current === 'question' && evaluate(null), limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, config.urgentMs]);

  const evaluate = useCallback(
    (value: number | null) => {
      if (phaseRef.current !== 'question') return;
      clearTimers();
      const elapsed = Math.round(performance.now() - (startRef.current ?? performance.now()));
      const responseMs = value === null && session.timeLimitMs !== null ? session.timeLimitMs : elapsed;
      const result = session.answer(value, responseMs, Date.now());
      setLastResult(result);
      setStartedAt(null);
      setPhaseBoth('feedback');
      cbs.current.onAnswer?.(result);
      const delay = result.correct ? CORRECT_FEEDBACK_MS : config.wrongRevealMs;
      later(() => {
        const next = cbs.current.onAfterFeedback?.(result) ?? (session.isComplete ? 'done' : 'continue');
        if (next === 'continue') ask();
        else setPhaseBoth(next === 'pause' ? 'paused' : 'done');
      }, delay);
    },
    [session, config.wrongRevealMs, ask],
  );

  const start = useCallback(() => {
    clearTimers();
    setQuestion(null);
    setLastResult(null);
    if (config.countdownFrom <= 0) {
      ask();
      return;
    }
    setPhaseBoth('countdown');
    setCount(config.countdownFrom);
    playSound('countdown');
    for (let i = 1; i <= config.countdownFrom; i++) {
      later(() => {
        const n = config.countdownFrom - i;
        setCount(n);
        playSound(n === 0 ? 'go' : 'countdown');
      }, i * 700);
    }
    later(ask, config.countdownFrom * 700 + 450);
  }, [config.countdownFrom, ask]);

  const typeDigit = useCallback((d: number) => {
    if (phaseRef.current !== 'question' || inputRef.current.length >= MAX_DIGITS) return;
    const next = inputRef.current === '0' ? String(d) : inputRef.current + d;
    inputRef.current = next;
    setInput(next);
  }, []);

  const erase = useCallback(() => {
    if (phaseRef.current !== 'question') return;
    inputRef.current = inputRef.current.slice(0, -1);
    setInput(inputRef.current);
  }, []);

  const submit = useCallback(() => {
    if (phaseRef.current !== 'question' || inputRef.current === '') return;
    evaluate(Number(inputRef.current));
  }, [evaluate]);

  // Desktop keyboard: digits, Backspace, Enter.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (/^[0-9]$/.test(e.key)) typeDigit(Number(e.key));
      else if (e.key === 'Backspace') erase();
      else if (e.key === 'Enter') submit();
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [typeDigit, erase, submit]);

  useEffect(() => {
    if (autoStart) start();
    return clearTimers;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return { phase, count, question, input, startedAt, lastResult, start, typeDigit, erase, submit, resume: ask };
}
