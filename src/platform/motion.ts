/** Whether the OS asks for reduced motion (prefers-reduced-motion). */
export function systemPrefersReducedMotion(): boolean {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
}
