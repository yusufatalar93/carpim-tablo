import { motion, type Transition } from 'framer-motion';

export type KidPose = 'idle' | 'walk' | 'run' | 'hop' | 'stumble' | 'cheer' | 'attack' | 'wave';

interface Props {
  pose?: KidPose;
  size?: number;
  facing?: 'right' | 'left';
  className?: string;
}

const loop = (duration: number): Transition => ({ duration, repeat: Infinity, ease: 'easeInOut' });

/** The hero: an original kid with a backpack. Drawn facing right in a 100×140 box. */
export function Kid({ pose = 'idle', size = 80, facing = 'right', className = '' }: Props) {
  const walking = pose === 'walk' || pose === 'run';
  const speed = pose === 'run' ? 0.32 : 0.55;
  const fill = {};

  const body =
    pose === 'idle' || pose === 'wave'
      ? { animate: { y: [0, -2, 0] }, transition: loop(1.8) }
      : walking
        ? { animate: { y: [0, -4, 0] }, transition: loop(speed / 2) }
        : pose === 'hop'
          ? { animate: { y: [0, -22, 0] }, transition: { duration: 0.4, ease: 'easeOut' } as Transition }
          : pose === 'cheer'
            ? { animate: { y: [0, -16, 0] }, transition: loop(0.6) }
            : pose === 'stumble'
              ? { animate: { rotate: [0, -18, 6, 0], x: [0, -6, 2, 0] }, transition: { duration: 0.6 } as Transition }
              : { animate: { x: [0, 10, 0], rotate: [0, 8, 0] }, transition: { duration: 0.3 } as Transition };

  const legSwing = (dir: 1 | -1) =>
    walking ? { animate: { rotate: [20 * dir, -20 * dir, 20 * dir] }, transition: loop(speed) } : { animate: { rotate: 0 } };

  const frontArm =
    pose === 'cheer' || pose === 'hop'
      ? { animate: { rotate: -150 } }
      : pose === 'wave'
        ? { animate: { rotate: [-150, -120, -150] }, transition: loop(0.5) }
        : pose === 'attack'
          ? { animate: { rotate: [-20, -95, -20] }, transition: { duration: 0.3 } as Transition }
          : walking
            ? { animate: { rotate: [-25, 25, -25] }, transition: loop(speed) }
            : pose === 'stumble'
              ? { animate: { rotate: [-20, -120, -20] }, transition: { duration: 0.6 } as Transition }
              : { animate: { rotate: 0 } };

  return (
    <svg
      width={size}
      height={size * 1.4}
      viewBox="0 0 100 140"
      className={className}
      style={{ overflow: 'visible' }}
      aria-hidden="true"
    >
      <g transform={facing === 'left' ? 'translate(100 0) scale(-1 1)' : undefined}>
      <ellipse cx="50" cy="134" rx="26" ry="5" fill="#000" opacity="0.15" />
      <motion.g {...body} style={{ ...fill, originX: 0.5, originY: 1 }}>
        {/* back leg */}
        <motion.g {...legSwing(-1)} style={{ ...fill, originX: 0.5, originY: 0 }}>
          <rect x="40" y="98" width="10" height="28" rx="5" fill="#1e3a8a" />
          <ellipse cx="47" cy="128" rx="9" ry="5" fill="#be123c" />
        </motion.g>
        {/* back arm */}
        {pose === 'cheer' ? (
          <rect x="34" y="28" width="9" height="30" rx="4.5" fill="#fcd9b6" transform="rotate(20 38 58)" />
        ) : null}
        {/* backpack */}
        <rect x="20" y="56" width="24" height="40" rx="8" fill="#f97316" stroke="#c2410c" strokeWidth="2" />
        <rect x="23" y="74" width="16" height="14" rx="4" fill="#fdba74" stroke="#c2410c" strokeWidth="1.5" />
        <rect x="27" y="52" width="8" height="8" rx="3" fill="#c2410c" />
        {/* body */}
        <rect x="34" y="56" width="32" height="46" rx="12" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="2" />
        <path d="M40 62 L40 96" stroke="#c2410c" strokeWidth="4" strokeLinecap="round" />
        <path d="M44 78 h14" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
        {/* front leg */}
        <motion.g {...legSwing(1)} style={{ ...fill, originX: 0.5, originY: 0 }}>
          <rect x="52" y="98" width="10" height="28" rx="5" fill="#1e40af" />
          <ellipse cx="60" cy="128" rx="9" ry="5" fill="#e11d48" />
        </motion.g>
        {/* head */}
        <g>
          <circle cx="52" cy="34" r="22" fill="#fcd9b6" stroke="#e7b48f" strokeWidth="2" />
          <path d="M30 32 Q32 12 52 11 Q72 12 74 30 Q64 22 52 24 Q40 22 30 32Z" fill="#7c3f1d" />
          {/* cap */}
          <path d="M31 26 Q34 8 54 8 Q72 9 74 24 Z" fill="#facc15" stroke="#ca8a04" strokeWidth="2" />
          <path d="M66 22 Q80 21 86 25 Q76 28 66 27Z" fill="#eab308" stroke="#ca8a04" strokeWidth="1.5" />
          <circle cx="52" cy="10" r="3" fill="#ef4444" />
          {pose === 'stumble' ? (
            <>
              <path d="M54 30 l6 6 M60 30 l-6 6" stroke="#2b2d42" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M64 30 l6 6 M70 30 l-6 6" stroke="#2b2d42" strokeWidth="2.5" strokeLinecap="round" />
              <ellipse cx="63" cy="45" rx="4" ry="3" fill="#7f1d1d" />
            </>
          ) : (
            <>
              <ellipse cx="57" cy="33" rx="3" ry="4" fill="#2b2d42" />
              <ellipse cx="68" cy="33" rx="3" ry="4" fill="#2b2d42" />
              <circle cx="58" cy="31.5" r="1.1" fill="#fff" />
              <circle cx="69" cy="31.5" r="1.1" fill="#fff" />
              <path d={pose === 'cheer' || pose === 'hop' ? 'M56 42 Q63 51 71 42 Z' : 'M57 43 Q63 48 70 43'} stroke="#7f1d1d" strokeWidth="2.5" fill={pose === 'cheer' || pose === 'hop' ? '#7f1d1d' : 'none'} strokeLinecap="round" />
            </>
          )}
          <circle cx="50" cy="40" r="4" fill="#fda4af" opacity="0.7" />
          <circle cx="74" cy="40" r="3" fill="#fda4af" opacity="0.7" />
        </g>
        {/* front arm */}
        <motion.g {...frontArm} style={{ ...fill, originX: 0.5, originY: 0.1 }}>
          <rect x="54" y="60" width="10" height="30" rx="5" fill="#2563eb" />
          <circle cx="59" cy="92" r="6" fill="#fcd9b6" stroke="#e7b48f" strokeWidth="1.5" />
        </motion.g>
        {pose === 'stumble' && (
          <g fill="#facc15">
            <path d="M40 6 l2 4 4 .5-3 3 1 4-4-2-4 2 1-4-3-3 4-.5z" />
            <path d="M76 2 l1.5 3 3 .4-2.2 2.1.6 3-2.9-1.5-2.9 1.5.6-3-2.2-2.1 3-.4z" />
          </g>
        )}
      </motion.g>
      </g>
    </svg>
  );
}
