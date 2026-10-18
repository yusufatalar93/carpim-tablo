import { animate, motion } from 'framer-motion';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { t } from '../../../i18n';
import { haptics } from '../../../platform';
import { burst } from '../../../ui/effects';
import type { AdventureState, LevelDef, LevelStatus } from '../engine';
import { playSound } from '../sounds';
import { Kid, type KidPose } from './Kid';
import { Person } from './Person';
import { Pine, SchoolBuilding, StopArt, Tree } from './StopArt';

const W = 400;
const H = 2200;
const FIRST_Y = 2060;
const TOP_Y = 345;

/** Stop positions on the 400×2200 map, bottom (start) to top (school). Extra levels are interpolated. */
const ANCHORS: [number, number][] = [
  [200, 2060],
  [105, 1845],
  [290, 1630],
  [110, 1415],
  [290, 1200],
  [110, 985],
  [290, 770],
  [115, 560],
  [200, 345],
];

type Pt = { x: number; y: number };

function stopPositions(count: number): Pt[] {
  if (count <= ANCHORS.length) {
    // Use the first count-1 anchors plus the top anchor for the final stop.
    const base = ANCHORS.slice(0, count - 1).map(([x, y]) => ({ x, y }));
    return [...base, { x: ANCHORS[ANCHORS.length - 1][0], y: ANCHORS[ANCHORS.length - 1][1] }];
  }
  return Array.from({ length: count }, (_, i) => {
    const y = FIRST_Y - (i * (FIRST_Y - TOP_Y)) / (count - 1);
    const x = i === count - 1 ? 200 : i % 2 === 0 ? 290 : 110;
    return { x: i === 0 ? 200 : x, y };
  });
}

/** Catmull-Rom → cubic Bézier control points for segment i (P_i → P_{i+1}). */
function segment(pts: Pt[], i: number): [Pt, Pt, Pt, Pt] {
  const p0 = pts[Math.max(0, i - 1)];
  const p1 = pts[i];
  const p2 = pts[i + 1];
  const p3 = pts[Math.min(pts.length - 1, i + 2)];
  const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
  const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
  return [p1, c1, c2, p2];
}

function bezier([a, b, c, d]: [Pt, Pt, Pt, Pt], t: number): Pt {
  const u = 1 - t;
  return {
    x: u * u * u * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t * t * t * d.x,
    y: u * u * u * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t * t * t * d.y,
  };
}

interface Props {
  levels: readonly LevelDef[];
  adventure: AdventureState;
  /** Unlock + walk animation to play once. */
  walk: { from: string; to: string } | null;
  onWalkDone(): void;
  onSelect(level: LevelDef): void;
  reduceMotion: boolean;
}

