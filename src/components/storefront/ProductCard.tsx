import React, { useState } from 'react';
import { Check, Eye, Heart, Share2, ShoppingBag } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Product } from '../../types/taba';
import { resolveSiteTheme } from '../../utils/themePresets';
import { ProductVisual } from '../ProductVisual';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
  onQuickAddFeedback?: (productName: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onOpenDetail,
  onQuickAddFeedback,
}) => {
  const { categories, favorites, toggleFavorite, addToCart, settings } = useTaba();
  const resolvedTheme = resolveSiteTheme(settings.theme);
  const [copied, setCopied] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? 'قسم عام';
  const isFav = favorites.includes(product.id);
  const isUnavailable = product.availability === 'غير متوفر';

  const isOfferActive =
    product.isOffer &&
    (!product.offerExpiresAt || new Date(product.offerExpiresAt).getTime() > Date.now());

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}${window.location.pathname}#product-${product.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${product.name} | معرض طابا`,
          text: product.shortDescription,
          url: shareUrl,
        });
      } else {
        await navigator.clipboard.writeText(`${product.name} — معرض طابا\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 1800);
      }
    } catch {
      // User dismissed share sheet
    }
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isUnavailable || !settings.isAcceptingOrders) return;
    addToCart(product.id, 1);
    onQuickAddFeedback?.(product.name);
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 1400);
  };

  const availabilityColor =
    product.availability === 'متوفر'
      ? 'text-[#17803d] dark:text-[#4cc57a]'
      : product.availability === 'كمية محدودة'
      ? 'text-amber-700 dark:text-amber-400'
      : 'text-[#d9273e]';

  return (
    <article
      onClick={() => onOpenDetail(product)}
      className={`group ${resolvedTheme.cardRadius} border border-[#e7ecf5] dark:border-[#29365a] bg-white dark:bg-[#16203a] shadow-[0_7px_22px_rgba(20,45,90,0.055)] overflow-hidden flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_14px_28px_rgba(20,45,90,0.12)] cursor-pointer`}
    >
      <div>
        <div className="relative h-[160px] sm:h-[185px] bg-gradient-to-br from-[#f6f8fc] to-white dark:from-[#1d2a4a] dark:to-[#16203a] border-b border-[#e7ecf5] dark:border-[#29365a] overflow-hidden p-3 flex items-center justify-center">
          <ProductVisual
            visualKind={product.visualKind}
            imageUrl={product.imageUrl}
            alt={product.name}
          />

          {(isOfferActive || product.isNew) && (
            <span
              className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold text-white ${
                isOfferActive ? 'bg-[#d9273e]' : 'bg-[#1554b9]'
              }`}
            >
              {isOfferActive ? 'عرض' : 'جديد'}
            </span>
          )}

          <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onOpenDetail(product);
              }}
              aria-label="معاينة سريعة للمنتج"
              className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#0d1424]/85 border border-[#dbe3f1] dark:border-[#29365a] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#1554b9] transition-colors cursor-pointer"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(product.id);
              }}
              aria-label={isFav ? 'إزالة من المفضلة' : 'إضافة للمفضلة'}
              className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#0d1424]/85 border border-[#dbe3f1] dark:border-[#29365a] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#d9273e] transition-colors cursor-pointer"
            >
              <Heart
                className={`w-4 h-4 ${isFav ? 'fill-[#d9273e] text-[#d9273e]' : ''}`}
              />
            </button>
            <button
              type="button"
              onClick={handleShare}
              aria-label="مشاركة المنتج"
              className="w-8 h-8 rounded-lg bg-white/95 dark:bg-[#0d1424]/85 border border-[#dbe3f1] dark:border-[#29365a] flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-[#1554b9] transition-colors cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-[#17803d]" /> : <Share2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="p-3.5 sm:p-4">
          <div className="flex items-center gap-2 text-xs text-[#69758d] dark:text-[#9aa8c7]">
            <span>{categoryName}</span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${availabilityColor}`}>{product.availability}</span>
          </div>

          <h4 className="mt-1.5 text-[15px] sm:text-base font-bold text-[#17243e] dark:text-[#eaf0fd] leading-snug line-clamp-2">
            {product.name}
          </h4>
          <p className="mt-1 text-xs sm:text-[13px] text-[#69758d] dark:text-[#9aa8c7] leading-relaxed line-clamp-2">
            {product.shortDescription}
          </p>
          {settings.theme.showPricesOnStore && (
            <div className="mt-2 text-sm font-extrabold text-[#1554b9] dark:text-blue-300 tabular-nums">
              {product.internalPrice} ج.م
            </div>
          )}
        </div>
      </div>

      <div className="px-3.5 sm:px-4 pb-3.5 sm:pb-4 pt-1 flex items-center gap-2">
        <button
          type="button"
          onClick={handleQuickAdd}
          disabled={isUnavailable || !settings.isAcceptingOrders}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2.5 ${resolvedTheme.buttonRadius} text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed shadow-[0_4px_10px_rgba(21,84,185,0.12)] ${
            isUnavailable || !settings.isAcceptingOrders
              ? 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 shadow-none'
              : justAdded
              ? 'bg-[#17803d] text-white'
              : resolvedTheme.primaryBtn
          }`}
        >
          {justAdded ? (
            <>
              <Check className="w-4 h-4" />
              <span>تمت الإضافة</span>
            </>
          ) : isUnavailable ? (
            <span>غير متوفر</span>
          ) : (
            <>
              <ShoppingBag className="w-4 h-4" />
              <span>أضف للسلة</span>
            </>
          )}
        </button>
      </div>
    </article>
  );
};
