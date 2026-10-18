import { motion, type Transition } from 'framer-motion';

export type MonsterState = 'idle' | 'hit' | 'lunge' | 'flee' | 'enter';

const PALETTES = [
  { body: '#a78bfa', dark: '#7c3aed', belly: '#ddd6fe' },
  { body: '#4ade80', dark: '#16a34a', belly: '#bbf7d0' },
  { body: '#2dd4bf', dark: '#0d9488', belly: '#ccfbf1' },
  { body: '#fb923c', dark: '#ea580c', belly: '#fed7aa' },
  { body: '#f472b6', dark: '#db2777', belly: '#fbcfe8' },
];

interface Props {
  variant?: number;
  boss?: boolean;
  state?: MonsterState;
  size?: number;
}

/** Funny (not scary) original monster, facing left. 120×120 box. */
export function Monster({ variant = 0, boss = false, state = 'idle', size = 100 }: Props) {
  const p = boss ? { body: '#6366f1', dark: '#3730a3', belly: '#c7d2fe' } : PALETTES[variant % PALETTES.length];
  const fill = { originX: 0.5, originY: 1 };
  const anim: { animate: Record<string, number[] | number>; transition: Transition } =
    state === 'hit'
      ? { animate: { x: [0, 18, 0], rotate: [0, 12, 0], scaleY: [1, 0.85, 1] }, transition: { duration: 0.4 } }
      : state === 'lunge'
        ? { animate: { x: [0, -22, 0], scaleX: [1, 1.12, 1] }, transition: { duration: 0.35 } }
        : state === 'flee'
          ? { animate: { x: [0, 30, 400], y: [0, -20, -10], rotate: [0, 15, 25] }, transition: { duration: 1.1, ease: 'easeIn' } }
          : state === 'enter'
            ? { animate: { x: [200, 0], scale: [0.6, 1] }, transition: { duration: 0.6, ease: 'backOut' } }
            : { animate: { scaleY: [1, 0.95, 1], scaleX: [1, 1.03, 1] }, transition: { duration: 1.4, repeat: Infinity, ease: 'easeInOut' } };
  const scared = state === 'hit' || state === 'flee';

  return (
    <svg width={size} height={size} viewBox="0 0 120 120" style={{ overflow: 'visible' }} aria-hidden="true">
      <ellipse cx="60" cy="114" rx="38" ry="6" fill="#000" opacity="0.15" />
      <motion.g {...anim} style={fill}>
        {/* feet */}
        <ellipse cx="42" cy="108" rx="12" ry="7" fill={p.dark} />
        <ellipse cx="80" cy="108" rx="12" ry="7" fill={p.dark} />
        {/* horns */}
        <path d="M34 34 Q26 12 40 18 Q42 26 44 30Z" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        <path d="M86 34 Q94 12 80 18 Q78 26 76 30Z" fill="#fde68a" stroke="#d97706" strokeWidth="2" />
        {boss && (
          <path d="M40 22 L46 6 L54 18 L60 2 L66 18 L74 6 L80 22 Z" fill="#facc15" stroke="#b45309" strokeWidth="2" strokeLinejoin="round" />
        )}
        {/* body */}
        <path d="M20 70 Q18 28 60 26 Q102 28 100 70 Q100 106 60 106 Q20 106 20 70Z" fill={p.body} stroke={p.dark} strokeWidth="3" />
        {boss && (
          <g fill={p.dark}>
            <path d="M22 60 l-10 -4 8 10z" />
            <path d="M98 60 l10 -4 -8 10z" />
          </g>
        )}
        <ellipse cx="60" cy="80" rx="24" ry="20" fill={p.belly} />
        {/* spots */}
        <circle cx="32" cy="58" r="4" fill={p.dark} opacity="0.35" />
        <circle cx="90" cy="76" r="5" fill={p.dark} opacity="0.35" />
        {/* arms */}
        <motion.ellipse
          cx="20"
          cy="78"
          rx="7"
          ry="12"
          fill={p.body}
          stroke={p.dark}
          strokeWidth="2.5"
          animate={state === 'lunge' ? { rotate: -50 } : { rotate: [10, -10, 10] }}
          transition={state === 'lunge' ? { duration: 0.2 } : { duration: 1, repeat: Infinity }}
          style={{ originX: 0.5, originY: 0 }}
        />
        <ellipse cx="100" cy="78" rx="7" ry="12" fill={p.body} stroke={p.dark} strokeWidth="2.5" />
        {/* eyes */}
        {scared ? (
          <>
            <path d="M34 46 l10 8 M44 46 l-10 8" stroke="#2b2d42" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M58 46 l10 8 M68 46 l-10 8" stroke="#2b2d42" strokeWidth="3.5" strokeLinecap="round" />
            <path d="M88 36 q4 8 0 10 q-4 -2 0 -10z" fill="#7dd3fc" />
          </>
        ) : (
          <>
            <circle cx="40" cy="50" r="11" fill="#fff" stroke={p.dark} strokeWidth="2" />
            <circle cx="66" cy="48" r="13" fill="#fff" stroke={p.dark} strokeWidth="2" />
            <circle cx="36" cy="52" r="5" fill="#2b2d42" />
            <circle cx="61" cy="50" r="6" fill="#2b2d42" />
            <circle cx="34" cy="50" r="1.6" fill="#fff" />
            <circle cx="59" cy="48" r="2" fill="#fff" />
            {boss && <path d="M28 36 l20 6 M78 34 l-18 6" stroke="#2b2d42" strokeWidth="3.5" strokeLinecap="round" />}
          </>
        )}
        {/* mouth */}
        {state === 'lunge' ? (
          <g>
            <ellipse cx="50" cy="74" rx="14" ry="10" fill="#7f1d1d" />
            <path d="M40 67 l4 6 4 -6 4 6 4 -6" fill="#fff" />
          </g>
        ) : scared ? (
          <ellipse cx="50" cy="74" rx="7" ry="8" fill="#7f1d1d" />
        ) : (
          <g>
            <path d="M36 70 Q50 82 64 70" stroke="#7f1d1d" strokeWidth="3" fill="#7f1d1d" strokeLinejoin="round" />
            <path d="M42 72 l3 5 3 -4z M54 72 l3 4 3 -5z" fill="#fff" />
          </g>
        )}
      </motion.g>
    </svg>
  );
}