/** Vertical adventure map: winding path from the home village up to the Math School. */
export function WorldMap({ levels, adventure, walk, onWalkDone, onSelect, reduceMotion }: Props) {
  const pts = useMemo(() => stopPositions(levels.length), [levels.length]);
  const pathD = useMemo(() => {
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const [, c1, c2, p2] = segment(pts, i);
      d += ` C${c1.x} ${c1.y} ${c2.x} ${c2.y} ${p2.x} ${p2.y}`;
    }
    return d;
  }, [pts]);

  const bridgeIndex = levels.findIndex((l) => l.scene === 'bridge');
  const bridge = bridgeIndex >= 0 ? pts[bridgeIndex] : null;
  const idx = (id: string) => Math.max(0, levels.findIndex((l) => l.id === id));
  const scrollRef = useRef<HTMLDivElement>(null);
  const startIdx = walk ? idx(walk.from) : idx(adventure.currentLevelId);
  const [kidPos, setKidPos] = useState<Pt>(pts[startIdx]);
  const [kidPose, setKidPose] = useState<KidPose>('idle');
  const [kidFacing, setKidFacing] = useState<'left' | 'right'>('right');
  const [lockedOverride, setLockedOverride] = useState<string | null>(walk?.to ?? null);
  const [unlocking, setUnlocking] = useState<string | null>(null);

  const scrollTo = (p: Pt, smooth: boolean) => {
    const el = scrollRef.current;
    if (!el) return;
    const scale = el.clientWidth / W;
    const top = p.y * scale - el.clientHeight * 0.55;
    el.scrollTo({ top: Math.max(0, top), behavior: smooth && !reduceMotion ? 'smooth' : 'auto' });
  };

  useLayoutEffect(() => {
    scrollTo(pts[startIdx], false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!walk) return;
    const from = idx(walk.from);
    const to = idx(walk.to);
    if (to !== from + 1) {
      setLockedOverride(null);
      setKidPos(pts[to]);
      onWalkDone();
      return;
    }
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const seg = segment(pts, from);
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setUnlocking(walk.to);
        playSound('unlock');
        haptics.play('success');
        const el = scrollRef.current;
        if (el) {
          const rect = el.getBoundingClientRect();
          const scale = el.clientWidth / W;
          burst((rect.left + pts[to].x * scale) / window.innerWidth, (rect.top + pts[to].y * scale - el.scrollTop) / window.innerHeight, 1.4);
        }
      }, 500),
    );
    timers.push(
      setTimeout(() => {
        if (cancelled) return;
        setLockedOverride(null);
        setUnlocking(null);
        scrollTo(pts[to], true);
        setKidFacing(pts[to].x >= pts[from].x ? 'right' : 'left');
        setKidPose('walk');
        const duration = reduceMotion ? 0.01 : 2.4;
        let lastStep = 0;
        const controls = animate(0, 1, {
          duration,
          ease: 'easeInOut',
          onUpdate: (v) => {
            setKidPos(bezier(seg, v));
            if (v - lastStep > 0.08) {
              lastStep = v;
              playSound('step');
            }
          },
          onComplete: () => {
            if (cancelled) return;
            setKidPose('wave');
            onWalkDone();
            timers.push(setTimeout(() => setKidPose('idle'), 1500));
          },
        });
        timers.push(setTimeout(() => controls.stop(), (duration + 1) * 1000));
      }, 1300),
    );
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [walk?.from, walk?.to]);

  const statusOf = (id: string): LevelStatus => (id === lockedOverride ? 'locked' : (adventure.levels[id]?.status ?? 'locked'));

  return (
    <div ref={scrollRef} className="relative h-full w-full overflow-y-auto overflow-x-hidden" data-testid="world-map">
      <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="group" aria-label={t('map.title')}>
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bae6fd" />
            <stop offset="1" stopColor="#e0f2fe" />
          </linearGradient>
          <linearGradient id="grass" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#bbf7d0" />
            <stop offset="0.5" stopColor="#86efac" />
            <stop offset="1" stopColor="#4ade80" />
          </linearGradient>
        </defs>
        <rect width={W} height={H} fill="url(#grass)" />
        <rect width={W} height="300" fill="url(#sky)" />
        {/* clouds */}
        <g fill="#fff" opacity="0.9">
          <motion.g animate={{ x: [0, 30, 0] }} transition={{ duration: 18, repeat: Infinity }}>
            <ellipse cx="70" cy="70" rx="34" ry="14" />
            <ellipse cx="92" cy="60" rx="22" ry="14" />
          </motion.g>
          <motion.g animate={{ x: [0, -24, 0] }} transition={{ duration: 22, repeat: Infinity }}>
            <ellipse cx="330" cy="110" rx="30" ry="12" />
            <ellipse cx="310" cy="102" rx="18" ry="11" />
          </motion.g>
        </g>
        {/* distant hill with the school */}
        <path d="M-20 300 Q200 150 420 300 L420 420 L-20 420Z" fill="#86efac" />
        <path d="M-20 340 Q100 270 220 330 Q320 290 420 340 L420 420 L-20 420Z" fill="#4ade80" opacity="0.6" />
        <g transform="translate(200 260)">
          <SchoolBuilding />
        </g>
        <text x="200" y="300" textAnchor="middle" fontSize="16" fontWeight="900" fill="#14532d">
          {t('map.school')}
        </text>
        {/* picnic + playing kids in the school garden */}
        <rect x="60" y="250" width="44" height="18" rx="3" fill="#f87171" opacity="0.85" transform="skewX(-20)" />
        <Person x={76} y={262} s={0.7} shirt="#a78bfa" />
        <Person x={98} y={262} s={0.7} shirt="#38bdf8" hair="#facc15" wave />
        <Person x={318} y={268} s={0.7} shirt="#fb923c" jump />
        <Person x={346} y={268} s={0.7} shirt="#34d399" hair="#7c2d12" jump />
        <circle cx="332" cy="250" r="5" fill="#fff" stroke="#ef4444" strokeWidth="2" />
        <Tree x={30} y={300} s={0.9} />
        <Tree x={372} y={300} s={0.9} />

        {/* river near the bridge stop */}
        {bridge && (
          <path
            d={`M-10 ${bridge.y + 10} C120 ${bridge.y + 30} 200 ${bridge.y - 90} 410 ${bridge.y - 120}`}
            stroke="#60a5fa"
            strokeWidth="34"
            fill="none"
            opacity="0.85"
          />
        )}
        {/* scattered trees and flowers */}
        {/* trees along the edges, clear of the stops and their labels */}
        {Array.from({ length: Math.floor((H - 520) / 110) }, (_, i) => {
          const x = i % 2 === 0 ? 20 : 380;
          const y = 460 + i * 110;
          return i % 3 === 0 ? <Pine key={i} x={x} y={y} s={0.9} /> : <Tree key={i} x={x} y={y} s={0.8} />;
        })}
        {Array.from({ length: 44 }, (_, i) => (
          <circle key={i} cx={(i * 97) % 390 + 5} cy={420 + ((i * 331) % (H - 460))} r="3" fill={['#f472b6', '#facc15', '#fff'][i % 3]} opacity="0.8" />
        ))}

        {/* path */}
        <path d={pathD} stroke="#a16207" strokeWidth="30" fill="none" strokeLinecap="round" opacity="0.35" />
        <path d={pathD} stroke="#fde68a" strokeWidth="22" fill="none" strokeLinecap="round" />
        <path d={pathD} stroke="#fef3c7" strokeWidth="4" fill="none" strokeDasharray="2 14" strokeLinecap="round" />

        {/* stops */}
        {levels.map((level, i) => {
          const p = pts[i];
          const status = statusOf(level.id);
          const progress = adventure.levels[level.id];
          const left = p.x < 200;
          const artX = level.isFinal ? p.x : p.x + (left ? -12 : 12);
          return (
            <g key={level.id}>
              <g transform={`translate(${artX} ${p.y - (level.isFinal ? 38 : 62)}) scale(${level.isFinal ? 0.9 : 0.75})`}>
                <StopArt scene={level.scene} dim={status === 'locked'} />
              </g>
              <StopMarker
                x={p.x}
                y={p.y}
                number={i + 1}
                level={level}
                status={status}
                stars={progress?.bestStars ?? 0}
                unlocking={unlocking === level.id}
                onSelect={() => onSelect(level)}
              />
            </g>
          );
        })}

        {/* kid */}
        <g transform={`translate(${kidPos.x - 22} ${kidPos.y - 84})`} pointerEvents="none" data-testid="map-kid">
          <Kid pose={kidPose} size={44} facing={kidFacing} />
        </g>
      </svg>
    </div>
  );
}

