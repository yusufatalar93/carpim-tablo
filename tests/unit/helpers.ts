import { defaultConfig } from '../../src/games/multiplication/config';
import type { GameConfig } from '../../src/games/multiplication/engine';

export const cfg = (overrides: Partial<GameConfig> = {}): GameConfig => ({ ...defaultConfig, ...overrides });
