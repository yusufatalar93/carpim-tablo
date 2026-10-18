/**
 * Async key-value storage. The web build uses localStorage; on iOS/Android swap in a
 * Capacitor Preferences implementation (see docs/MOBILE.md). Only src/platform touches
 * browser storage APIs.
 */
export interface StorageAdapter {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
}

export class LocalStorageAdapter implements StorageAdapter {
  constructor(private readonly prefix = 'mg:') {}

  async get<T>(key: string): Promise<T | null> {
    try {
      const raw = window.localStorage.getItem(this.prefix + key);
      return raw === null ? null : (JSON.parse(raw) as T);
    } catch {
      return null; // unavailable storage or corrupt JSON → treat as empty
    }
  }

  async set<T>(key: string, value: T): Promise<void> {
    try {
      window.localStorage.setItem(this.prefix + key, JSON.stringify(value));
    } catch {
      // Quota exceeded / private mode: the game keeps running with in-memory state.
    }
  }

  async remove(key: string): Promise<void> {
    try {
      window.localStorage.removeItem(this.prefix + key);
    } catch {
      /* ignore */
    }
  }
}

/** In-memory adapter for tests and as a fallback. Values are deep-copied like real storage. */
export class MemoryStorageAdapter implements StorageAdapter {
  private data = new Map<string, string>();

  async get<T>(key: string): Promise<T | null> {
    const raw = this.data.get(key);
    return raw === undefined ? null : (JSON.parse(raw) as T);
  }

  async set<T>(key: string, value: T): Promise<void> {
    this.data.set(key, JSON.stringify(value));
  }

  async remove(key: string): Promise<void> {
    this.data.delete(key);
  }
}

function hasLocalStorage(): boolean {
  try {
    const k = '__mg_probe__';
    window.localStorage.setItem(k, '1');
    window.localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function createDefaultStorage(): StorageAdapter {
  return typeof window !== 'undefined' && hasLocalStorage() ? new LocalStorageAdapter() : new MemoryStorageAdapter();
}
