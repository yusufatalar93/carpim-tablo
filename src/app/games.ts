/**
 * Games shown on the Math Games hub. To add a game, add an entry here and its screens
 * under src/games/<id>/ (see docs/ADDING_A_GAME.md).
 */
export interface GameEntry {
  id: string;
  /** i18n key prefix: hub.games.<id>.title / .desc */
  i18nKey: string;
  emoji: string;
  route: string | null;
  color: string;
}

export const games: GameEntry[] = [
  { id: 'multiplication', i18nKey: 'hub.games.multiplication', emoji: '✖️', route: '/mult', color: 'from-sky-400 to-indigo-500' },
  { id: 'addition', i18nKey: 'hub.games.addition', emoji: '➕', route: null, color: 'from-slate-300 to-slate-400' },
  { id: 'clock', i18nKey: 'hub.games.clock', emoji: '⏰', route: null, color: 'from-slate-300 to-slate-400' },
  { id: 'fractions', i18nKey: 'hub.games.fractions', emoji: '🍰', route: null, color: 'from-slate-300 to-slate-400' },
];
