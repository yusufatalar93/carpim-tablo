import { MotionConfig } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../i18n';
import { FinalScreen } from '../games/multiplication/screens/FinalScreen';
import { LevelScreen } from '../games/multiplication/screens/LevelScreen';
import { MapScreen } from '../games/multiplication/screens/MapScreen';
import { MenuScreen } from '../games/multiplication/screens/MenuScreen';
import { PracticeScreen } from '../games/multiplication/screens/PracticeScreen';
import { SchoolScreen } from '../games/multiplication/screens/SchoolScreen';
import { SummaryScreen } from '../games/multiplication/screens/SummaryScreen';
import { flushSave, useMultiplication } from '../games/multiplication/store';
import { installAudioUnlock, isDev, sound, systemPrefersReducedMotion } from '../platform';
import { setEffectsReduced } from '../ui/effects';
import { DebugPanel } from './DebugPanel';
import { HubScreen } from './HubScreen';
import { OnboardingScreen } from './OnboardingScreen';
import { useProfile } from './profile';
import { navigate, useRoute, type Route } from './router';
import { SettingsScreen } from './SettingsScreen';

function useBoot(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    installAudioUnlock();
    const onHide = () => document.visibilityState === 'hidden' && flushSave();
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushSave);
    void (async () => {
      const profiles = await useProfile.getState().load();
      await useMultiplication.getState().load(profiles.activeId);
      if (!profiles.onboarded) navigate('/onboarding', { replace: true });
      setReady(true);
    })();
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushSave);
    };
  }, []);
  return ready;
}

/** Applies settings that live outside React (audio engine, reduced motion). */
function useSettingsEffects(): boolean {
  const settings = useMultiplication((s) => s.save?.settings);
  const reduce = (settings?.reduceMotion ?? false) || systemPrefersReducedMotion();
  useEffect(() => {
    sound.enabled = settings?.soundOn ?? true;
  }, [settings?.soundOn]);
  useEffect(() => {
    setEffectsReduced(reduce);
    document.documentElement.classList.toggle('reduce-motion', reduce);
  }, [reduce]);
  return reduce;
}

function renderRoute(route: Route) {
  switch (route.name) {
    case 'onboarding':
      return <OnboardingScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'mult-menu':
      return <MenuScreen />;
    case 'mult-map':
      return <MapScreen />;
    case 'mult-level':
      return <LevelScreen key={route.levelId} levelId={route.levelId} />;
    case 'mult-final':
      return <FinalScreen />;
    case 'mult-school':
      return <SchoolScreen />;
    case 'mult-practice':
      return <PracticeScreen key={route.facts?.join(',') ?? 'default'} presetFacts={route.facts} />;
    case 'mult-summary':
      return <SummaryScreen />;
    default:
      return <HubScreen />;
  }
}

export function App() {
  const ready = useBoot();
  const route = useRoute();
  const reduce = useSettingsEffects();
  if (!ready) {
    return <div className="flex h-full items-center justify-center text-2xl font-black text-sky-500">{t('app.loading')}</div>;
  }
  return (
    <MotionConfig reducedMotion={reduce ? 'always' : 'never'}>
      <main className="h-full">{renderRoute(route)}</main>
      {isDev && <DebugPanel />}
    </MotionConfig>
  );
}
