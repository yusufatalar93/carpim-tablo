import { createDefaultStorage, type StorageAdapter } from './storage';

export * from './storage';
export * from './audio';
export * from './haptics';
export * from './motion';
export * from './id';

/** App-wide storage instance. Swap this for a Capacitor adapter on mobile. */
export const storage: StorageAdapter = createDefaultStorage();

export const isDev = import.meta.env.DEV;
