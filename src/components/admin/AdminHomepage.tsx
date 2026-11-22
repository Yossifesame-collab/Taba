import React, { useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Eye,
  FileText,
  ImagePlus,
  Layout,
  Palette,
  Plus,
  RefreshCw,
  RotateCcw,
  Sliders,
  Sparkles,
  Star,
  Trash2,
  Upload,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { INITIAL_BANNERS, INITIAL_SETTINGS } from '../../data/tabaSeed';
import { Banner, SiteThemePreset } from '../../types/taba';
import { compressImageToWebP } from '../../utils/imageProcessor';
import { SPLASH_SEEN_KEY } from '../storefront/SplashOverlay';

const COLOR_PRESETS: Array<{
  id: SiteThemePreset;
  label: string;
  desc: string;
  primarySwatch: string;
  accentSwatch: string;
}> = [
  {
    id: 'royal-blue',
    label: 'أزرق طابا الملكي',
    desc: 'الهوية الرسمية: أزرق ملكي + أبيض + أحمر مساعد',
    primarySwatch: 'bg-[#0b347e]',
    accentSwatch: 'bg-[#d9273e]',
  },
  {
    id: 'deep-navy',
    label: 'كحلي داكن فاخر',
    desc: 'أزرق ليلي عميق بلمسة عصرية هادئة',
    primarySwatch: 'bg-[#081c45]',
    accentSwatch: 'bg-[#1554b9]',
  },
  {
    id: 'ocean-blue',
    label: 'أزرق سماوي مشرق',
    desc: 'درجات أزرق زاهية وخلفية ناصعة خفيفة',
    primarySwatch: 'bg-[#1554b9]',
    accentSwatch: 'bg-[#2563eb]',
  },
  {
    id: 'crimson-blue',
    label: 'طابا أزرق وقرمزي',
    desc: 'إبراز العروض باللون الأحمر القرمزي مع الأزرق',
    primarySwatch: 'bg-[#0b347e]',
    accentSwatch: 'bg-[#b81f33]',
  },
];

export const AdminHomepage: React.FC = () => {
  const {
    banners,
    categories,
    products,
    settings,
    saveBanner,
    addBanner,
    deleteBanner,
    moveBanner,
    renewBannerOfferThreeDays,
    moveCategory,
    saveProduct,
    updateSettings,
    setCurrentView,
  } = useTaba();

  const [subTab, setSubTab] = useState<'theme' | 'copy' | 'banners' | 'layout'>('theme');

  const sortedBanners = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
  const sortedCategories = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
  const [editingBanner, setEditingBanner] = useState<Banner | null>(null);
  const [showNewBannerForm, setShowNewBannerForm] = useState(false);

  // New Banner Form state
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newBadge, setNewBadge] = useState('');
  const [newCta, setNewCta] = useState('تسوق الآن');
  const [newDuration, setNewDuration] = useState(5);
  const [newTone, setNewTone] = useState<Banner['themeTone']>('blue');
  const [newTargetCat, setNewTargetCat] = useState('');
  const [newIsOffer, setNewIsOffer] = useState(false);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await compressImageToWebP(file, 800, 0.9);
    updateSettings({ brandLogoUrl: res.dataUrl });
  };

  const handleBannerImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editingBanner) return;
    const res = await compressImageToWebP(file, 1440, 0.84);
    setEditingBanner({ ...editingBanner, imageUrl: res.dataUrl });
  };

  const handleSaveBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;
    saveBanner(editingBanner);
    setEditingBanner(null);
  };

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const nowIso = new Date().toISOString();
    const expiryIso = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    addBanner({
      title: newTitle.trim(),
      subtitle: newSubtitle.trim(),
      badgeText: newBadge.trim() || undefined,
      ctaText: newCta.trim() || 'تسوق الآن',
      targetCategoryId: newTargetCat || undefined,
      slideDurationSec: newDuration,
      isOfferBanner: newIsOffer,
      offerStartsAt: newIsOffer ? nowIso : undefined,
      offerExpiresAt: newIsOffer ? expiryIso : undefined,
      isActive: true,
      themeTone: newTone,
    });
    setNewTitle('');
    setNewSubtitle('');
    setNewBadge('');
    setShowNewBannerForm(false);
  };

  const moveHomeSection = (index: number, dir: -1 | 1) => {
    const next = [...settings.homeSectionOrder];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    const tmp = next[index];
    next[index] = next[target];
    next[target] = tmp;
    updateSettings({ homeSectionOrder: next });
  };

  const handlePreviewSplashOnStore = () => {
    try {
      sessionStorage.removeItem(SPLASH_SEEN_KEY);
    } catch {
      // Ignore storage errors
    }
    setCurrentView('store');
    window.setTimeout(() => {
      window.dispatchEvent(new Event('taba-open-splash'));
    }, 80);
  };

  const sectionLabels: Record<'newest' | 'mostRequested' | 'featured', string> = {
    newest: 'أحدث المنتجات',
    mostRequested: 'الأكثر طلبًا',
    featured: 'ترشيحات طابا',
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            تخصيص شكل الموقع والصفحة الرئيسية والبانرات
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تحكم كامل في ألوان المتجر، شكل الهيدر والكروت، شاشة الترحيب الأنيميشن، نصوص «من نحن»، البانرات، وترتيب الأقسام.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setCurrentView('store')}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-200 bg-white hover:border-[#1D4ED8] text-xs sm:text-sm font-bold text-slate-800 cursor-pointer"
        >
          <Eye className="w-4 h-4 text-[#1D4ED8]" />
          <span>معاينة المتجر الآن</span>
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setSubTab('theme')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'theme'
              ? 'bg-[#1D4ED8] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Palette className="w-4 h-4" />
          <span>الشكل واللوجو وإظهار العناصر</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('copy')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'copy'
              ? 'bg-[#1D4ED8] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>كل نصوص الموقع والروابط</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('banners')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'banners'
              ? 'bg-[#1D4ED8] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <ImagePlus className="w-4 h-4" />
          <span>البانرات الإعلانية ({banners.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('layout')}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-bold cursor-pointer ${
            subTab === 'layout'
              ? 'bg-[#1D4ED8] text-white'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Layout className="w-4 h-4" />
          <span>ترتيب الأقسام والترشيحات</span>
        </button>
      </div>

      {/* TAB 1: SITE THEME, LOGO, VISIBILITY & STORE RULES */}
      {subTab === 'theme' && (
        <div className="space-y-6">
          {/* 1. Colors Palette & Logo */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">1. ألوان الموقع واللوجو الرسمي</h3>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    theme: INITIAL_SETTINGS.theme,
                    brandLogoUrl: INITIAL_SETTINGS.brandLogoUrl,
                  })
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1D4ED8] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة الشكل واللوجو الافتراضي</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {COLOR_PRESETS.map((preset) => {
                const active = settings.theme.colorPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() =>
                      updateSettings({
                        theme: { ...settings.theme, colorPreset: preset.id },
                      })
                    }
                    className={`rounded-xl border p-3.5 text-right space-y-2 transition-all cursor-pointer ${
                      active
                        ? 'border-[#1D4ED8] bg-blue-50/70 ring-1 ring-[#1D4ED8]'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-6 h-6 rounded-md ${preset.primarySwatch}`} />
                      <span className={`w-6 h-6 rounded-md ${preset.accentSwatch}`} />
                    </div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900">
                      {preset.label}
                    </div>
                    <div className="text-[11px] text-slate-500 leading-relaxed">{preset.desc}</div>
                  </button>
                );
              })}
            </div>

            {/* Brand Logo Manager */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-2">
                  <img
                    src={settings.brandLogoUrl || INITIAL_SETTINGS.brandLogoUrl}
                    alt="لوجو معرض طابا"
                    className="h-12 w-auto object-contain"
                  />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    شعار الموقع (اللوجو)
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    يظهر في شاشة الترحيب والهيدر والفوتر ولوحة الإدارة. يمكنك رفعه بصيغة WebP أو استعادة شعار طابا الأصلي.
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-200 hover:border-[#1D4ED8] text-xs font-bold text-slate-800 cursor-pointer">
                  <Upload className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>تغيير اللوجو (رفع صورة)</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
                {settings.brandLogoUrl !== INITIAL_SETTINGS.brandLogoUrl && (
                  <button
                    type="button"
                    onClick={() => updateSettings({ brandLogoUrl: INITIAL_SETTINGS.brandLogoUrl })}
                    className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:text-[#1D4ED8] cursor-pointer"
                  >
                    استعادة اللوجو الرسمي لطابا
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* 2. Header, Corners & Product Grid */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              2. شكل الهيدر وحواف الكروت وتوزيع المنتجات
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  تصميم الهيدر واللوجو
                </label>
                <select
                  value={settings.theme.headerStyle}
                  onChange={(e) =>
                    updateSettings({
                      theme: {
                        ...settings.theme,
                        headerStyle: e.target.value as 'curved-arch' | 'compact-bar',
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="curved-arch">لوجو مقوّس متدلٍ بالمنتصف (الكلاسيكي)</option>
                  <option value="compact-bar">إطار مدمج أنيق بالمنتصف</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  انحناء حواف الكروت والأزرار
                </label>
                <select
                  value={settings.theme.cardRadius}
                  onChange={(e) =>
                    updateSettings({
                      theme: {
                        ...settings.theme,
                        cardRadius: e.target.value as 'soft' | 'rounded' | 'sharp',
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="soft">حواف ناعمة متوازنة (افتراضي)</option>
                  <option value="rounded">حواف دائرية عصرية</option>
                  <option value="sharp">حواف كلاسيكية حادة</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  عدد المنتجات في الصف (كمبيوتر)
                </label>
                <select
                  value={settings.theme.desktopColumns}
                  onChange={(e) =>
                    updateSettings({
                      theme: {
                        ...settings.theme,
                        desktopColumns: Number(e.target.value) as 3 | 4 | 5,
                      },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
                >
                  <option value={3}>3 منتجات في الصف (كبير وواضح)</option>
                  <option value={4}>4 منتجات في الصف (متوازن - افتراضي)</option>
                  <option value={5}>5 منتجات في الصف (مكثف)</option>
                </select>
              </div>
            </div>
          </div>

          {/* 3. Full Element & Section Visibility Matrix */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#1D4ED8]" />
              <span>3. إظهار أو إخفاء كل أجزاء وأزرار الموقع</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {[
                { key: 'showTopNoticeBar' as const, label: 'الشريط العلوي الإعلاني' },
                { key: 'showHeaderSocials' as const, label: 'شريط السوشيال والموقع أعلى الهيدر' },
                { key: 'showSearchBar' as const, label: 'شريط البحث في الهيدر' },
                { key: 'showBanners' as const, label: 'قسم البانرات الإعلانية (3 بانرات)' },
                { key: 'showCategoriesStrip' as const, label: 'شريط كروت الأقسام بالرئيسية' },
                { key: 'showSpecialOffersTile' as const, label: 'مربع «عروض خاصة» بالأقسام' },
                { key: 'showNewestSection' as const, label: 'قسم «أحدث المنتجات»' },
                { key: 'showMostRequestedSection' as const, label: 'قسم «الأكثر طلبًا»' },
                { key: 'showFeaturedSection' as const, label: 'قسم «ترشيحات طابا»' },
                { key: 'showDeliverySection' as const, label: 'قسم «معلومات التوصيل والمناطق»' },
                { key: 'showSupportHub' as const, label: 'بطاقات «خدمات العملاء» أسفل الموقع' },
                { key: 'showFavoritesButton' as const, label: 'زر «المفضلة» في الهيدر' },
                { key: 'showCartButton' as const, label: 'زر «السلة» في الهيدر' },
                { key: 'showDarkModeToggle' as const, label: 'خيار الوضع الليلي في التلات شرط' },
                { key: 'showAdminLinkToCustomers' as const, label: 'رابط «لوحة الإدارة» في الواجهة للعملاء' },
                { key: 'showPricesOnStore' as const, label: 'إظهار أسعار المنتجات وحساب التوتال للعملاء' },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center gap-2.5 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 cursor-pointer hover:bg-slate-50"
                >
                  <input
                    type="checkbox"
                    checked={settings.theme[item.key]}
                    onChange={(e) =>
                      updateSettings({
                        theme: { ...settings.theme, [item.key]: e.target.checked },
                      })
                    }
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 4. Storefront Customer Permissions & Rules */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              4. صلاحيات وقواعد تفاعل العملاء على الموقع
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowCustomerOrderEdit}
                  onChange={(e) => updateSettings({ allowCustomerOrderEdit: e.target.checked })}
                  className="mt-0.5"
                />
                <span>السماح للعميل بتعديل الطلب قبل التجهيز</span>
              </label>

              <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowCustomerOrderCancel}
                  onChange={(e) => updateSettings({ allowCustomerOrderCancel: e.target.checked })}
                  className="mt-0.5"
                />
                <span>السماح للعميل بإلغاء الطلب قبل التجهيز</span>
              </label>

              <label className="flex items-start gap-2 rounded-lg border border-slate-200 p-3 text-xs font-semibold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.allowProductReviews}
                  onChange={(e) => updateSettings({ allowProductReviews: e.target.checked })}
                  className="mt-0.5"
                />
                <span>تفعيل تقييمات العملاء على المنتجات</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ALL SITE COPY, SPLASH, ABOUT & LINKS */}
      {subTab === 'copy' && (
        <div className="space-y-6">
          {/* 1. Storefront Copy Texts A-Z */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                1. تحرير كل نصوص وعناوين واجهة المتجر
              </h3>
              <button
                type="button"
                onClick={() =>
                  updateSettings({
                    copy: INITIAL_SETTINGS.copy,
                    storeTagline: INITIAL_SETTINGS.storeTagline,
                    storeLocation: INITIAL_SETTINGS.storeLocation,
                    splashTitle: INITIAL_SETTINGS.splashTitle,
                    splashSubtitle: INITIAL_SETTINGS.splashSubtitle,
                    splashButtonText: INITIAL_SETTINGS.splashButtonText,
                  })
                }
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[#1D4ED8] cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>استعادة النصوص الافتراضية</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص الشريط العلوي الإعلاني
                </label>
                <input
                  type="text"
                  value={settings.theme.topNoticeText}
                  onChange={(e) =>
                    updateSettings({
                      theme: { ...settings.theme, topNoticeText: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شعار الهيدر (مثال: طابا ... دايمًا الأقرب ليك)
                </label>
                <input
                  type="text"
                  value={settings.copy.headerMotto}
                  onChange={(e) =>
                    updateSettings({ copy: { ...settings.copy, headerMotto: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  مقر المعرض (مثال: القناطر الخيرية)
                </label>
                <input
                  type="text"
                  value={settings.storeLocation}
                  onChange={(e) => updateSettings({ storeLocation: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الجملة التعريفية الرئيسية أسفل البانرات
                </label>
                <input
                  type="text"
                  value={settings.storeTagline}
                  onChange={(e) => updateSettings({ storeTagline: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص مربع البحث (Placeholder)
                </label>
                <input
                  type="text"
                  value={settings.copy.searchPlaceholder}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, searchPlaceholder: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم الأقسام
                </label>
                <input
                  type="text"
                  value={settings.copy.categoriesSectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, categoriesSectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تسمية زر «الكل»
                </label>
                <input
                  type="text"
                  value={settings.copy.allCategoryLabel}
                  onChange={(e) =>
                    updateSettings({ copy: { ...settings.copy, allCategoryLabel: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  تسمية مربع «عروض خاصة»
                </label>
                <input
                  type="text"
                  value={settings.copy.specialOffersTileLabel}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, specialOffersTileLabel: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم «أحدث المنتجات»
                </label>
                <input
                  type="text"
                  value={settings.copy.newestSectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, newestSectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم «الأكثر طلبًا»
                </label>
                <input
                  type="text"
                  value={settings.copy.mostRequestedSectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, mostRequestedSectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم «ترشيحات طابا»
                </label>
                <input
                  type="text"
                  value={settings.copy.featuredSectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, featuredSectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم «معلومات التوصيل»
                </label>
                <input
                  type="text"
                  value={settings.copy.deliverySectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, deliverySectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان قسم «خدمات العملاء»
                </label>
                <input
                  type="text"
                  value={settings.copy.supportSectionTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, supportSectionTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  شعار الفوتر (مثال: طابا ... دايمًا معاك)
                </label>
                <input
                  type="text"
                  value={settings.copy.footerMotto}
                  onChange={(e) =>
                    updateSettings({ copy: { ...settings.copy, footerMotto: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص حقوق الملكية بالفوتر
                </label>
                <input
                  type="text"
                  value={settings.copy.copyrightText}
                  onChange={(e) =>
                    updateSettings({ copy: { ...settings.copy, copyrightText: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div className="md:col-span-2 lg:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رسالة التنبيه داخل السلة (إخفاء الأسعار والمراجعة بالواتساب)
                </label>
                <input
                  type="text"
                  value={settings.copy.cartNoticeText}
                  onChange={(e) =>
                    updateSettings({ copy: { ...settings.copy, cartNoticeText: e.target.value } })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  عنوان رسالة تأكيد استلام الطلب
                </label>
                <input
                  type="text"
                  value={settings.copy.orderSuccessTitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, orderSuccessTitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص زر واتساب للاستفسار عن توتال الطلب
                </label>
                <input
                  type="text"
                  value={settings.copy.orderWhatsappCtaText}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, orderWhatsappCtaText: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رسالة التحقق والاتصال بالعميل بعد الطلب
                </label>
                <input
                  type="text"
                  value={settings.copy.orderSuccessSubtitle}
                  onChange={(e) =>
                    updateSettings({
                      copy: { ...settings.copy, orderSuccessSubtitle: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
              </div>
            </div>
          </div>

          {/* 2. Animated Splash Screen Customization */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-slate-900">
                  2. شاشة الترحيب الأنيميشن عند الدخول (18 سنة)
                </h3>
              </div>
              <button
                type="button"
                onClick={handlePreviewSplashOnStore}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#0b347e] text-white text-xs font-bold cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>معاينة شاشة الترحيب الآن</span>
              </button>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.splashEnabled}
                onChange={(e) => updateSettings({ splashEnabled: e.target.checked })}
              />
              <span>تفعيل شاشة الترحيب باللوجو في المنتصف والأنيميشن عند فتح الموقع</span>
            </label>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  كلمة الشكر الرئيسية
                </label>
                <input
                  type="text"
                  value={settings.splashTitle}
                  onChange={(e) => updateSettings({ splashTitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  نص زر الدخول للموقع
                </label>
                <input
                  type="text"
                  value={settings.splashButtonText}
                  onChange={(e) => updateSettings({ splashButtonText: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  الرسالة الترحيبية (الذكرى الـ 18 منذ 2008)
                </label>
                <input
                  type="text"
                  value={settings.splashSubtitle}
                  onChange={(e) => updateSettings({ splashSubtitle: e.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>

          {/* 3. About Us & Links */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              3. محتوى «من نحن» ورابط الموقع والسوشيال في قائمة التلات شرط
            </h3>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                نص «من نحن» (كل سطر فقرة)
              </label>
              <textarea
                rows={4}
                value={settings.aboutUsText}
                onChange={(e) => updateSettings({ aboutUsText: e.target.value })}
                className="w-full rounded-lg border border-slate-200 p-3 text-xs leading-relaxed"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط موقعنا الرسمي (اتركه فارغًا لاستخدام الرابط الحالي)
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.websiteUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, websiteUrl: e.target.value },
                    })
                  }
                  placeholder="https://tabastore.com"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط فيسبوك</label>
                <input
                  type="url"
                  value={settings.socialLinks.facebookUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, facebookUrl: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط ماسنجر</label>
                <input
                  type="url"
                  value={settings.socialLinks.messengerUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, messengerUrl: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط إنستجرام</label>
                <input
                  type="url"
                  value={settings.socialLinks.instagramUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, instagramUrl: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">رابط تيك توك</label>
                <input
                  type="url"
                  value={settings.socialLinks.tiktokUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, tiktokUrl: e.target.value },
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  رابط الموقع الجغرافي (خرائط جوجل)
                </label>
                <input
                  type="url"
                  value={settings.socialLinks.googleMapsUrl}
                  onChange={(e) =>
                    updateSettings({
                      socialLinks: { ...settings.socialLinks, googleMapsUrl: e.target.value },
                    })
                  }
                  placeholder="https://maps.app.goo.gl/..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BANNERS MANAGEMENT */}
      {subTab === 'banners' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-slate-600">
              يظهر البانر الأول كشريحة علوية متغيرة، وآخر بانرين فعالين يظهران أسفلها جنبًا إلى جنب (نظام 3 بانرات).
            </p>
            <button
              type="button"
              onClick={() => setShowNewBannerForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>إضافة بانر جديد</span>
            </button>
          </div>

          {showNewBannerForm && (
            <form
              onSubmit={handleAddBanner}
              className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">إنشاء بانر إعلاني جديد</h3>
                <button
                  type="button"
                  onClick={() => setShowNewBannerForm(false)}
                  className="text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="العنوان الرئيسي للبانر *"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newBadge}
                  onChange={(e) => setNewBadge(e.target.value)}
                  placeholder="شارة صغيرة أعلى العنوان (اختياري)"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  placeholder="النص التوضيحي الفرعي"
                  className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={newCta}
                  onChange={(e) => setNewCta(e.target.value)}
                  placeholder="نص زر الإجراء"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                />
                <select
                  value={newTone}
                  onChange={(e) => setNewTone(e.target.value as Banner['themeTone'])}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="blue">لون أزرق طابا</option>
                  <option value="navy">لون كحلي داكن</option>
                  <option value="slate">لون أزرق فاتح</option>
                  <option value="crimson">لون أحمر عروض</option>
                </select>
                <select
                  value={newTargetCat}
                  onChange={(e) => setNewTargetCat(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="">توجيه إلى: كل المنتجات</option>
                  {sortedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      توجيه إلى قسم: {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min={3}
                  max={20}
                  value={newDuration}
                  onChange={(e) => setNewDuration(Number(e.target.value) || 5)}
                  placeholder="مدة ظهور الشريحة (ثوانٍ)"
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newIsOffer}
                  onChange={(e) => setNewIsOffer(e.target.checked)}
                />
                <span>بانر عرض مؤقت ينتهي تلقائيًا بعد 3 أيام</span>
              </label>
              <div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  حفظ وإضافة البانر
                </button>
              </div>
            </form>
          )}

          <div className="space-y-3">
            {sortedBanners.map((b, idx) => (
              <div
                key={b.id}
                className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3 max-w-xl">
                  {b.imageUrl && (
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="w-24 h-14 rounded-lg object-cover border border-slate-200 shrink-0"
                    />
                  )}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <span className="font-bold text-slate-900 tabular-nums">#{idx + 1}</span>
                      <span>·</span>
                      <span>مدة الظهور: {b.slideDurationSec} ثوانٍ</span>
                      <span>·</span>
                      <span>{b.isActive ? 'مفعل' : 'متوقف'}</span>
                      {b.isOfferBanner && (
                        <>
                          <span>·</span>
                          <span className="text-[#DC2626] font-semibold">
                            عرض 3 أيام (ينتهي{' '}
                            {b.offerExpiresAt
                              ? new Date(b.offerExpiresAt).toLocaleDateString('ar-EG')
                              : '—'}
                            )
                          </span>
                        </>
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900">{b.title}</div>
                    <div className="text-xs text-slate-600">{b.subtitle}</div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => moveBanner(b.id, 'up')}
                    disabled={idx === 0}
                    aria-label="تحريك لأعلى"
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveBanner(b.id, 'down')}
                    disabled={idx === sortedBanners.length - 1}
                    aria-label="تحريك لأسفل"
                    className="p-2 rounded-lg border border-slate-200 disabled:opacity-40 cursor-pointer"
                  >
                    <ArrowDown className="w-4 h-4" />
                  </button>
                  {b.isOfferBanner && (
                    <button
                      type="button"
                      onClick={() => renewBannerOfferThreeDays(b.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-semibold cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>تجديد 3 أيام</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingBanner(b)}
                    className="px-3.5 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold cursor-pointer"
                  >
                    تعديل
                  </button>
                  {sortedBanners.length > 1 && (
                    <button
                      type="button"
                      onClick={() => deleteBanner(b.id)}
                      aria-label="حذف البانر"
                      className="p-2 rounded-lg border border-slate-200 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {editingBanner && (
            <form
              onSubmit={handleSaveBanner}
              className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-4"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">تعديل: {editingBanner.title}</h3>
                <button
                  type="button"
                  onClick={() => setEditingBanner(null)}
                  className="text-xs text-slate-600 hover:underline cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    العنوان الرئيسي
                  </label>
                  <input
                    type="text"
                    required
                    value={editingBanner.title}
                    onChange={(e) => setEditingBanner({ ...editingBanner, title: e.target.value })}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    الشارة أعلى العنوان
                  </label>
                  <input
                    type="text"
                    value={editingBanner.badgeText || ''}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, badgeText: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">النص الفرعي</label>
                  <input
                    type="text"
                    value={editingBanner.subtitle}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, subtitle: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">نص الزر</label>
                  <input
                    type="text"
                    required
                    value={editingBanner.ctaText}
                    onChange={(e) =>
                      setEditingBanner({ ...editingBanner, ctaText: e.target.value })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    توجيه الزر لقسم
                  </label>
                  <select
                    value={editingBanner.targetCategoryId || ''}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        targetCategoryId: e.target.value || undefined,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">كل المنتجات</option>
                    {sortedCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    مدة ظهور الشريحة (بالثواني)
                  </label>
                  <input
                    type="number"
                    min={3}
                    max={20}
                    value={editingBanner.slideDurationSec}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        slideDurationSec: Number(e.target.value) || 5,
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    لون الخلفية الافتراضي
                  </label>
                  <select
                    value={editingBanner.themeTone}
                    onChange={(e) =>
                      setEditingBanner({
                        ...editingBanner,
                        themeTone: e.target.value as Banner['themeTone'],
                      })
                    }
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                  >
                    <option value="blue">أزرق طابا</option>
                    <option value="navy">كحلي داكن</option>
                    <option value="slate">أزرق فاتح</option>
                    <option value="crimson">أحمر عروض</option>
                  </select>
                </div>
                <div className="sm:col-span-2 flex flex-wrap items-center gap-3">
                  {editingBanner.imageUrl && (
                    <img
                      src={editingBanner.imageUrl}
                      alt={editingBanner.title}
                      className="w-28 h-16 rounded-lg object-cover border border-slate-200"
                    />
                  )}
                  <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold cursor-pointer">
                    <ImagePlus className="w-4 h-4 text-[#1D4ED8]" />
                    <span>رفع صورة خلفية جديدة (WebP)</span>
                    <input type="file" accept="image/*" onChange={handleBannerImage} className="hidden" />
                  </label>
                  {INITIAL_BANNERS.find((sb) => sb.id === editingBanner.id)?.imageUrl && (
                    <button
                      type="button"
                      onClick={() =>
                        setEditingBanner({
                          ...editingBanner,
                          imageUrl: INITIAL_BANNERS.find((sb) => sb.id === editingBanner.id)?.imageUrl,
                        })
                      }
                      className="text-xs text-[#1D4ED8] underline cursor-pointer"
                    >
                      استعادة الصورة الافتراضية
                    </button>
                  )}
                  {editingBanner.imageUrl && (
                    <button
                      type="button"
                      onClick={() => setEditingBanner({ ...editingBanner, imageUrl: undefined })}
                      className="text-xs text-[#DC2626] underline cursor-pointer"
                    >
                      إزالة الصورة
                    </button>
                  )}
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingBanner.isActive}
                  onChange={(e) =>
                    setEditingBanner({ ...editingBanner, isActive: e.target.checked })
                  }
                />
                <span>تفعيل ظهور البانر على الموقع</span>
              </label>

              <div>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold cursor-pointer"
                >
                  حفظ التعديلات
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* TAB 3: LAYOUT ORDER & FEATURED PICKS */}
      {subTab === 'layout' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">ترتيب أقسام الصفحة الرئيسية</h3>
              <div className="space-y-2">
                {settings.homeSectionOrder.map((sec, idx) => (
                  <div
                    key={sec}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {sectionLabels[sec]}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveHomeSection(idx, -1)}
                        disabled={idx === 0}
                        className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveHomeSection(idx, 1)}
                        disabled={idx === settings.homeSectionOrder.length - 1}
                        className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900">
                ترتيب أقسام المنتجات على الرئيسية
              </h3>
              <div className="space-y-2">
                {sortedCategories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {idx + 1}. {cat.name}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveCategory(cat.id, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveCategory(cat.id, 'down')}
                        disabled={idx === sortedCategories.length - 1}
                        className="p-1.5 rounded border border-slate-200 disabled:opacity-40 cursor-pointer"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500" />
              <span>اختيار منتجات «ترشيحات طابا»</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {products.map((p) => (
                <label
                  key={p.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold cursor-pointer ${
                    p.isFeaturedPick
                      ? 'border-[#1D4ED8] bg-blue-50 text-[#0B3B91]'
                      : 'border-slate-200 text-slate-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={p.isFeaturedPick}
                    onChange={(e) => saveProduct({ ...p, isFeaturedPick: e.target.checked })}
                  />
                  <span className="truncate">{p.name}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
