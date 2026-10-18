import { AnimatePresence, motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  /** Bottom sheet on phones (default) or centered card. */
  variant?: 'sheet' | 'center';
  labelledBy?: string;
}

export function Modal({ open, onClose, children, variant = 'center', labelledBy }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-50 flex justify-center bg-ink/50 ${variant === 'sheet' ? 'items-end' : 'items-center p-4'}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            className={`w-full max-w-[520px] bg-cream shadow-2xl ${variant === 'sheet' ? 'rounded-t-[28px] px-5 pb-[max(var(--safe-bottom),20px)] pt-5' : 'rounded-[28px] p-5'}`}
            initial={variant === 'sheet' ? { y: 400 } : { scale: 0.85, opacity: 0 }}
            animate={variant === 'sheet' ? { y: 0 } : { scale: 1, opacity: 1 }}
            exit={variant === 'sheet' ? { y: 400 } : { scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
