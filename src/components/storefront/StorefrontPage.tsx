import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowUp,
  CheckCircle2,
  Clock,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Package,
  PackageSearch,
  RefreshCw,
  Shield,
  ShieldCheck,
  Sparkles,
  SprayCan,
  Star,
  Truck,
  Utensils,
  Wrench,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { AvailabilityStatus, Banner, Product, ProductVisualKind } from '../../types/taba';
import { resolveSiteTheme } from '../../utils/themePresets';
import { buildGeneralWhatsAppUrl } from '../../utils/whatsapp';
import { BannerCarousel } from './BannerCarousel';
import { CartDrawer } from './CartDrawer';
import { FavoritesDrawer } from './FavoritesDrawer';
import { InfoHubModal, InfoHubTab } from './InfoHubModal';
import { OrderTrackingModal } from './OrderTrackingModal';
import { ProductCard } from './ProductCard';
import { ProductDetailModal } from './ProductDetailModal';
import { SplashOverlay } from './SplashOverlay';
import { StoreFooter } from './StoreFooter';
import { StoreHeader } from './StoreHeader';

export const StorefrontPage: React.FC = () => {
  const { products, categories, zones, settings, setCurrentView } = useTaba();
  const resolvedTheme = resolveSiteTheme(settings.theme);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [availabilityFilter, setAvailabilityFilter] = useState<'all' | AvailabilityStatus>('all');
  const [quickFilter, setQuickFilter] = useState<'all' | 'new' | 'offer'>('all');
  const [sortBy, setSortBy] = useState<'default' | 'mostRequested' | 'newest' | 'nameAsc'>('default');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [toastProduct, setToastProduct] = useState<string | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isFavoritesOpen, setIsFavoritesOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [trackingPrefill, setTrackingPrefill] = useState<{ orderNumber: string; phone: string }>({
    orderNumber: '',
    phone: '',
  });
  const [infoHubState, setInfoHubState] = useState<{
    open: boolean;
    tab: InfoHubTab;
    orderNum?: string;
    phone?: string;
  }>({
    open: false,
    tab: 'faq',
  });

  const catalogAnchorRef = useRef<HTMLDivElement>(null);

  const triggerAddToast = (productName: string) => {
    setToastProduct(productName);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastProduct(null), 3000);
  };

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark && settings.theme.showDarkModeToggle) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [isDark, settings.theme.showDarkModeToggle]);

  useEffect(() => {
    const openProductFromHash = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#product-')) {
        const prodId = hash.slice('#product-'.length);
        const match = products.find((p) => p.id === prodId && p.isVisible);
        if (match) {
          setSelectedProduct(match);
        }
      }
    };
    openProductFromHash();
    window.addEventListener('hashchange', openProductFromHash);
    return () => window.removeEventListener('hashchange', openProductFromHash);
  }, [products]);

  const visibleProducts = useMemo(() => products.filter((p) => p.isVisible), [products]);

  const isFilteredView =
    searchQuery.trim().length > 0 ||
    selectedCategoryId !== 'all' ||
    availabilityFilter !== 'all' ||
    quickFilter !== 'all' ||
    sortBy !== 'default';

  const filteredProducts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const now = Date.now();
    const matches = visibleProducts.filter((p) => {
      if (selectedCategoryId !== 'all' && p.categoryId !== selectedCategoryId) return false;
      if (availabilityFilter !== 'all' && p.availability !== availabilityFilter) return false;
      if (quickFilter === 'new' && !p.isNew) return false;
      if (quickFilter === 'offer') {
        const started = !p.offerStartsAt || new Date(p.offerStartsAt).getTime() <= now;
        const notExpired = !p.offerExpiresAt || new Date(p.offerExpiresAt).getTime() > now;
        if (!p.isOffer || !started || !notExpired) return false;
      }
      if (q) {
        const catName = categories.find((c) => c.id === p.categoryId)?.name ?? '';
        const haystack = `${p.name} ${p.shortDescription} ${catName}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    if (sortBy === 'mostRequested') {
      return [...matches].sort((a, b) => b.requestCount - a.requestCount);
    }
    if (sortBy === 'newest') {
      return [...matches].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    }
    if (sortBy === 'nameAsc') {
      return [...matches].sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    }
    return matches;
  }, [visibleProducts, selectedCategoryId, availabilityFilter, quickFilter, searchQuery, categories, sortBy]);

  const newestProducts = useMemo(
    () =>
      [...visibleProducts]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 6),
    [visibleProducts]
  );

  const mostRequestedProducts = useMemo(
    () => [...visibleProducts].sort((a, b) => b.requestCount - a.requestCount).slice(0, 6),
    [visibleProducts]
  );

  const featuredProducts = useMemo(
    () => visibleProducts.filter((p) => p.isFeaturedPick).slice(0, 6),
    [visibleProducts]
  );

  const handleBannerAction = (banner: Banner) => {
    if (banner.isOfferBanner) {
      setQuickFilter('offer');
      setSelectedCategoryId(banner.targetCategoryId || 'all');
    } else if (banner.targetCategoryId) {
      setQuickFilter('all');
      setSelectedCategoryId(banner.targetCategoryId);
    } else {
      setQuickFilter('all');
      setSelectedCategoryId('all');
    }
    catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const getCategoryIcon = (catId: string, iconKey?: ProductVisualKind) => {
    if (iconKey === 'tissue' || catId === 'cat-paper') {
      return <Layers className={`w-6 h-6 ${resolvedTheme.primaryText}`} />;
    }
    if (iconKey === 'detergent' || catId === 'cat-detergents') {
      return <SprayCan className={`w-6 h-6 ${resolvedTheme.primaryText}`} />;
    }
    if (iconKey === 'plastic' || catId === 'cat-plastic') {
      return <Package className={`w-6 h-6 ${resolvedTheme.primaryText}`} />;
    }
    if (iconKey === 'kitchenware' || catId === 'cat-homeware') {
      return <Utensils className={`w-6 h-6 ${resolvedTheme.primaryText}`} />;
    }
    return <Sparkles className={`w-6 h-6 ${resolvedTheme.primaryText}`} />;
  };

  const renderShowcaseRow = (items: Product[]) => {
    const countLimit = settings.theme.desktopColumns === 5 ? 5 : 4;
    return (
      <div
        className={`flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 md:grid ${resolvedTheme.desktopGridCols} md:gap-4 md:overflow-visible`}
      >
        {items.slice(0, countLimit).map((p) => (
          <div key={p.id} className="w-[185px] shrink-0 snap-start md:w-auto">
            <ProductCard
              product={p}
              onOpenDetail={setSelectedProduct}
              onQuickAddFeedback={triggerAddToast}
            />
          </div>
        ))}
      </div>
    );
  };

  const renderSectionByKey = (key: 'newest' | 'mostRequested' | 'featured') => {
    if (key === 'newest') {
      if (!settings.theme.showNewestSection) return null;
      return (
        <section key="newest" className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <h3
              className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3`}
            >
              {settings.copy.newestSectionTitle}
            </h3>
            <button
              type="button"
              onClick={() => setQuickFilter('new')}
              className={`text-xs sm:text-sm font-semibold ${resolvedTheme.primaryText} hover:underline cursor-pointer`}
            >
              عرض الكل
            </button>
          </div>
          {renderShowcaseRow(newestProducts)}
        </section>
      );
    }

    if (key === 'mostRequested') {
      if (!settings.theme.showMostRequestedSection) return null;
      return (
        <section key="mostRequested" className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-8">
          <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
            <h3
              className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3`}
            >
              {settings.copy.mostRequestedSectionTitle}
            </h3>
          </div>
          {renderShowcaseRow(mostRequestedProducts)}
        </section>
      );
    }

    if (!settings.theme.showFeaturedSection) return null;
    return (
      <section key="featured" className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-8">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-4">
          <h3
            className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3`}
          >
            {settings.copy.featuredSectionTitle}
          </h3>
          <button
            type="button"
            onClick={() => setQuickFilter('offer')}
            className="text-xs sm:text-sm font-semibold text-[#d9273e] hover:underline cursor-pointer"
          >
            تصفح العروض الحالية
          </button>
        </div>
        {renderShowcaseRow(featuredProducts)}
      </section>
    );
  };

  if (settings.isMaintenanceMode) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b347e] via-[#1554b9] to-[#0a2d6b] text-white flex flex-col items-center justify-center p-5">
        <div className="w-full max-w-xl rounded-3xl bg-white text-slate-900 p-7 sm:p-10 shadow-2xl border border-white/30 text-center space-y-5">
          <div className="flex justify-center">
            <img
              src={settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg'}
              alt="شعار معرض طابا"
              className="h-16 sm:h-20 w-auto object-contain"
            />
          </div>

          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <Wrench className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-extrabold">
              وضع الصيانة والتحديث
            </span>
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#0b347e]">
              {settings.maintenanceTitle || 'الموقع تحت الصيانة والتحديث حاليًا'}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {settings.maintenanceMessage}
            </p>
            {settings.maintenanceExpectedReturn && (
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-[#1554b9] bg-blue-50 border border-blue-200 px-3.5 py-1.5 rounded-xl mt-2">
                <Clock className="w-4 h-4" />
                <span>{settings.maintenanceExpectedReturn}</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {settings.maintenanceAllowWhatsApp && (
              <a
                href={buildGeneralWhatsAppUrl(
                  'السلام عليكم، أتواصل معكم بخصوص متجر معرض طابا.',
                  settings.whatsappNumber
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#168b53] hover:bg-[#137445] text-white text-xs sm:text-sm font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>تواصل عبر واتساب ({settings.whatsappNumber})</span>
              </a>
            )}
            {settings.maintenanceAllowTracking && (
              <button
                type="button"
                onClick={() => setIsTrackingOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                <PackageSearch className="w-4 h-4" />
                <span>متابعة طلب حالي</span>
              </button>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>معرض طابا · 18 عامًا من الثقة</span>
            <button
              type="button"
              onClick={() => setCurrentView('admin')}
              className="inline-flex items-center gap-1 text-slate-500 hover:text-[#1554b9] font-semibold cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>دخول الإدارة</span>
            </button>
          </div>
        </div>

        <OrderTrackingModal
          isOpen={isTrackingOpen}
          initialOrderNumber={trackingPrefill.orderNumber}
          initialPhone={trackingPrefill.phone}
          onClose={() => setIsTrackingOpen(false)}
          onOpenCart={() => {}}
        />
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col ${resolvedTheme.pageBg} text-[#17243e] dark:text-[#eaf0fd]`}
    >
      <SplashOverlay />

      <StoreHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedCategoryId={selectedCategoryId}
        onSelectCategory={(id) => {
          setQuickFilter('all');
          setSelectedCategoryId(id);
          catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onQuickViewProduct={setSelectedProduct}
        onQuickAddToast={triggerAddToast}
        onShowOffersFilter={() => {
          setSelectedCategoryId('all');
          setQuickFilter('offer');
          catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onShowAllResults={() => {
          catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenFavorites={() => setIsFavoritesOpen(true)}
        onOpenTracking={() => {
          setTrackingPrefill({ orderNumber: '', phone: '' });
          setIsTrackingOpen(true);
        }}
        onOpenInfoHub={(tab) => setInfoHubState({ open: true, tab })}
        isDark={isDark}
        onToggleDark={() => setIsDark((d) => !d)}
      />

      <main className="flex-1">
        {/* 3-Banner Block: 1 Wide Carousel + 2 Side-by-Side Promo Banners */}
        {settings.theme.showBanners && <BannerCarousel onBannerAction={handleBannerAction} />}

        {/* Centered Tagline */}
        {settings.storeTagline && (
          <p className="mx-auto max-w-[1240px] px-4 text-center text-sm sm:text-base font-semibold text-[#69758d] dark:text-[#9aa8c7] mt-5 mb-2">
            {settings.storeTagline}
          </p>
        )}

        {/* Categories Cards Strip (matching mockup including عروض خاصة) */}
        {settings.theme.showCategoriesStrip && (
          <section aria-label="الأقسام" className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-4">
            <h3
              className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3 mb-3`}
            >
              {settings.copy.categoriesSectionTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
              <button
                type="button"
                onClick={() => {
                  setQuickFilter('all');
                  setSelectedCategoryId('all');
                  catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={`${resolvedTheme.cardRadius} border p-3.5 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                  selectedCategoryId === 'all' && quickFilter === 'all'
                    ? 'border-[#1554b9] bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                    : 'border-[#e8edf6] dark:border-[#29365a] bg-white dark:bg-[#16203a] hover:-translate-y-0.5 shadow-[0_6px_18px_rgba(20,45,90,0.045)]'
                }`}
              >
                <span className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center">
                  <Layers className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                </span>
                <span className="text-xs sm:text-sm font-bold">{settings.copy.allCategoryLabel}</span>
              </button>

              {[...categories]
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((cat) => {
                  const catProdCount = visibleProducts.filter((p) => p.categoryId === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => {
                        setQuickFilter('all');
                        setSelectedCategoryId(cat.id);
                        catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      className={`${resolvedTheme.cardRadius} border p-3.5 text-center flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        selectedCategoryId === cat.id
                          ? 'border-[#1554b9] bg-blue-50/70 dark:bg-blue-950/40 shadow-sm'
                          : 'border-[#e8edf6] dark:border-[#29365a] bg-white dark:bg-[#16203a] hover:-translate-y-0.5 shadow-[0_6px_18px_rgba(20,45,90,0.045)]'
                      }`}
                    >
                      <span className="w-11 h-11 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                        {getCategoryIcon(cat.id, cat.iconKey)}
                      </span>
                      <span className="text-xs sm:text-sm font-bold">{cat.name}</span>
                      <span className="text-[11px] text-[#69758d] dark:text-[#9aa8c7] tabular-nums">
                        {catProdCount} منتج
                      </span>
                    </button>
                  );
                })}

              {settings.theme.showSpecialOffersTile && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId('all');
                    setQuickFilter('offer');
                    catalogAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className={`${resolvedTheme.cardRadius} border p-3.5 text-center flex flex-col items-center justify-center gap-2 transition-all cursor-pointer ${
                    quickFilter === 'offer'
                      ? 'border-[#d9273e] bg-red-50/80 dark:bg-red-950/40 shadow-sm'
                      : 'border-[#e8edf6] dark:border-[#29365a] bg-white dark:bg-[#16203a] hover:-translate-y-0.5 shadow-[0_6px_18px_rgba(20,45,90,0.045)]'
                  }`}
                >
                  <span className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center">
                    <Star className="w-6 h-6 text-[#d9273e] fill-amber-400" />
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-[#d9273e]">
                    {settings.copy.specialOffersTileLabel}
                  </span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* Filter Controls */}
        <div ref={catalogAnchorRef} className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-6">
          <div
            className={`${resolvedTheme.cardRadius} border border-[#e2e8f3] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-3 flex flex-wrap items-center justify-between gap-3`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setQuickFilter('all')}
                className={`px-3 py-1.5 ${resolvedTheme.buttonRadius} text-xs font-semibold cursor-pointer ${
                  quickFilter === 'all'
                    ? resolvedTheme.primaryBtn
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                كل التشكيلة
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('new')}
                className={`px-3 py-1.5 ${resolvedTheme.buttonRadius} text-xs font-semibold cursor-pointer ${
                  quickFilter === 'new'
                    ? resolvedTheme.primaryBtn
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                جديد المعرض
              </button>
              <button
                type="button"
                onClick={() => setQuickFilter('offer')}
                className={`px-3 py-1.5 ${resolvedTheme.buttonRadius} text-xs font-semibold cursor-pointer ${
                  quickFilter === 'offer'
                    ? 'bg-[#d9273e] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200'
                }`}
              >
                العروض (3 أيام)
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="sort-filter"
                  className="text-xs text-[#69758d] dark:text-[#9aa8c7]"
                >
                  الترتيب:
                </label>
                <select
                  id="sort-filter"
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(e.target.value as 'default' | 'mostRequested' | 'newest' | 'nameAsc')
                  }
                  className="rounded-xl border border-[#dbe3f1] dark:border-[#29365a] bg-[#f4f7fc] dark:bg-[#0d1424] px-3 py-1.5 text-xs font-medium text-[#17243e] dark:text-[#eaf0fd] focus:outline-none"
                >
                  <option value="default">الافتراضي</option>
                  <option value="mostRequested">الأكثر طلبًا</option>
                  <option value="newest">الأحدث إضافة</option>
                  <option value="nameAsc">أبجديًا (أ - ي)</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <label
                  htmlFor="availability-filter"
                  className="text-xs text-[#69758d] dark:text-[#9aa8c7]"
                >
                  التوفر:
                </label>
                <select
                  id="availability-filter"
                  value={availabilityFilter}
                  onChange={(e) =>
                    setAvailabilityFilter(e.target.value as 'all' | AvailabilityStatus)
                  }
                  className="rounded-xl border border-[#dbe3f1] dark:border-[#29365a] bg-[#f4f7fc] dark:bg-[#0d1424] px-3 py-1.5 text-xs font-medium text-[#17243e] dark:text-[#eaf0fd] focus:outline-none"
                >
                  <option value="all">جميع الحالات</option>
                  <option value="متوفر">متوفر</option>
                  <option value="كمية محدودة">كمية محدودة</option>
                  <option value="غير متوفر">غير متوفر</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Filtered Results OR 3 Agreed Homepage Sections */}
        {isFilteredView ? (
          <section className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3
                className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3`}
              >
                المنتجات المطابقة ({filteredProducts.length})
              </h3>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategoryId('all');
                  setAvailabilityFilter('all');
                  setQuickFilter('all');
                  setSortBy('default');
                }}
                className="px-3.5 py-1.5 rounded-xl border border-[#dbe3f1] dark:border-[#29365a] bg-white dark:bg-[#16203a] text-xs font-semibold cursor-pointer"
              >
                إعادة ضبط الفلترة
              </button>
            </div>

            {filteredProducts.length === 0 ? (
              <div
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-12 text-center space-y-2`}
              >
                <div className="text-base font-bold">لا توجد منتجات مطابقة لبحثك</div>
                <p className="text-xs sm:text-sm text-[#69758d] dark:text-[#9aa8c7]">
                  جرّب البحث بكلمة أخرى أو تصفح قسم «الكل».
                </p>
              </div>
            ) : (
              <div className={`grid grid-cols-2 ${resolvedTheme.desktopGridCols} gap-3 sm:gap-4`}>
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onOpenDetail={setSelectedProduct}
                    onQuickAddFeedback={triggerAddToast}
                  />
                ))}
              </div>
            )}
          </section>
        ) : (
          settings.homeSectionOrder.map((sectionKey) => renderSectionByKey(sectionKey))
        )}

        {/* Delivery Information Section (Toggleable in Admin) */}
        {settings.theme.showDeliverySection && (
          <section className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-10">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <h3
                className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3`}
              >
                {settings.copy.deliverySectionTitle}
              </h3>
              <div className="flex flex-wrap items-center gap-3 text-xs text-[#69758d] dark:text-[#9aa8c7]">
                <span className="inline-flex items-center gap-1.5">
                  <Clock className={`w-4 h-4 ${resolvedTheme.primaryText}`} />
                  <span>{settings.dailyOrderHours}</span>
                </span>
                {settings.socialLinks.googleMapsUrl && (
                  <a
                    href={settings.socialLinks.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-red-50 dark:bg-red-950/40 text-[#d9273e] font-bold hover:underline"
                  >
                    <MapPin className="w-3.5 h-3.5" />
                    <span>موقع المعرض على الخريطة</span>
                  </a>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {zones.map((z) => (
                <div
                  key={z.id}
                  className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 space-y-2 shadow-[0_6px_18px_rgba(20,45,90,0.045)] ${
                    !z.isActive ? 'opacity-70' : ''
                  }`}
                >
                  <div className="inline-flex items-center gap-1.5 text-sm font-bold">
                    <MapPin className="w-4 h-4 text-[#d9273e] shrink-0" />
                    <span>{z.name}</span>
                  </div>
                  <div className="text-xs text-[#69758d] dark:text-[#9aa8c7]">
                    رسوم التوصيل:{' '}
                    <strong className="tabular-nums text-[#17243e] dark:text-white">
                      {z.fee} ج.م
                    </strong>
                  </div>
                  <div className="text-xs text-[#69758d] dark:text-[#9aa8c7]">{z.minOrderNote}</div>
                  <div className="text-xs text-[#69758d] dark:text-[#9aa8c7] flex items-center gap-1.5 pt-1">
                    <Truck className={`w-3.5 h-3.5 ${resolvedTheme.primaryText}`} />
                    <span>{z.isActive ? z.deliveryHours : 'متوقف حاليًا'}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Customer Services & Help Hub (Toggleable in Admin) */}
        {settings.theme.showSupportHub && (
          <section className="mx-auto max-w-[1240px] px-3 sm:px-5 pt-10">
            <h3
              className={`text-xl font-extrabold text-[#17243e] dark:text-[#eaf0fd] border-r-[5px] ${resolvedTheme.sectionBorder} pr-3 mb-4`}
            >
              {settings.copy.supportSectionTitle}
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
              <button
                type="button"
                onClick={() => setInfoHubState({ open: true, tab: 'about' })}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <Info className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                <div className="text-xs sm:text-sm font-bold">من نحن</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  18 عامًا منذ 2008
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTrackingPrefill({ orderNumber: '', phone: '' });
                  setIsTrackingOpen(true);
                }}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <PackageSearch className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                <div className="text-xs sm:text-sm font-bold">متابعة وتعديل الطلب</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  تتبع بكود الطلب أو تعديله
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInfoHubState({ open: true, tab: 'returns' })}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <RefreshCw className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                <div className="text-xs sm:text-sm font-bold">الاستبدال والاسترجاع</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  الشروط وتقديم طلب
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInfoHubState({ open: true, tab: 'faq' })}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <HelpCircle className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                <div className="text-xs sm:text-sm font-bold">أبرز الأسئلة</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  الأسعار والتوصيل والدفع
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInfoHubState({ open: true, tab: 'complaints' })}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <MessageSquareWarning className="w-6 h-6 text-[#d9273e]" />
                <div className="text-xs sm:text-sm font-bold">الشكاوى والمقترحات</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  أرسل ملاحظاتك للإدارة
                </p>
              </button>

              <button
                type="button"
                onClick={() => setInfoHubState({ open: true, tab: 'privacy' })}
                className={`${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)] cursor-pointer`}
              >
                <Shield className={`w-6 h-6 ${resolvedTheme.primaryText}`} />
                <div className="text-xs sm:text-sm font-bold">سياسة الخصوصية</div>
                <p className="text-[11px] text-[#69758d] dark:text-[#9aa8c7]">
                  حماية بيانات العميل
                </p>
              </button>

              <a
                href={buildGeneralWhatsAppUrl(undefined, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className={`${resolvedTheme.cardRadius} border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/30 p-4 text-right space-y-2 hover:-translate-y-0.5 transition-all shadow-[0_6px_18px_rgba(20,45,90,0.045)]`}
              >
                <MessageCircle className="w-6 h-6 text-[#168b53]" />
                <div className="text-xs sm:text-sm font-bold text-emerald-900 dark:text-emerald-300">
                  واتساب طابا المباشر
                </div>
                <p className="text-[11px] text-emerald-800/80 dark:text-emerald-400 tabular-nums">
                  {settings.whatsappNumber}
                </p>
              </a>
            </div>
          </section>
        )}
      </main>

      <StoreFooter
        onOpenTracking={() => {
          setTrackingPrefill({ orderNumber: '', phone: '' });
          setIsTrackingOpen(true);
        }}
        onOpenInfoHub={(tab) => setInfoHubState({ open: true, tab })}
      />

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onOpenTrackingWithOrder={(orderNumber, phone) => {
          setTrackingPrefill({ orderNumber, phone });
          setIsTrackingOpen(true);
        }}
      />

      <FavoritesDrawer
        isOpen={isFavoritesOpen}
        onClose={() => setIsFavoritesOpen(false)}
        onSelectProduct={(p) => setSelectedProduct(p)}
      />

      <OrderTrackingModal
        isOpen={isTrackingOpen}
        initialOrderNumber={trackingPrefill.orderNumber}
        initialPhone={trackingPrefill.phone}
        onClose={() => setIsTrackingOpen(false)}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenReturnForm={(ordNum, ph) =>
          setInfoHubState({ open: true, tab: 'returns', orderNum: ordNum, phone: ph })
        }
      />

      <InfoHubModal
        isOpen={infoHubState.open}
        initialTab={infoHubState.tab}
        prefillOrderNumber={infoHubState.orderNum}
        prefillPhone={infoHubState.phone}
        onClose={() => setInfoHubState((prev) => ({ ...prev, open: false }))}
      />

      {/* Live Toast Feedback when adding products to Cart */}
      {toastProduct && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-4 z-40 max-w-xs sm:max-w-sm rounded-2xl bg-[#0b347e] text-white px-4 py-3 shadow-2xl border border-white/15 flex items-center justify-between gap-3 no-print"
        >
          <div className="flex items-center gap-2 min-w-0">
            <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />
            <span className="text-xs font-semibold truncate">تمت إضافة «{toastProduct}» للسلة</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setToastProduct(null);
              setIsCartOpen(true);
            }}
            className="text-xs font-extrabold text-amber-300 hover:underline shrink-0 cursor-pointer"
          >
            عرض السلة
          </button>
        </div>
      )}

      {/* Floating Scroll-to-Top & Direct Quick WhatsApp Order Controls */}
      <div className="fixed bottom-5 left-4 z-40 flex flex-col items-end gap-2.5 no-print">
        {showScrollTop && (
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            aria-label="العودة لأعلى الصفحة"
            className="w-11 h-11 rounded-full bg-[#0b347e] hover:bg-[#1554b9] text-white shadow-lg border border-white/25 flex items-center justify-center transition-transform duration-200 hover:-translate-y-0.5 cursor-pointer"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}

        <a
          href={buildGeneralWhatsAppUrl(
            'السلام عليكم، أرغب في عمل طلب سريع من معرض طابا.',
            settings.whatsappNumber
          )}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="الطلب السريع عبر واتساب"
          className="inline-flex items-center gap-2 h-11 px-4 rounded-full bg-[#168b53] hover:bg-[#137445] text-white shadow-xl border border-white/20 text-xs sm:text-sm font-extrabold transition-transform duration-200 hover:-translate-y-0.5"
        >
          <MessageCircle className="w-5 h-5 shrink-0" />
          <span className="hidden sm:inline">الطلب السريع واتساب</span>
        </a>
      </div>
    </div>
  );
};
