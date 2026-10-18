import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { t } from '../../../i18n';
import { useActiveProfile } from '../../../app/profile';
import { navigate } from '../../../app/router';
import { Button } from '../../../ui/Button';
import { fireworks } from '../../../ui/effects';
import { StarIcon } from '../../../ui/Stars';
import { Kid } from '../components/Kid';
import { Person } from '../components/Person';
import { SchoolBuilding, Tree } from '../components/StopArt';
import { finalLevel } from '../data';
import { totalStars } from '../engine';
import { playSound } from '../sounds';
import { useMultiplication } from '../store';

/** Ending: the kid enters the school garden, then the certificate. */
export function SchoolScreen() {
  const save = useMultiplication((s) => s.save);
  const profile = useActiveProfile();
  const [showCert, setShowCert] = useState(false);
  const done = save?.adventure.levels[finalLevel.id]?.status === 'completed';

  useEffect(() => {
    if (save && !done) navigate('/mult/map', { replace: true });
  }, [save, done]);

  useEffect(() => {
    if (!done) return;
    const id = setTimeout(() => {
      fireworks(5);
      playSound('firework');
    }, 1800);
    return () => clearTimeout(id);
  }, [done]);

  if (!save || !done) return null;

  if (showCert) {
    const completedAt = save.adventure.final.completedAt ?? Date.now();
    return (
      <div className="safe-pad mx-auto flex h-full w-full max-w-[560px] flex-col items-center justify-center gap-4 overflow-y-auto">
        <Certificate
          name={profile?.name || t('school.defaultName')}
          date={new Date(completedAt).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
          stars={totalStars(save.adventure)}
        />
        <p className="text-center text-sm font-bold text-slate-500">{t('school.screenshotHint')}</p>
        <div className="flex w-full max-w-sm flex-col gap-2">
          <Button variant="secondary" onClick={() => setShowCert(false)}>
            🏫 {t('common.back')}
          </Button>
          <Button onClick={() => navigate('/mult')}>{t('common.menu')}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-full w-full max-w-[560px] flex-col">
      <div className="relative min-h-0 flex-1">
        <svg viewBox="0 0 400 520" preserveAspectRatio="xMidYMax slice" className="h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="sc-sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#38bdf8" />
              <stop offset="1" stopColor="#bae6fd" />
            </linearGradient>
          </defs>
          <rect width="400" height="520" fill="url(#sc-sky)" />
          <circle cx="60" cy="60" r="26" fill="#fde047" />
          <path d="M-10 250 Q200 190 410 250 L410 520 L-10 520Z" fill="#4ade80" />
          <g transform="translate(200 250)">
            <SchoolBuilding />
          </g>
          <Tree x={30} y={260} s={1.3} apples />
          <Tree x={370} y={262} s={1.3} />
          {/* garden path */}
          <path d="M170 520 L190 254 L210 254 L230 520Z" fill="#fde68a" />
          {/* picnic blanket */}
          <g transform="translate(70 380)">
            <path d="M-50 0 L30 0 L50 40 L-30 40Z" fill="#f87171" />
            <path d="M-40 0 L-20 40 M-20 0 L0 40 M0 0 L20 40 M-46 13 L36 13 M-42 26 L42 26" stroke="#fff" strokeWidth="3" opacity="0.6" />
            <circle cx="0" cy="18" r="7" fill="#fbbf24" />
            <rect x="-24" y="14" width="10" height="12" rx="2" fill="#fff" />
          </g>
          <Person x={30} y={390} s={1.1} shirt="#a78bfa" wave />
          <Person x={110} y={400} s={1.1} shirt="#38bdf8" hair="#facc15" />
          {/* ball game */}
          <Person x={300} y={360} s={1.1} shirt="#fb923c" jump />
          <Person x={360} y={400} s={1.1} shirt="#34d399" hair="#7c2d12" jump />
          <motion.circle cx="330" r="9" fill="#fff" stroke="#ef4444" strokeWidth="3" animate={{ cy: [330, 290, 330], cx: [310, 345, 310] }} transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }} />
          <Person x={250} y={300} s={0.9} shirt="#f472b6" wave />
          <Person x={150} y={300} s={0.9} shirt="#facc15" hair="#1e293b" wave />
        </svg>
        <motion.div className="absolute bottom-[8%] left-1/2" initial={{ x: '-260%', y: 0 }} animate={{ x: '-50%' }} transition={{ duration: 2, ease: 'easeOut' }}>
          <Kid pose="cheer" size={90} />
        </motion.div>
      </div>
      <div className="safe-pad flex flex-col items-center gap-2 bg-cream text-center">
        <h1 className="text-3xl font-black text-emerald-600">{t('school.welcome')}</h1>
        <p className="text-lg font-bold">{t('school.friends')}</p>
        <Button size="lg" variant="warning" className="w-full max-w-sm" onClick={() => setShowCert(true)} data-testid="show-certificate">
          🏅 {t('school.showCertificate')}
        </Button>
        <p className="text-sm font-black text-violet-600">✨ {t('school.soon')}</p>
      </div>
    </div>
  );
}

function Certificate({ name, date, stars }: { name: string; date: string; stars: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, rotate: -3 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 180, damping: 14 }}
      className="relative w-full max-w-md rounded-[28px] border-[10px] border-double border-amber-500 bg-gradient-to-b from-amber-50 to-yellow-100 p-6 text-center shadow-2xl"
      data-testid="certificate"
    >
      <div className="absolute -top-6 left-1/2 flex h-12 w-12 -translate-x-1/2 items-center justify-center rounded-full bg-amber-400 text-2xl shadow">🏅</div>
      <p className="mt-2 text-sm font-black uppercase tracking-widest text-amber-700">{t('school.school')}</p>
      <h1 className="mt-1 text-3xl font-black leading-tight text-violet-700">{t('school.certificateTitle')}</h1>
      <div className="my-3 flex justify-center">
        <Kid pose="cheer" size={70} />
      </div>
      <p className="text-3xl font-black text-ink">{name}</p>
      <p className="mt-1 text-lg font-bold text-slate-600">{t('school.certifies')}</p>
      <div className="mt-4 flex items-center justify-around rounded-2xl bg-white/70 p-3">
        <div>
          <div className="text-xs font-bold text-slate-500">{t('school.date')}</div>
          <div className="font-black">{date}</div>
        </div>
        <div>
          <div className="text-xs font-bold text-slate-500">{t('school.stars')}</div>
          <div className="flex items-center justify-center gap-1 font-black">
            <StarIcon filled size={20} /> {stars}
          </div>
        </div>
      </div>
      <p className="mt-3 text-2xl tracking-widest text-amber-600" aria-hidden="true">
        1×1 · 2×2 · … · 10×10
      </p>
    </motion.div>
  );
}
