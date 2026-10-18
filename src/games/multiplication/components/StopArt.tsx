import { motion } from 'framer-motion';
import type { LevelDef } from '../engine';

/** Original SVG illustrations for each map stop. Each draws around (0,0), roughly 120×90. */
export function StopArt({ scene, dim }: { scene: LevelDef['scene']; dim?: boolean }) {
  return <g opacity={dim ? 0.55 : 1}>{ART[scene]()}</g>;
}

export function House({ x = 0, y = 0, roof = '#ef4444', wall = '#fde68a', s = 1 }: { x?: number; y?: number; roof?: string; wall?: string; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-18" y="-22" width="36" height="26" rx="2" fill={wall} stroke="#92400e" strokeWidth="2" />
      <path d="M-24 -20 L0 -42 L24 -20 Z" fill={roof} stroke="#7f1d1d" strokeWidth="2" strokeLinejoin="round" />
      <rect x="-5" y="-10" width="10" height="14" rx="2" fill="#92400e" />
      <rect x="-14" y="-16" width="7" height="7" fill="#7dd3fc" stroke="#92400e" strokeWidth="1.5" />
      <rect x="7" y="-16" width="7" height="7" fill="#7dd3fc" stroke="#92400e" strokeWidth="1.5" />
    </g>
  );
}

export function Tree({ x = 0, y = 0, s = 1, apples = false }: { x?: number; y?: number; s?: number; apples?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-3" y="-12" width="6" height="14" rx="2" fill="#92400e" />
      <circle cx="0" cy="-22" r="14" fill="#22c55e" stroke="#15803d" strokeWidth="2" />
      <circle cx="-8" cy="-16" r="8" fill="#22c55e" />
      {apples && (
        <g fill="#ef4444">
          <circle cx="-6" cy="-26" r="2.6" />
          <circle cx="5" cy="-20" r="2.6" />
          <circle cx="2" cy="-30" r="2.6" />
          <circle cx="-8" cy="-16" r="2.6" />
        </g>
      )}
    </g>
  );
}

export function Pine({ x = 0, y = 0, s = 1 }: { x?: number; y?: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-2.5" y="-6" width="5" height="8" fill="#78350f" />
      <path d="M0 -40 L14 -18 L8 -18 L18 -4 L-18 -4 L-8 -18 L-14 -18 Z" fill="#16a34a" stroke="#166534" strokeWidth="2" strokeLinejoin="round" />
    </g>
  );
}

function Smoke() {
  return (
    <motion.g animate={{ y: [0, -6, 0], opacity: [0.7, 0.3, 0.7] }} transition={{ duration: 3, repeat: Infinity }}>
      <circle cx="12" cy="-50" r="4" fill="#e2e8f0" />
      <circle cx="16" cy="-58" r="5" fill="#e2e8f0" />
    </motion.g>
  );
}

