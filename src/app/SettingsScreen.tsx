import { useState } from 'react';
import { t } from '../i18n';
import { config } from '../games/multiplication/config';
import { useMultiplication } from '../games/multiplication/store';
import type { Difficulty } from '../games/multiplication/engine';
import { HoldButton } from '../ui/HoldButton';
import { Screen } from '../ui/Screen';
import { Segmented, Toggle } from '../ui/Toggle';
import { useActiveProfile, useProfile } from './profile';

export function SettingsScreen() {
  const save = useMultiplication((s) => s.save);
  const setSettings = useMultiplication((s) => s.setSettings);
  const resetProgress = useMultiplication((s) => s.resetProgress);
  const profile = useActiveProfile();
  const setName = useProfile((s) => s.setName);
  const [name, setNameLocal] = useState(profile?.name ?? '');
  const [resetDone, setResetDone] = useState(false);
  if (!save) return null;
  const s = save.settings;
  const sec = (d: Difficulty) => `${t(`settings.${d}`)} · ${config.timeLimitsMs[d] / 1000} sn`;

  return (
    <Screen title={t('settings.title')} back="/">
      <div className="flex flex-col gap-4 pb-6">
        <label className="flex flex-col gap-2">
          <span className="text-lg font-bold text-slate-600">{t('settings.name')}</span>
          <input
            value={name}
            maxLength={24}
            onChange={(e) => setNameLocal(e.target.value)}
            onBlur={() => setName(name)}
            className="min-h-[56px] rounded-2xl border-4 border-sky-100 bg-white px-4 text-xl font-bold outline-none focus:border-sky-400"
          />
        </label>
        <Toggle label={`🔊 ${t('settings.sound')}`} checked={s.soundOn} onChange={(v) => setSettings({ soundOn: v })} />
        <Toggle label={`🐢 ${t('settings.reduceMotion')}`} checked={s.reduceMotion} onChange={(v) => setSettings({ reduceMotion: v })} />
        <div className="flex flex-col gap-2">
          <span className="text-lg font-bold text-slate-600">⏱️ {t('settings.difficulty')}</span>
          <Segmented<Difficulty>
            label={t('settings.difficulty')}
            value={s.difficulty}
            onChange={(v) => setSettings({ difficulty: v })}
            options={(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => ({ value: d, label: sec(d) }))}
          />
        </div>
        <div className="mt-6 flex flex-col gap-2">
          <span className="text-lg font-bold text-slate-600">{t('settings.reset')}</span>
          <HoldButton
            label={resetDone ? t('settings.resetDone') : t('settings.resetHold')}
            onConfirm={() => {
              resetProgress();
              setResetDone(true);
            }}
          />
        </div>
        <p className="mt-4 text-center text-sm text-slate-400">{t('settings.version', { v: __APP_VERSION__ })}</p>
      </div>
    </Screen>
  );
}
