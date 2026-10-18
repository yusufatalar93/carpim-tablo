import { motion } from 'framer-motion';

interface Props {
  count: number;
  max?: number;
  size?: number;
  /** Stagger-in animation (end-of-level screen). */
  animate?: boolean;
  onStar?: (index: number) => void;
}

export function StarIcon({ filled, size = 24 }: { filled: boolean; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z"
        fill={filled ? '#facc15' : '#e2e8f0'}
        stroke={filled ? '#ca8a04' : '#cbd5e1'}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function Stars({ count, max = 3, size = 24, animate, onStar }: Props) {
  return (
    <div className="flex items-center justify-center gap-1" role="img" aria-label={`${count} / ${max}`}>
      {Array.from({ length: max }, (_, i) =>
        animate ? (
          <motion.span
            key={i}
            initial={{ scale: 0, rotate: -90 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4 + i * 0.45, type: 'spring', stiffness: 260, damping: 12 }}
            onAnimationStart={() => i < count && onStar?.(i)}
          >
            <StarIcon filled={i < count} size={size} />
          </motion.span>
        ) : (
          <StarIcon key={i} filled={i < count} size={size} />
        ),
      )}
    </div>
  );
}
