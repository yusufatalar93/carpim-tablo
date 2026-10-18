import { motion } from 'framer-motion';

/** Simple villager / schoolmate figure, drawn standing at (0,0) feet. */
export function Person({ x = 0, y = 0, s = 1, shirt = '#f472b6', hair = '#422006', skin = '#f5c9a5', wave = false, jump = false }: {
  x?: number;
  y?: number;
  s?: number;
  shirt?: string;
  hair?: string;
  skin?: string;
  wave?: boolean;
  jump?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <motion.g animate={jump ? { y: [0, -10, 0] } : undefined} transition={{ duration: 0.6, repeat: Infinity, delay: (x % 5) * 0.1 }}>
        <rect x="-6" y="-14" width="5" height="14" rx="2.5" fill="#334155" />
        <rect x="1" y="-14" width="5" height="14" rx="2.5" fill="#334155" />
        <rect x="-9" y="-34" width="18" height="22" rx="7" fill={shirt} />
        <circle cx="0" cy="-42" r="9" fill={skin} />
        <path d="M-9 -44 Q0 -56 9 -44 Q4 -48 0 -47 Q-4 -48 -9 -44Z" fill={hair} />
        <circle cx="-3" cy="-42" r="1.3" fill="#2b2d42" />
        <circle cx="3" cy="-42" r="1.3" fill="#2b2d42" />
        <path d="M-3 -38 Q0 -35.5 3 -38" stroke="#7f1d1d" strokeWidth="1.3" fill="none" strokeLinecap="round" />
        <motion.rect
          x="7"
          y="-34"
          width="5"
          height="16"
          rx="2.5"
          fill={skin}
          animate={wave ? { rotate: [-150, -110, -150] } : { rotate: 0 }}
          transition={{ duration: 0.5, repeat: wave ? Infinity : 0 }}
          style={{ originX: 0.5, originY: 0 }}
        />
        <rect x="-12" y="-34" width="5" height="16" rx="2.5" fill={skin} />
      </motion.g>
    </g>
  );
}
