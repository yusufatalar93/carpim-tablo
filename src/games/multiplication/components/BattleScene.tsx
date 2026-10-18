import { AnimatePresence, motion } from 'framer-motion';
import { Kid, type KidPose } from './Kid';
import { Monster, type MonsterState } from './Monster';
import { SchoolGate } from './StopArt';

interface Props {
  /** 0..100: distance between the kid and the monster. */
  distance: number;
  kidPose: KidPose;
  monsterState: MonsterState;
  monsterVariant: number;
  boss: boolean;
  hitKey: number;
  gateOpen?: boolean;
  showMonster?: boolean;
}

/** Final battle: kid on the left, monster guarding the school gate on the right. */
export function BattleScene({ distance, kidPose, monsterState, monsterVariant, boss, hitKey, gateOpen, showMonster = true }: Props) {
  // Action stays inside x≈55..345: the scene is cropped at the sides on narrow screens.
  const monsterX = 115 + (distance / 100) * 165;
  const size = boss ? 120 : 90;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="bt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={boss ? '#c4b5fd' : '#a5b4fc'} />
          <stop offset="1" stopColor="#e0e7ff" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#bt-sky)" />
      <path d="M-10 150 Q200 110 410 150 L410 200 L-10 200Z" fill="#86efac" />
      <rect x="0" y="168" width="400" height="32" fill="#4ade80" />
      <g transform="translate(330 170) scale(0.75)">
        <SchoolGate open={gateOpen} />
      </g>
      <path d="M0 170 h400" stroke="#d6b88a" strokeWidth="6" />
      <g transform="translate(58 92)">
        <Kid pose={kidPose} size={56} />
      </g>
      {showMonster && (
        <motion.g animate={{ x: monsterX }} transition={{ type: 'spring', stiffness: 90, damping: 14 }} initial={false}>
          <g transform={`translate(0 ${176 - size})`}>
            <Monster key={`${monsterVariant}-${boss}`} variant={monsterVariant} boss={boss} state={monsterState} size={size} />
          </g>
          <AnimatePresence>
            {hitKey > 0 && (
              <motion.g key={hitKey} initial={{ scale: 0.3, opacity: 1 }} animate={{ scale: 1.3, opacity: 0 }} transition={{ duration: 0.5 }} style={{ originX: 0.5, originY: 0.5 }}>
                <path d="M20 120 l8 -14 4 12 12 -10 -2 14 14 0 -12 8 10 10 -14 -2 0 14 -8 -12 -8 12 0 -14 -14 2 10 -10 -12 -8 14 0z" fill="#fde047" stroke="#f59e0b" strokeWidth="2" />
                <text x="34" y="128" textAnchor="middle" fontSize="12" fontWeight="900" fill="#b45309">POW!</text>
              </motion.g>
            )}
          </AnimatePresence>
        </motion.g>
      )}
    </svg>
  );
}
