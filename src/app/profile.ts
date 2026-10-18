import { create } from 'zustand';
import { createId, storage } from '../platform';

/** A player. The data model supports several; the UI uses one active profile for now. */
export interface PlayerProfile {
  id: string;
  name?: string;
  createdAt: number;
}

export interface ProfilesData {
  activeId: string;
  profiles: PlayerProfile[];
  onboarded: boolean;
}

const KEY = 'profiles';

function sanitize(raw: unknown): ProfilesData | null {
  if (!raw || typeof raw !== 'object') return null;
  const d = raw as Partial<ProfilesData>;
  const profiles = Array.isArray(d.profiles)
    ? d.profiles.filter((p): p is PlayerProfile => !!p && typeof p.id === 'string' && typeof p.createdAt === 'number')
    : [];
  if (profiles.length === 0) return null;
  const activeId = profiles.some((p) => p.id === d.activeId) ? (d.activeId as string) : profiles[0].id;
  return { activeId, profiles, onboarded: d.onboarded === true };
}

interface ProfileState {
  data: ProfilesData | null;
  load(): Promise<ProfilesData>;
  setName(name: string | undefined): void;
  finishOnboarding(name: string | undefined): void;
}

export const useProfile = create<ProfileState>((set, get) => ({
  data: null,
  async load() {
    const loaded = sanitize(await storage.get(KEY));
    const data: ProfilesData =
      loaded ?? (() => {
        const p: PlayerProfile = { id: createId(), createdAt: Date.now() };
        return { activeId: p.id, profiles: [p], onboarded: false };
      })();
    set({ data });
    if (!loaded) await storage.set(KEY, data);
    return data;
  },
  setName(name) {
    const data = get().data;
    if (!data) return;
    const clean = name?.trim().slice(0, 24) || undefined;
    const next = { ...data, profiles: data.profiles.map((p) => (p.id === data.activeId ? { ...p, name: clean } : p)) };
    set({ data: next });
    void storage.set(KEY, next);
  },
  finishOnboarding(name) {
    get().setName(name);
    const data = get().data;
    if (!data) return;
    const next = { ...data, onboarded: true };
    set({ data: next });
    void storage.set(KEY, next);
  },
}));

export function useActiveProfile(): PlayerProfile | undefined {
  return useProfile((s) => s.data?.profiles.find((p) => p.id === s.data?.activeId));
}
