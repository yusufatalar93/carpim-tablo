import { useSyncExternalStore } from 'react';

/** Minimal hash router: works on static hosting, in PWAs and inside Capacitor. */
export type Route =
  | { name: 'hub' }
  | { name: 'onboarding' }
  | { name: 'settings' }
  | { name: 'mult-menu' }
  | { name: 'mult-map' }
  | { name: 'mult-level'; levelId: string }
  | { name: 'mult-final' }
  | { name: 'mult-school' }
  | { name: 'mult-practice'; facts?: string[] }
  | { name: 'mult-summary' }
  | { name: 'debug' };

export function parseHash(hash: string): Route {
  const [path, query = ''] = hash.replace(/^#/, '').split('?');
  const parts = path.split('/').filter(Boolean);
  const params = new URLSearchParams(query);
  if (parts[0] === 'onboarding') return { name: 'onboarding' };
  if (parts[0] === 'settings') return { name: 'settings' };
  if (parts[0] === 'debug') return { name: 'debug' };
  if (parts[0] === 'mult') {
    switch (parts[1]) {
      case undefined:
        return { name: 'mult-menu' };
      case 'map':
        return { name: 'mult-map' };
      case 'level':
        return parts[2] ? { name: 'mult-level', levelId: parts[2] } : { name: 'mult-map' };
      case 'final':
        return { name: 'mult-final' };
      case 'school':
        return { name: 'mult-school' };
      case 'practice': {
        const facts = params.get('facts')?.split(',').filter(Boolean);
        return facts?.length ? { name: 'mult-practice', facts } : { name: 'mult-practice' };
      }
      case 'summary':
        return { name: 'mult-summary' };
    }
  }
  return { name: 'hub' };
}

function subscribe(cb: () => void): () => void {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

export function useRoute(): Route {
  const hash = useSyncExternalStore(subscribe, () => window.location.hash);
  return parseHash(hash);
}

export function navigate(path: string, opts: { replace?: boolean } = {}): void {
  const hash = path.startsWith('#') ? path : `#${path}`;
  if (opts.replace) {
    history.replaceState(null, '', hash);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = hash;
  }
}
