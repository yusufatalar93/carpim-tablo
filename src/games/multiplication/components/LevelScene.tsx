import { AnimatePresence, motion } from 'framer-motion';
import type { LevelDef } from '../engine';
import { Kid, type KidPose } from './Kid';
import { House, Pine, StopArt, Tree } from './StopArt';

interface Props {
  scene: LevelDef['scene'];
  /** 0..1 — the kid's position along the road. */
  progress: number;
  pose: KidPose;
  /** Increments on each wrong answer to pop an obstacle. */
  obstacleKey: number;
  /** Increments on each correct answer to sparkle. */
  sparkleKey: number;
  arrived: boolean;
}

/** Side-scrolling road: the kid walks towards the stop's village as facts are mastered. */
export function LevelScene({ scene, progress, pose, obstacleKey, sparkleKey, arrived }: Props) {
  // Keep the action inside x≈60..340: the scene is cropped at the sides on narrow screens.
  const x = 50 + Math.max(0, Math.min(1.15, progress)) * 200;
  return (
    <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true">
      <defs>
        <linearGradient id="lv-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#7dd3fc" />
          <stop offset="1" stopColor="#e0f2fe" />
        </linearGradient>
      </defs>
      <rect width="400" height="200" fill="url(#lv-sky)" />
      <circle cx="340" cy="38" r="18" fill="#fde047" />
      <motion.g animate={{ x: [0, 20, 0] }} transition={{ duration: 14, repeat: Infinity }} fill="#fff">
        <ellipse cx="90" cy="40" rx="26" ry="10" />
        <ellipse cx="108" cy="33" rx="16" ry="10" />
      </motion.g>
      <path d="M-10 140 Q80 90 170 130 Q260 80 410 130 L410 200 L-10 200Z" fill="#86efac" />
      <path d="M-10 160 Q120 130 220 150 Q320 135 410 155 L410 200 L-10 200Z" fill="#4ade80" />
      <Tree x={40} y={140} s={0.8} />
      <Pine x={150} y={140} s={0.7} />
      <Tree x={230} y={134} s={0.7} />
      {/* road */}
      <path d="M-10 178 L410 178" stroke="#d6b88a" strokeWidth="26" />
      <path d="M-10 178 L410 178" stroke="#fef3c7" strokeWidth="2" strokeDasharray="10 12" />
      {/* destination */}
      <g transform="translate(335 168) scale(0.75)">
        <StopArt scene={scene} />
      </g>
      <g transform="translate(288 170)">
        <rect x="-2" y="-34" width="4" height="34" fill="#92400e" />
        <rect x="-18" y="-40" width="36" height="16" rx="3" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
        <path d="M-10 -32 h20" stroke="#92400e" strokeWidth="2" />
      </g>
      {arrived && (
        <g>
          <House x={380} y={150} s={0.5} roof="#a855f7" />
          {[0, 1, 2].map((i) => (
            <motion.path
              key={i}
              d="M0 0 q4 -4 8 0 q4 -4 8 0"
              stroke="#334155"
              strokeWidth="2"
              fill="none"
              initial={{ x: 300 + i * 20, y: 80 }}
              animate={{ x: [300 + i * 20, 200 - i * 30], y: [80, 40 + i * 10] }}
              transition={{ duration: 3, delay: i * 0.3 }}
            />
          ))}
        </g>
      )}
      {/* obstacle on wrong answers */}
      <AnimatePresence>
        {obstacleKey > 0 && (
          <motion.g
            key={obstacleKey}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0, 1.1, 1, 1] }}
            transition={{ duration: 1.5, times: [0, 0.15, 0.8, 1] }}
            style={{ originX: 0.5, originY: 1 }}
          >
            {obstacleKey % 2 === 0 ? (
              <ellipse cx={x + 62} cy={182} rx="18" ry="5" fill="#60a5fa" opacity="0.8" />
            ) : (
              <path d={`M${x + 48} 182 q4 -16 14 -16 q10 0 14 16z`} fill="#94a3b8" stroke="#475569" strokeWidth="2" />
            )}
          </motion.g>
        )}
      </AnimatePresence>
      {/* kid */}
      <motion.g animate={{ x }} transition={{ type: 'spring', stiffness: 60, damping: 14 }} initial={false}>
        <g transform="translate(0 106)">
          <Kid pose={pose} size={54} />
        </g>
        <AnimatePresence>
          {sparkleKey > 0 && (
            <motion.g key={sparkleKey} initial={{ opacity: 1, scale: 0.4 }} animate={{ opacity: 0, scale: 1.6 }} transition={{ duration: 0.6 }} style={{ originX: 0.5, originY: 0.5 }}>
              {[0, 60, 120, 180, 240, 300].map((a) => (
                <path key={a} d="M0 -6 L1.5 -1.5 L6 0 L1.5 1.5 L0 6 L-1.5 1.5 L-6 0 L-1.5 -1.5Z" fill="#facc15" transform={`translate(${27 + Math.cos((a * Math.PI) / 180) * 30} ${135 + Math.sin((a * Math.PI) / 180) * 30})`} />
              ))}
            </motion.g>
          )}
        </AnimatePresence>
      </motion.g>
    </svg>
  );
}
