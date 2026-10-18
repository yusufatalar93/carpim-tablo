import { useState } from 'react';
import { t } from '../i18n';
import { Kid } from '../games/multiplication/components/Kid';
import { Button } from '../ui/Button';
import { Screen } from '../ui/Screen';
import { useProfile } from './profile';
import { navigate } from './router';

/** First launch: ask the child's name (optional). */
export function OnboardingScreen() {
  const [name, setName] = useState('');
  const finish = useProfile((s) => s.finishOnboarding);
  const done = (n: string | undefined) => {
    finish(n);
    navigate('/', { replace: true });
  };
  return (
    <Screen className="items-center justify-center text-center">
      <Kid pose="wave" size={110} />
      <h1 className="mt-4 text-4xl font-black text-sky-600">{t('onboarding.title')}</h1>
      <label htmlFor="name" className="mt-2 text-2xl font-bold">
        {t('onboarding.question')}
      </label>
      <form
        className="mt-4 flex w-full max-w-sm flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          done(name);
        }}
      >
        <input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          autoComplete="off"
          placeholder={t('onboarding.placeholder')}
          className="min-h-[60px] rounded-2xl border-4 border-sky-200 bg-white px-4 text-center text-2xl font-bold outline-none focus:border-sky-400"
          data-testid="name-input"
        />
        <Button type="submit" size="lg" data-testid="onboarding-start">
          {t('onboarding.start')}
        </Button>
        <Button variant="ghost" onClick={() => done(undefined)} data-testid="onboarding-skip">
          {t('onboarding.skip')}
        </Button>
      </form>
    </Screen>
  );
}
