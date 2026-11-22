import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, Award } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { resolveSiteTheme } from '../../utils/themePresets';

export const SPLASH_SEEN_KEY = 'taba_splash_seen_v2';

export const SplashOverlay: React.FC = () => {
  const { settings } = useTaba();
  const resolved = resolveSiteTheme(settings.theme);

  const [visible, setVisible] = useState<boolean>(() => {
    if (!settings.splashEnabled) return false;
    try {
      return sessionStorage.getItem(SPLASH_SEEN_KEY) !== '1';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    if (!settings.splashEnabled) {
      setVisible(false);
    }
  }, [settings.splashEnabled]);

  useEffect(() => {
    const handleForceOpen = () => {
      try {
        sessionStorage.removeItem(SPLASH_SEEN_KEY);
      } catch {
        // Ignore storage errors
      }
      setVisible(true);
    };
    window.addEventListener('taba-open-splash', handleForceOpen);
    return () => window.removeEventListener('taba-open-splash', handleForceOpen);
  }, []);

  const dismiss = () => {
    try {
      sessionStorage.setItem(SPLASH_SEEN_KEY, '1');
    } catch {
      // Ignore storage errors
    }
    setVisible(false);
  };

  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-label="ترحيب معرض طابا"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.04 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 text-center p-6 overflow-hidden text-white ${resolved.splashGradient}`}
        >
          {/* Ambient Animated Orbs */}
          <motion.div
            aria-hidden="true"
            animate={{ scale: [1, 1.12, 1], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
            className="w-[260px] h-[260px] rounded-full bg-white/15 absolute -top-16 -right-12 pointer-events-none"
          />
          <motion.div
            aria-hidden="true"
            animate={{ scale: [1, 1.15, 1], opacity: [0.25, 0.38, 0.25] }}
            transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
            className="w-[320px] h-[320px] rounded-full bg-[#d9273e]/30 absolute -bottom-24 -left-20 pointer-events-none"
          />

          {/* 18-Year Anniversary Kicker */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative z-10 inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-amber-200 tracking-wide"
          >
            <Award className="w-4 h-4 text-amber-300" />
            <span>18 عامًا من الثقة منذ 2008</span>
          </motion.div>

          {/* Centered Animated Official Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.72, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18, delay: 0.15 }}
            className="relative z-10"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
              className="bg-white rounded-[30px] px-8 py-4 shadow-[0_18px_55px_rgba(251,191,36,0.28)] ring-4 ring-amber-300/40"
            >
              <img
                src={settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg'}
                alt="شعار معرض طابا"
                referrerPolicy="no-referrer"
                className="h-24 sm:h-32 w-auto object-contain block"
              />
            </motion.div>
          </motion.div>

          {/* Animated Thank You Headline & 18-Year Message */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 mt-2 text-3xl sm:text-5xl font-extrabold tracking-tight text-balance"
          >
            {settings.splashTitle || 'شكرًا لثقتكم بنا'}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 text-base sm:text-xl text-white/95 max-w-lg leading-relaxed"
          >
            {settings.splashSubtitle ||
              'على مدار 18 عامًا منذ 2008 من الثقة.. ونعدكم دائمًا بالأفضل. طابا الأقرب ليك.'}
          </motion.p>

          {/* Animated Primary CTA Button: أكمل التسوق */}
          <motion.button
            type="button"
            onClick={dismiss}
            initial={{ opacity: 0, y: 20, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            transition={{ duration: 0.45, delay: 0.6 }}
            className="relative z-10 mt-4 inline-flex items-center gap-2.5 px-10 py-3.5 rounded-full bg-[#d9273e] hover:bg-[#b81f33] text-white text-lg font-extrabold shadow-[0_12px_28px_rgba(0,0,0,0.35)] cursor-pointer"
          >
            <span>{settings.splashButtonText || 'أكمل التسوق'}</span>
            <ArrowLeft className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
