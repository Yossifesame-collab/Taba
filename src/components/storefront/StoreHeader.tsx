import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  Globe,
  Heart,
  HelpCircle,
  Info,
  Layers,
  MapPin,
  Menu,
  MessageCircle,
  MessageSquareWarning,
  Moon,
  PackageSearch,
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Sun,
  Tag,
  X,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Product } from '../../types/taba';
import { resolveSiteTheme } from '../../utils/themePresets';
import { buildGeneralWhatsAppUrl } from '../../utils/whatsapp';
import { ProductVisual } from '../ProductVisual';
import { InfoHubTab } from './InfoHubModal';

interface StoreHeaderProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  selectedCategoryId: string;
  onSelectCategory: (id: string) => void;
  onQuickViewProduct: (product: Product) => void;
  onQuickAddToast?: (productName: string) => void;
  onShowOffersFilter?: () => void;
  onShowAllResults?: () => void;
  onOpenCart: () => void;
  onOpenFavorites: () => void;
  onOpenTracking: () => void;
  onOpenInfoHub: (tab: InfoHubTab) => void;
  isDark: boolean;
  onToggleDark: () => void;
}

export const StoreHeader: React.FC<StoreHeaderProps> = ({
  searchQuery,
  onSearchChange,
  selectedCategoryId,
  onSelectCategory,
  onQuickViewProduct,
  onQuickAddToast,
  onShowOffersFilter,
  onShowAllResults,
  onOpenCart,
  onOpenFavorites,
  onOpenTracking,
  onOpenInfoHub,
  isDark,
  onToggleDark,
}) => {
  const { categories, products, cart, favorites, settings, setCurrentView, addToCart } = useTaba();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [siteLinkCopied, setSiteLinkCopied] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleDocClick = (e: MouseEvent) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSearchFocused(false);
        setDrawerOpen(false);
      }
    };
    document.addEventListener('mousedown', handleDocClick);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleDocClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  const visibleProducts = useMemo(() => products.filter((p) => p.isVisible), [products]);

  const { matchedCategories, matchedProducts, totalMatchedProducts } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const sortedCats = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);

    if (!q) {
      return {
        matchedCategories: sortedCats.slice(0, 5),
        matchedProducts: visibleProducts
          .slice()
          .sort((a, b) => b.requestCount - a.requestCount)
          .slice(0, 5),
        totalMatchedProducts: visibleProducts.length,
      };
    }

    const cats = sortedCats.filter((c) => c.name.toLowerCase().includes(q));
    const prods = visibleProducts.filter((p) => {
      const catName = categories.find((c) => c.id === p.categoryId)?.name ?? '';
      return `${p.name} ${p.shortDescription} ${catName}`.toLowerCase().includes(q);
    });

    return {
      matchedCategories: cats,
      matchedProducts: prods.slice(0, 6),
      totalMatchedProducts: prods.length,
    };
  }, [searchQuery, categories, visibleProducts]);

  const showSuggestions = searchFocused && (searchQuery.trim().length > 0 || visibleProducts.length > 0);

  const resolvedTheme = resolveSiteTheme(settings.theme);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const logoSrc = settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg';

  const websiteUrl =
    settings.socialLinks.websiteUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  const handleCopyWebsiteUrl = async () => {
    if (!websiteUrl) return;
    try {
      await navigator.clipboard.writeText(websiteUrl);
      setSiteLinkCopied(true);
      window.setTimeout(() => setSiteLinkCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  return (
    <>
      {settings.theme.showTopNoticeBar && (
        <div
          className={`${resolvedTheme.topStripBg} text-white text-center text-xs sm:text-[13px] py-1 px-3 font-medium no-print`}
        >
          {settings.theme.topNoticeText}
        </div>
      )}

      {!settings.isAcceptingOrders && (
        <div className="bg-amber-500 text-slate-950 text-xs sm:text-sm py-2 px-4 text-center font-bold no-print">
          {settings.pauseMessage}
        </div>
      )}

      <header
        className={`sticky top-0 z-40 ${resolvedTheme.headerBg} text-white border-b-2 border-white/15 shadow-lg no-print`}
      >
        <div className="mx-auto max-w-[1240px] px-3 sm:px-5 pb-3">
          {/* Top Social & Brand Tagline Strip matching mockup */}
          {settings.theme.showHeaderSocials && (
            <div className="hidden sm:flex items-center justify-between text-[11px] text-white/90 pt-1.5 pb-1 border-b border-white/10">
              <div className="font-semibold flex items-center gap-2">
                <span>{settings.copy.headerMotto}</span>
                <span aria-hidden="true">·</span>
                {settings.socialLinks.googleMapsUrl ? (
                  <a
                    href={settings.socialLinks.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 hover:underline text-amber-200"
                  >
                    <MapPin className="w-3 h-3" />
                    <span>{settings.storeLocation || 'القناطر الخيرية'}</span>
                  </a>
                ) : (
                  <span>{settings.storeLocation || 'القناطر الخيرية'}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-white/75">تابعنا على:</span>
                <a
                  href={settings.socialLinks.facebookUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold"
                >
                  فيسبوك
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={settings.socialLinks.tiktokUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold"
                >
                  تيك توك
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={buildGeneralWhatsAppUrl(undefined, settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold text-emerald-300"
                >
                  واتساب
                </a>
                <span aria-hidden="true">·</span>
                <a
                  href={settings.socialLinks.messengerUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline font-semibold"
                >
                  ماسنجر
                </a>
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 items-center gap-2">
            {/* Right in RTL: Burger (التلات شرط) + desktop quick links */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDrawerOpen(true)}
                aria-label="فتح القائمة الكاملة"
                className="inline-flex items-center justify-center w-10 h-10 rounded-[10px] bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <button
                type="button"
                onClick={onOpenTracking}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/12 hover:bg-white/22 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <PackageSearch className="w-4 h-4" />
                <span>متابعة طلب</span>
              </button>

              {settings.theme.showAdminLinkToCustomers && (
                <button
                  type="button"
                  onClick={() => setCurrentView('admin')}
                  className="hidden lg:inline-flex items-center gap-1.5 px-3 py-2 rounded-[10px] bg-white/12 hover:bg-white/22 text-xs font-semibold text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>لوحة الإدارة</span>
                </button>
              )}
            </div>

            {/* Center: Curved Arch White Drop OR Compact Bar with Official TABA Logo */}
            <div className="flex justify-center">
              <a
                href="#/"
                onClick={(e) => {
                  e.preventDefault();
                  onSelectCategory('all');
                  onSearchChange('');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={
                  settings.theme.headerStyle === 'compact-bar'
                    ? 'bg-white rounded-xl px-4 py-1.5 mt-2 shadow-md inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#d9273e]'
                    : 'bg-white rounded-b-[26px] px-4 sm:px-6 pt-1.5 pb-2 shadow-xl inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-[#d9273e]'
                }
                aria-label="معرض طابا - الرئيسية"
              >
                <img
                  src={logoSrc}
                  alt="طابا"
                  referrerPolicy="no-referrer"
                  className="h-11 sm:h-14 w-auto max-w-[165px] object-contain block"
                />
              </a>
            </div>

            {/* Left in RTL: Favorites & Cart with Red Badges */}
            <div className="flex items-center justify-end gap-2 pt-2">
              {settings.theme.showFavoritesButton && (
                <button
                  type="button"
                  onClick={onOpenFavorites}
                  aria-label="المفضلة"
                  className="relative inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <Heart className="w-4 h-4 fill-white/20" />
                  <span className="hidden sm:inline text-xs font-semibold">المفضلة</span>
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d9273e] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                    {favorites.length}
                  </span>
                </button>
              )}

              {settings.theme.showCartButton && (
                <button
                  type="button"
                  onClick={onOpenCart}
                  aria-label="السلة"
                  className="relative inline-flex items-center justify-center gap-1.5 h-10 px-3 rounded-[10px] bg-white/15 hover:bg-white/25 text-white transition-colors cursor-pointer"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span className="hidden sm:inline text-xs font-semibold">السلة</span>
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#d9273e] text-white text-[11px] font-bold flex items-center justify-center tabular-nums">
                    {cartCount}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Search Input with Live Filtering & Suggestions Dropdown */}
          {settings.theme.showSearchBar && (
            <div ref={searchWrapRef} className="mt-2.5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="search"
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setSearchFocused(true);
                }}
                placeholder={settings.copy.searchPlaceholder}
                aria-label="بحث فوري عن المنتجات والأقسام"
                className={`w-full h-11 rounded-[14px] bg-white text-[#17243e] placeholder:text-slate-400 pr-11 ${
                  searchQuery ? 'pl-10' : 'pl-4'
                } text-sm shadow-md border-0 focus:outline-none focus:ring-2 focus:ring-[#d9273e]`}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange('');
                    setSearchFocused(true);
                  }}
                  aria-label="مسح البحث"
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center absolute left-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Live Search Suggestions Popover */}
              {showSuggestions && (
                <div className="absolute top-full inset-x-0 mt-2 rounded-2xl bg-white dark:bg-[#16203a] text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-[#29365a] shadow-2xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto">
                  {/* Matched Categories */}
                  {matchedCategories.length > 0 && (
                    <div className="p-3 border-b border-slate-100 dark:border-[#29365a]">
                      <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-2 flex items-center justify-between">
                        <span>{searchQuery.trim() ? 'الأقسام المطابقة' : 'أقسام مقترحة'}</span>
                        <span className="tabular-nums">{matchedCategories.length}</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {matchedCategories.map((cat) => {
                          const catCount = visibleProducts.filter((p) => p.categoryId === cat.id).length;
                          return (
                            <button
                              key={cat.id}
                              type="button"
                              onClick={() => {
                                onSearchChange('');
                                onSelectCategory(cat.id);
                                setSearchFocused(false);
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/50 hover:bg-[#1554b9] text-[#0b347e] dark:text-blue-200 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5" />
                              <span>{cat.name}</span>
                              <span className="opacity-75 tabular-nums">({catCount})</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Matched Products */}
                  <div className="p-3 space-y-2">
                    <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center justify-between">
                      <span>{searchQuery.trim() ? 'المنتجات المطابقة' : 'الأكثر بحثًا وطلبًا'}</span>
                      <span className="tabular-nums">{totalMatchedProducts} نتيجة</span>
                    </div>

                    {matchedProducts.length === 0 ? (
                      <div className="py-5 text-center text-xs text-slate-500 dark:text-slate-400">
                        لا توجد منتجات مطابقة لـ «{searchQuery}» — جرّب كلمة بحث أخرى.
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-100 dark:divide-[#29365a]">
                        {matchedProducts.map((prod) => {
                          const catName =
                            categories.find((c) => c.id === prod.categoryId)?.name ?? 'قسم عام';
                          const unavailable = prod.availability === 'غير متوفر';
                          return (
                            <div
                              key={prod.id}
                              className="py-2 flex items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-lg transition-colors"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSearchFocused(false);
                                  onQuickViewProduct(prod);
                                }}
                                className="flex items-center gap-3 flex-1 min-w-0 text-right cursor-pointer"
                              >
                                <div className="w-11 h-11 rounded-lg overflow-hidden border border-slate-200 dark:border-[#29365a] bg-slate-50 shrink-0">
                                  <ProductVisual
                                    visualKind={prod.visualKind}
                                    imageUrl={prod.imageUrl}
                                    alt={prod.name}
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                                    {prod.name}
                                  </div>
                                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                                    <span>{catName}</span>
                                    <span aria-hidden="true">·</span>
                                    <span
                                      className={
                                        unavailable
                                          ? 'text-[#d9273e] font-semibold'
                                          : 'text-emerald-700 dark:text-emerald-400 font-semibold'
                                      }
                                    >
                                      {prod.availability}
                                    </span>
                                    {settings.theme.showPricesOnStore && (
                                      <>
                                        <span aria-hidden="true">·</span>
                                        <span className="font-bold text-[#1554b9] dark:text-blue-300 tabular-nums">
                                          {prod.internalPrice} ج.م
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </button>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSearchFocused(false);
                                    onQuickViewProduct(prod);
                                  }}
                                  aria-label={`معاينة ${prod.name}`}
                                  className="w-8 h-8 rounded-lg border border-slate-200 dark:border-[#29365a] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#1554b9] cursor-pointer"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  type="button"
                                  disabled={unavailable || !settings.isAcceptingOrders}
                                  onClick={() => {
                                    addToCart(prod.id, 1);
                                    onQuickAddToast?.(prod.name);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#1554b9] hover:bg-[#0b347e] disabled:bg-slate-200 disabled:text-slate-400 text-white text-[11px] font-bold cursor-pointer disabled:cursor-not-allowed"
                                >
                                  <ShoppingBag className="w-3.5 h-3.5" />
                                  <span>أضف</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Footer action inside dropdown */}
                  {searchQuery.trim() && (
                    <div className="px-3 py-2.5 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-[#29365a] flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        الفلترة اللحظية مفعلة أسفل الصفحة
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchFocused(false);
                          onShowAllResults?.();
                        }}
                        className="text-xs font-bold text-[#1554b9] dark:text-blue-300 hover:underline cursor-pointer"
                      >
                        عرض كل النتائج ({totalMatchedProducts})
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Complete Slide-out Hamburger Drawer (التلات شرط — يحتوي على كل شيء) */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex justify-start no-print"
          role="dialog"
          aria-modal="true"
          aria-label="القائمة الكاملة لمعرض طابا"
          onClick={() => setDrawerOpen(false)}
        >
          <div
            className="w-[320px] max-w-[88vw] bg-white dark:bg-[#16203a] h-full p-5 overflow-y-auto flex flex-col gap-1 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Brand Header inside Drawer */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <img
                  src={logoSrc}
                  alt="معرض طابا"
                  className="h-11 w-auto object-contain"
                />
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  {settings.storeLocation || 'القناطر الخيرية'}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setDrawerOpen(false)}
                aria-label="إغلاق القائمة"
                className="w-9 h-9 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. أقسام المعرض (الورقيات، المساحيق والمنظفات، البلاستيك، إلخ) */}
            <div className="pt-3 pb-1 text-xs font-extrabold text-[#1554b9] dark:text-blue-400">
              أقسام معرض طابا
            </div>
            <button
              type="button"
              onClick={() => {
                onSelectCategory('all');
                setDrawerOpen(false);
              }}
              className={`text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold cursor-pointer ${
                selectedCategoryId === 'all'
                  ? 'text-[#1554b9] dark:text-blue-400 font-extrabold'
                  : 'text-slate-800 dark:text-slate-200'
              }`}
            >
              كل المنتجات
            </button>
            {[...categories]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(cat.id);
                    setDrawerOpen(false);
                  }}
                  className={`text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'text-[#1554b9] dark:text-blue-400 font-extrabold'
                      : 'text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            {onShowOffersFilter && settings.theme.showSpecialOffersTile && (
              <button
                type="button"
                onClick={() => {
                  onShowOffersFilter();
                  setDrawerOpen(false);
                }}
                className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-bold text-[#d9273e] flex items-center gap-2 cursor-pointer"
              >
                <Tag className="w-4 h-4" />
                <span>{settings.copy.specialOffersTileLabel} (3 أيام)</span>
              </button>
            )}

            {/* 2. من نحن وأبرز الأسئلة وخدمات العميل */}
            <div className="pt-4 pb-1 text-xs font-extrabold text-[#1554b9] dark:text-blue-400">
              معلومات وخدمات العميل
            </div>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenInfoHub('about');
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Info className="w-4 h-4 text-[#1554b9] dark:text-blue-400" />
              <span>من نحن (18 سنة من الثقة)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenInfoHub('faq');
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-[#1554b9] dark:text-blue-400" />
              <span>أبرز الأسئلة (الأسئلة الشائعة)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenTracking();
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <PackageSearch className="w-4 h-4 text-[#1554b9] dark:text-blue-400" />
              <span>متابعة وتعديل الطلب / طلباتي</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenInfoHub('returns');
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-[#1554b9] dark:text-blue-400" />
              <span>الاستبدال والاسترجاع</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenInfoHub('complaints');
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <MessageSquareWarning className="w-4 h-4 text-[#d9273e]" />
              <span>الشكاوى والمقترحات</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setDrawerOpen(false);
                onOpenInfoHub('privacy');
              }}
              className="text-right py-2 px-2 border-b border-slate-100 dark:border-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
            >
              <Shield className="w-4 h-4 text-[#1554b9] dark:text-blue-400" />
              <span>سياسة الخصوصية</span>
            </button>

            {/* 3. رابط موقعنا الرسمي */}
            <div className="pt-4 pb-1 text-xs font-extrabold text-[#1554b9] dark:text-blue-400">
              رابط موقعنا
            </div>
            <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 p-2.5 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-200 truncate">
                <Globe className="w-3.5 h-3.5 text-[#1554b9] dark:text-blue-400 shrink-0" />
                <span className="truncate font-mono text-[11px]" dir="ltr">
                  {websiteUrl}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyWebsiteUrl}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 rounded-lg bg-[#1554b9] text-white text-[11px] font-bold cursor-pointer"
                >
                  {siteLinkCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{siteLinkCopied ? 'تم نسخ الرابط' : 'نسخ رابط الموقع'}</span>
                </button>
                <a
                  href={websiteUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-[11px] font-bold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>فتح</span>
                </a>
              </div>
            </div>

            {/* 4. روابط التواصل الاجتماعي بتاعتنا */}
            <div className="pt-4 pb-1 text-xs font-extrabold text-[#1554b9] dark:text-blue-400">
              روابط التواصل الاجتماعي
            </div>
            <div className="grid grid-cols-2 gap-2 py-1">
              <a
                href={buildGeneralWhatsAppUrl(undefined, settings.whatsappNumber)}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#168b53] text-white text-xs font-bold inline-flex items-center justify-center gap-1.5"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>واتساب</span>
              </a>
              <a
                href={settings.socialLinks.facebookUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#1877f2] text-white text-xs font-bold text-center"
              >
                فيسبوك
              </a>
              <a
                href={settings.socialLinks.messengerUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#0084ff] text-white text-xs font-bold text-center"
              >
                ماسنجر
              </a>
              <a
                href={settings.socialLinks.instagramUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-gradient-to-tr from-[#f09433] via-[#dc2743] to-[#bc1888] text-white text-xs font-bold text-center"
              >
                إنستجرام
              </a>
              <a
                href={settings.socialLinks.tiktokUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#111] text-white text-xs font-bold text-center"
              >
                تيك توك
              </a>
              <a
                href={settings.socialLinks.googleMapsUrl || '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded-lg bg-[#d9273e] text-white text-xs font-bold inline-flex items-center justify-center gap-1"
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>الموقع بالخريطة</span>
              </a>
            </div>

            {/* 5. المظهر & الإدارة */}
            <div className="pt-3 space-y-2 border-t border-slate-100 dark:border-slate-800 mt-2">
              {settings.theme.showDarkModeToggle && (
                <button
                  type="button"
                  onClick={onToggleDark}
                  className="w-full text-right py-2 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  {isDark ? (
                    <>
                      <Sun className="w-4 h-4 text-amber-500" />
                      <span>التبديل للوضع النهاري</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-4 h-4 text-slate-600" />
                      <span>التبديل للوضع الليلي</span>
                    </>
                  )}
                </button>
              )}

              {settings.splashEnabled && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    window.dispatchEvent(new Event('taba-open-splash'));
                  }}
                  className="w-full text-right py-2 px-2 text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>عرض شاشة الترحيب (18 سنة)</span>
                </button>
              )}

              {settings.theme.showAdminLinkToCustomers && (
                <button
                  type="button"
                  onClick={() => {
                    setDrawerOpen(false);
                    setCurrentView('admin');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-[#0b347e] text-white text-sm font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>الدخول للوحة الإدارة</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