const ART: Record<LevelDef['scene'], () => JSX.Element> = {
  home: () => (
    <g>
      <rect x="10" y="-44" width="6" height="14" fill="#7f1d1d" />
      <Smoke />
      <House roof="#ef4444" />
      <Tree x={-38} y={2} s={0.8} />
      <path d="M22 0 h30 M22 -8 h30 M26 2 v-14 M36 2 v-14 M46 2 v-14" stroke="#b45309" strokeWidth="2.5" strokeLinecap="round" />
    </g>
  ),
  mill: () => (
    <g>
      <path d="M-12 4 L-8 -40 L8 -40 L12 4 Z" fill="#fef3c7" stroke="#92400e" strokeWidth="2" />
      <rect x="-4" y="-10" width="8" height="14" rx="3" fill="#92400e" />
      <path d="M-11 -40 L0 -50 L11 -40Z" fill="#b91c1c" stroke="#7f1d1d" strokeWidth="2" />
      <motion.g animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}>
        {[0, 90, 180, 270].map((r) => (
          <g key={r} transform={`rotate(${r} 0 -38)`}>
            <rect x="-3" y="-74" width="6" height="36" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />
          </g>
        ))}
        <circle cx="0" cy="-38" r="4" fill="#64748b" />
      </motion.g>
      <House x={36} y={2} s={0.7} roof="#f59e0b" />
    </g>
  ),
  bridge: () => (
    <g>
      <path d="M-50 -2 Q0 -36 50 -2" fill="none" stroke="#92400e" strokeWidth="9" strokeLinecap="round" />
      <path d="M-50 -2 Q0 -36 50 -2" fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" strokeDasharray="6 4" />
      <path d="M-40 -8 v-16 M-20 -20 v-14 M0 -24 v-14 M20 -20 v-14 M40 -8 v-16" stroke="#92400e" strokeWidth="3" strokeLinecap="round" />
      <path d="M-40 -24 Q0 -50 40 -24" fill="none" stroke="#92400e" strokeWidth="3" />
      <House x={-62} y={6} s={0.55} roof="#8b5cf6" />
    </g>
  ),
  orchard: () => (
    <g>
      <Tree x={-30} y={4} apples />
      <Tree x={6} y={-4} s={1.1} apples />
      <Tree x={40} y={6} s={0.9} apples />
      <path d="M-20 10 l6 -8 h14 l6 8z" fill="#a16207" />
    </g>
  ),
  forest: () => (
    <g>
      <Pine x={-34} y={6} s={1.1} />
      <Pine x={-10} y={-2} s={1.3} />
      <Pine x={18} y={6} s={1} />
      <Pine x={40} y={0} s={1.2} />
      <circle cx="-22" cy="10" r="4" fill="#ef4444" />
      <rect x="-23" y="10" width="2" height="4" fill="#fef3c7" />
    </g>
  ),
  waterfall: () => (
    <g>
      <path d="M-50 4 L-40 -50 L-10 -60 L10 -56 L30 -40 L36 4 Z" fill="#94a3b8" stroke="#475569" strokeWidth="2" strokeLinejoin="round" />
      <rect x="-14" y="-54" width="18" height="58" fill="#60a5fa" />
      <motion.path d="M-12 -50 v54 M-5 -50 v54 M2 -50 v54" stroke="#e0f2fe" strokeWidth="2" strokeDasharray="6 6" animate={{ strokeDashoffset: [0, -24] }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} />
      <ellipse cx="-5" cy="6" rx="22" ry="6" fill="#93c5fd" />
      <House x={50} y={4} s={0.6} roof="#0ea5e9" />
    </g>
  ),
  pass: () => (
    <g>
      <path d="M-60 6 L-28 -50 L0 6 Z" fill="#78716c" stroke="#44403c" strokeWidth="2" strokeLinejoin="round" />
      <path d="M-28 -50 L-36 -36 L-28 -40 L-20 -36 Z" fill="#fff" />
      <path d="M-10 6 L26 -66 L62 6 Z" fill="#a8a29e" stroke="#57534e" strokeWidth="2" strokeLinejoin="round" />
      <path d="M26 -66 L16 -46 L26 -52 L36 -46 Z" fill="#fff" />
      <path d="M-20 6 q10 -10 20 0" stroke="#57534e" strokeWidth="2" fill="none" />
    </g>
  ),
  school: () => <SchoolGate />,
};

export function SchoolGate({ open = false }: { open?: boolean }) {
  return (
    <g>
      <rect x="-44" y="-56" width="12" height="60" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      <rect x="32" y="-56" width="12" height="60" fill="#b45309" stroke="#78350f" strokeWidth="2" />
      <path d="M-50 -56 Q0 -84 50 -56" fill="none" stroke="#78350f" strokeWidth="8" />
      <motion.g animate={{ scaleX: open ? 0.15 : 1 }} transition={{ duration: 1 }} style={{ originX: 0, originY: 0.5 }}>
        <rect x="-32" y="-50" width="32" height="54" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
        <path d="M-24 -46 v46 M-16 -46 v46 M-8 -46 v46" stroke="#92400e" strokeWidth="2" />
      </motion.g>
      <motion.g animate={{ scaleX: open ? 0.15 : 1 }} transition={{ duration: 1 }} style={{ originX: 1, originY: 0.5 }}>
        <rect x="0" y="-50" width="32" height="54" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
        <path d="M8 -46 v46 M16 -46 v46 M24 -46 v46" stroke="#92400e" strokeWidth="2" />
      </motion.g>
    </g>
  );
}

/** The Math School building on the hill (map top, ending scene). */
export function SchoolBuilding() {
  return (
    <g>
      <rect x="-90" y="-70" width="180" height="74" fill="#fde68a" stroke="#92400e" strokeWidth="3" />
      <path d="M-100 -68 L0 -120 L100 -68Z" fill="#dc2626" stroke="#7f1d1d" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="0" cy="-88" r="12" fill="#fff" stroke="#7f1d1d" strokeWidth="2.5" />
      <path d="M0 -88 v-8 M0 -88 h6" stroke="#2b2d42" strokeWidth="2" strokeLinecap="round" />
      <text x="0" y="-48" textAnchor="middle" fontSize="18" fontWeight="900" fill="#7c2d12">2×3=6</text>
      {[-70, -44, 30, 56].map((x) => (
        <rect key={x} x={x} y="-36" width="16" height="16" fill="#7dd3fc" stroke="#92400e" strokeWidth="2" />
      ))}
      <rect x="-12" y="-30" width="24" height="34" rx="3" fill="#92400e" />
      {/* flag */}
      <rect x="-1.5" y="-160" width="3" height="40" fill="#475569" />
      <motion.path d="M1.5 -160 q14 4 26 0 v16 q-12 4 -26 0z" fill="#22c55e" animate={{ skewY: [0, 6, 0] }} transition={{ duration: 1.6, repeat: Infinity }} />
    </g>
  );
}
