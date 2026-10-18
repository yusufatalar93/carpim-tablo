import { motion } from 'framer-motion';
import { t } from '../i18n';
import { Kid } from '../games/multiplication/components/Kid';
import { Screen } from '../ui/Screen';
import { games } from './games';
import { useActiveProfile } from './profile';
import { navigate } from './router';

/** Math Games home: pick a game. */
export function HubScreen() {
  const profile = useActiveProfile();
  return (
    <Screen>
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-4xl font-black text-sky-600">{t('app.title')}</h1>
          <p className="text-xl font-bold text-slate-600">{profile?.name ? t('hub.greeting', { name: profile.name }) : t('hub.greetingAnon')}</p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/settings')}
          aria-label={t('hub.settings')}
          className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-3xl shadow-sm active:scale-95"
        >
          ⚙️
        </button>
      </div>
      <div className="my-4 flex justify-center">
        <Kid pose="wave" size={90} />
      </div>
      <p className="mb-4 text-center text-lg font-bold text-slate-500">{t('app.tagline')}</p>
      <div className="grid grid-cols-2 gap-3">
        {games.map((g, i) => {
          const active = g.route !== null;
          return (
            <motion.button
              key={g.id}
              type="button"
              disabled={!active}
              onClick={() => g.route && navigate(g.route)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`relative flex min-h-[150px] flex-col items-start justify-end rounded-3xl bg-gradient-to-br p-4 text-left text-white shadow-lg ${g.color} ${active ? 'col-span-2 min-h-[170px] active:scale-[0.98]' : 'opacity-80'}`}
              data-testid={`game-${g.id}`}
            >
              <span className="absolute right-4 top-3 text-5xl" aria-hidden="true">{g.emoji}</span>
              {!active && <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-sm font-black text-slate-600">{t('hub.soon')}</span>}
              <span className={`font-black ${active ? 'text-3xl' : 'text-xl'}`}>{t(`${g.i18nKey}.title`)}</span>
              <span className="text-base font-bold opacity-90">{t(`${g.i18nKey}.desc`)}</span>
            </motion.button>
          );
        })}
      </div>
    </Screen>
  );
}
