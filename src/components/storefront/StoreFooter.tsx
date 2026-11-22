import React from 'react';
import { Globe, MapPin, MessageCircle } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { resolveSiteTheme } from '../../utils/themePresets';
import { buildGeneralWhatsAppUrl } from '../../utils/whatsapp';
import { InfoHubTab } from './InfoHubModal';

interface StoreFooterProps {
  onOpenTracking: () => void;
  onOpenInfoHub: (tab: InfoHubTab) => void;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({
  onOpenTracking,
  onOpenInfoHub,
}) => {
  const { settings, setCurrentView } = useTaba();
  const resolvedTheme = resolveSiteTheme(settings.theme);
  const websiteUrl =
    settings.socialLinks.websiteUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const logoSrc = settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg';

  return (
    <footer className={`${resolvedTheme.footerBg} text-white mt-12 no-print`}>
      <div className="mx-auto max-w-[1240px] px-4 sm:px-6 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        <div className="md:col-span-5 space-y-3">
          <div className="inline-block bg-white rounded-xl px-3 py-1.5">
            <img
              src={logoSrc}
              alt="شعار معرض طابا"
              referrerPolicy="no-referrer"
              className="h-12 w-auto object-contain"
            />
          </div>
          <p className="text-sm text-white/90 leading-relaxed max-w-md">
            {settings.storeTagline}
          </p>
          <div className="flex flex-wrap items-center gap-3 text-xs text-white/85">
            {settings.socialLinks.googleMapsUrl ? (
              <a
                href={settings.socialLinks.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 font-semibold hover:underline text-amber-200"
              >
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                <span>{settings.storeLocation || 'القناطر الخيرية'} (عرض على الخريطة)</span>
              </a>
            ) : (
              <span className="inline-flex items-center gap-1 font-semibold">
                <MapPin className="w-3.5 h-3.5 text-rose-300" />
                <span>{settings.storeLocation || 'القناطر الخيرية'}</span>
              </span>
            )}
            <span aria-hidden="true">·</span>
            <span>{settings.dailyOrderHours}</span>
          </div>
        </div>

        <div className="md:col-span-4 space-y-2.5 text-sm">
          <div className="font-bold text-white">عن طابا وخدمة العملاء</div>
          <ul className="space-y-2 text-white/85 text-xs sm:text-sm">
            <li>
              <button
                type="button"
                onClick={() => onOpenInfoHub('about')}
                className="hover:text-white hover:underline cursor-pointer"
              >
                من نحن (قصة معرض طابا منذ 2008)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenInfoHub('faq')}
                className="hover:text-white hover:underline cursor-pointer"
              >
                أبرز الأسئلة (الأسئلة الشائعة)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={onOpenTracking}
                className="hover:text-white hover:underline cursor-pointer"
              >
                متابعة طلب / تعديل أو إلغاء / طلباتي السابقة
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenInfoHub('returns')}
                className="hover:text-white hover:underline cursor-pointer"
              >
                الاستبدال والاسترجاع (تقديم طلب)
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenInfoHub('privacy')}
                className="hover:text-white hover:underline cursor-pointer"
              >
                سياسة الخصوصية
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => onOpenInfoHub('complaints')}
                className="hover:text-white hover:underline cursor-pointer"
              >
                الشكاوى والمقترحات
              </button>
            </li>
          </ul>
        </div>

        <div className="md:col-span-3 space-y-3">
          <div className="font-bold text-white text-sm">تواصل مباشر مع المعرض</div>
          <a
            href={buildGeneralWhatsAppUrl(undefined, settings.whatsappNumber)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#168b53] hover:bg-[#147a49] text-white text-xs sm:text-sm font-bold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            <span className="tabular-nums">واتساب طابا: {settings.whatsappNumber}</span>
          </a>

          {websiteUrl && (
            <div>
              <a
                href={websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-white/85 hover:text-white hover:underline"
              >
                <Globe className="w-3.5 h-3.5" />
                <span>رابط الموقع الإلكتروني</span>
              </a>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={settings.socialLinks.facebookUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#1877f2] hover:opacity-90 text-white text-xs font-bold"
            >
              فيسبوك
            </a>
            <a
              href={settings.socialLinks.messengerUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#0084ff] hover:opacity-90 text-white text-xs font-bold"
            >
              ماسنجر
            </a>
            <a
              href={settings.socialLinks.instagramUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] hover:opacity-90 text-white text-xs font-bold"
            >
              إنستجرام
            </a>
            <a
              href={settings.socialLinks.tiktokUrl || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded-full bg-[#111] border border-white/25 hover:opacity-90 text-white text-xs font-bold"
            >
              تيك توك
            </a>
            {settings.socialLinks.googleMapsUrl && (
              <a
                href={settings.socialLinks.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#d9273e] hover:opacity-90 text-white text-xs font-bold"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>موقعنا على الخريطة</span>
              </a>
            )}
          </div>

          {settings.theme.showAdminLinkToCustomers && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => setCurrentView('admin')}
                className="text-xs text-white/80 hover:text-white underline cursor-pointer"
              >
                الدخول إلى لوحة الإدارة (/admin)
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="border-t border-white/15 py-4 px-4 sm:px-6">
        <div className="mx-auto max-w-[1240px] flex flex-wrap items-center justify-between gap-2 text-xs text-white/75">
          <span>
            {settings.copy.footerMotto} · {settings.storeLocation || 'القناطر الخيرية'}
          </span>
          <span>
            {settings.copy.copyrightText} © {new Date().getFullYear()}
          </span>
        </div>
      </div>
    </footer>
  );
};
