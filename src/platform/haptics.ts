/**
 * Light haptic feedback. Web: navigator.vibrate (Android Chrome; ignored on iOS Safari).
 * Mobile: replace with @capacitor/haptics (see docs/MOBILE.md).
 */
export type HapticKind = 'tap' | 'success' | 'error' | 'celebrate';

const PATTERNS: Record<HapticKind, number | number[]> = {
  tap: 8,
  success: 15,
  error: [30, 40, 30],
  celebrate: [20, 60, 20, 60, 40],
};

let enabled = true;

export const haptics = {
  setEnabled(on: boolean) {
    enabled = on;
  },
  play(kind: HapticKind) {
    if (!enabled) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(PATTERNS[kind]);
    } catch {
      /* ignore */
    }
  },
};
