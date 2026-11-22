import React, { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Banner } from '../../types/taba';

interface BannerCarouselProps {
  onBannerAction: (banner: Banner) => void;
}

const TONE_CLASSES: Record<Banner['themeTone'], string> = {
  blue: 'bg-gradient-to-l from-[#0b347e] via-[#1554b9] to-[#2563eb] text-white',
  navy: 'bg-gradient-to-l from-[#0f172a] via-[#0b347e] to-[#1554b9] text-white',
  slate: 'bg-gradient-to-l from-[#0e3a8a] via-[#1650b8] to-[#3a72d8] text-white',
  crimson: 'bg-gradient-to-l from-[#9d1b29] via-[#d9273e] to-[#1554b9] text-white',
};

export const BannerCarousel: React.FC<BannerCarouselProps> = ({ onBannerAction }) => {
  const { banners } = useTaba();
  const [activeIndex, setActiveIndex] = useState(0);

  // Separate active non-expired banners cleanly into:
  // 1) Top wide carousel (.car)
  // 2) Two side-by-side promo banners underneath (.two) => 3 visual banner blocks!
  const { mainSlides, sideBanners } = useMemo(() => {
    const now = Date.now();
    const active = [...banners]
      .filter((b) => {
        if (!b.isActive) return false;
        if (b.isOfferBanner) {
          if (b.offerStartsAt && new Date(b.offerStartsAt).getTime() > now) return false;
          if (b.offerExpiresAt && new Date(b.offerExpiresAt).getTime() <= now) return false;
        }
        return true;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    if (active.length <= 2) {
      return { mainSlides: active, sideBanners: [] as Banner[] };
    }

    const side = active.slice(-2);
    const main = active.slice(0, active.length - 2);
    return { mainSlides: main, sideBanners: side };
  }, [banners]);

  const safeIndex = mainSlides.length > 0 ? activeIndex % mainSlides.length : 0;
  const currentMain = mainSlides[safeIndex];

  useEffect(() => {
    if (mainSlides.length <= 1 || !currentMain) return;
    const durationMs = Math.max(3, currentMain.slideDurationSec || 5) * 1000;
    const timer = window.setTimeout(() => {
      setActiveIndex((prev) => (prev + 1) % mainSlides.length);
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [mainSlides.length, currentMain, safeIndex]);

  if (!currentMain && sideBanners.length === 0) return null;

  const goPrev = () => {
    setActiveIndex((prev) => (prev - 1 + mainSlides.length) % mainSlides.length);
  };

  const goNext = () => {
    setActiveIndex((prev) => (prev + 1) % mainSlides.length);
  };

  return (
    <section aria-label="البانرات الإعلانية الثلاثة" className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-4">
      {/* Banner 1: Main Wide Carousel */}
      {currentMain && (
        <div className="relative rounded-[22px] overflow-hidden shadow-[0_12px_32px_rgba(20,45,90,0.12)] min-h-[225px] sm:min-h-[280px] flex items-center">
          {currentMain.imageUrl ? (
            <>
              <img
                src={currentMain.imageUrl}
                alt={currentMain.title}
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover object-left"
              />
              <div
                className={`absolute inset-0 ${
                  currentMain.themeTone === 'crimson'
                    ? 'bg-gradient-to-l from-[#9d1b29]/95 via-[#d9273e]/72 to-transparent'
                    : 'bg-gradient-to-l from-[#0b347e]/95 via-[#1554b9]/72 to-transparent'
                }`}
              />
            </>
          ) : (
            <div className={`absolute inset-0 ${TONE_CLASSES[currentMain.themeTone]}`}>
              <div
                aria-hidden="true"
                className="w-64 h-64 rounded-full bg-white/10 absolute -top-20 -left-16 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="w-48 h-48 rounded-full bg-[#d9273e]/25 absolute -bottom-16 left-20 pointer-events-none"
              />
            </div>
          )}

          <div className="relative z-10 w-full px-6 sm:px-12 py-8 sm:py-10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 text-white">
            <div className="max-w-xl">
              {currentMain.badgeText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#d9273e] text-xs font-extrabold text-white mb-2.5 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5 text-amber-200" />
                  <span>{currentMain.badgeText}</span>
                </div>
              )}
              <h1 className="text-2xl sm:text-4xl font-extrabold leading-tight text-balance drop-shadow-sm">
                {currentMain.title}
              </h1>
              <p className="mt-2.5 text-sm sm:text-base text-white/95 leading-relaxed max-w-lg drop-shadow-xs">
                {currentMain.subtitle}
              </p>
              <div className="mt-5">
                <button
                  type="button"
                  onClick={() => onBannerAction(currentMain)}
                  className="px-5 py-2.5 rounded-xl bg-white text-[#0b347e] hover:bg-slate-100 text-sm font-extrabold transition-colors whitespace-nowrap cursor-pointer shadow-md"
                >
                  {currentMain.ctaText}
                </button>
              </div>
            </div>

            {mainSlides.length > 1 && (
              <div className="flex items-center gap-2 self-end sm:self-center">
                <button
                  type="button"
                  onClick={goPrev}
                  aria-label="البانر السابق"
                  className="w-9 h-9 rounded-full bg-[#0e3a8a]/80 hover:bg-[#0e3a8a] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={goNext}
                  aria-label="البانر التالي"
                  className="w-9 h-9 rounded-full bg-[#0e3a8a]/80 hover:bg-[#0e3a8a] text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {mainSlides.length > 1 && (
            <div className="absolute bottom-3 inset-x-0 z-10 flex justify-center gap-1.5">
              {mainSlides.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setActiveIndex(idx)}
                  aria-label={`شريحة ${idx + 1}`}
                  className={`h-2.5 rounded-full transition-all cursor-pointer ${
                    idx === safeIndex
                      ? 'w-6 bg-[#d9273e]'
                      : 'w-2.5 bg-white/70 hover:bg-white'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Banners 2 & 3: Two Side-by-Side Banners directly below Banner 1 (.two layout) */}
      {sideBanners.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
          {sideBanners.map((ban) => (
            <div
              key={ban.id}
              onClick={() => onBannerAction(ban)}
              className="relative rounded-[18px] overflow-hidden min-h-[180px] sm:min-h-[210px] flex items-center p-6 sm:p-7 text-white shadow-[0_10px_26px_rgba(20,45,90,0.1)] cursor-pointer group transition-transform duration-200 hover:-translate-y-0.5"
            >
              {ban.imageUrl ? (
                <>
                  <img
                    src={ban.imageUrl}
                    alt={ban.title}
                    referrerPolicy="no-referrer"
                    className="absolute inset-0 w-full h-full object-cover object-left"
                  />
                  <div
                    className={`absolute inset-0 ${
                      ban.themeTone === 'crimson'
                        ? 'bg-gradient-to-l from-[#9d1b29]/95 via-[#d9273e]/75 to-transparent'
                        : 'bg-gradient-to-l from-[#0b347e]/95 via-[#1554b9]/78 to-transparent'
                    }`}
                  />
                </>
              ) : (
                <div className={`absolute inset-0 ${TONE_CLASSES[ban.themeTone]}`} />
              )}

              <div className="relative z-10 space-y-2 max-w-[75%] sm:max-w-[72%]">
                {ban.badgeText && (
                  <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#d9273e] text-[11px] font-bold text-white shadow-xs">
                    {ban.badgeText}
                    {ban.isOfferBanner && ban.offerExpiresAt && (
                      <span>
                        {' '}
                        · حتى{' '}
                        {new Date(ban.offerExpiresAt).toLocaleDateString('ar-EG', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </span>
                    )}
                  </div>
                )}
                <h2 className="text-xl sm:text-2xl font-extrabold leading-snug drop-shadow-sm">
                  {ban.title}
                </h2>
                <p className="text-xs sm:text-sm text-white/95 leading-relaxed drop-shadow-xs">
                  {ban.subtitle}
                </p>
                <div className="pt-1">
                  <span className="inline-block px-4 py-1.5 rounded-lg bg-white text-[#0b347e] group-hover:bg-slate-100 text-xs font-extrabold transition-colors shadow-sm">
                    {ban.ctaText}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