function StopMarker({
  x,
  y,
  number,
  level,
  status,
  stars,
  unlocking,
  onSelect,
}: {
  x: number;
  y: number;
  number: number;
  level: LevelDef;
  status: LevelStatus;
  stars: number;
  unlocking: boolean;
  onSelect(): void;
}) {
  const colors =
    status === 'completed'
      ? { fill: '#22c55e', stroke: '#15803d' }
      : status === 'unlocked'
        ? { fill: '#f59e0b', stroke: '#b45309' }
        : { fill: '#cbd5e1', stroke: '#94a3b8' };
  const name = t(`levels.${level.nameKey}`);
  const label = `${t('map.level', { n: number })}: ${name}. ${status === 'locked' ? t('map.locked') : status === 'completed' ? t('map.stars', { n: stars }) : t('map.play')}`;
  return (
    <g
      role="button"
      tabIndex={0}
      aria-label={label}
      data-testid={`stop-${level.id}`}
      data-status={status}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onSelect()}
      style={{ cursor: 'pointer', outline: 'none' }}
    >
      <circle cx={x} cy={y} r="40" fill="transparent" />
      <motion.g
        animate={status === 'unlocked' ? { scale: [1, 1.1, 1] } : { scale: 1 }}
        transition={status === 'unlocked' ? { duration: 1.2, repeat: Infinity } : undefined}
        style={{ originX: 0.5, originY: 0.5 }}
      >
        <circle cx={x} cy={y + 4} r="27" fill="#000" opacity="0.15" />
        <circle cx={x} cy={y} r="27" fill={colors.fill} stroke={colors.stroke} strokeWidth="5" />
        {status === 'locked' ? (
          <LockIcon x={x} y={y} />
        ) : level.isFinal ? (
          <text x={x} y={y + 9} textAnchor="middle" fontSize="26" aria-hidden="true">🏫</text>
        ) : (
          <text x={x} y={y + 10} textAnchor="middle" fontSize="28" fontWeight="900" fill="#fff" stroke={colors.stroke} strokeWidth="1">
            {number}
          </text>
        )}
      </motion.g>
      {unlocking && (
        <motion.g initial={{ y: 0, opacity: 1, rotate: 0 }} animate={{ y: -60, opacity: 0, rotate: 30 }} transition={{ duration: 0.8 }}>
          <LockIcon x={x} y={y} />
        </motion.g>
      )}
      <g>
        <rect x={x - 62} y={y + 32} width="124" height="24" rx="12" fill="#fff" opacity="0.92" />
        <text x={x} y={y + 49} textAnchor="middle" fontSize="14" fontWeight="800" fill="#2b2d42">
          {name}
        </text>
      </g>
      {status === 'completed' && (
        <g transform={`translate(${x - 33} ${y + 56})`}>
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${i * 22} 0)`}>
              <svg width="22" height="22" viewBox="0 0 24 24" overflow="visible">
                <StarIconPath filled={i < stars} />
              </svg>
            </g>
          ))}
        </g>
      )}
    </g>
  );
}

function StarIconPath({ filled }: { filled: boolean }) {
  return (
    <path
      d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
      fill={filled ? '#facc15' : '#e2e8f0'}
      stroke={filled ? '#ca8a04' : '#94a3b8'}
      strokeWidth="1.5"
    />
  );
}

function LockIcon({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`} aria-hidden="true">
      <path d="M-7 -4 v-5 a7 7 0 0 1 14 0 v5" stroke="#475569" strokeWidth="3.5" fill="none" />
      <rect x="-10" y="-4" width="20" height="15" rx="3" fill="#475569" />
      <circle cx="0" cy="3" r="2.5" fill="#cbd5e1" />
    </g>
  );
}

