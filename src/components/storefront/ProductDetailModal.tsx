import React, { useEffect, useState } from 'react';
import {
  Check,
  Heart,
  MessageCircle,
  Minus,
  Plus,
  Share2,
  ShoppingBag,
  Star,
  X,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Product } from '../../types/taba';
import { buildQuickWhatsAppProductOrderUrl } from '../../utils/whatsapp';
import { ProductVisual } from '../ProductVisual';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onOpenCart: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onOpenCart,
}) => {
  const {
    categories,
    favorites,
    toggleFavorite,
    addToCart,
    reviews,
    submitProductReview,
    settings,
  } = useTaba();

  const [qty, setQty] = useState(1);
  const [copied, setCopied] = useState(false);
  const [reviewerName, setReviewerName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  useEffect(() => {
    setQty(1);
    setCopied(false);
    setReviewSubmitted(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [product, onClose]);

  if (!product) return null;

  const categoryName =
    categories.find((c) => c.id === product.categoryId)?.name ?? 'قسم عام';
  const isFav = favorites.includes(product.id);
  const isUnavailable = product.availability === 'غير متوفر';
  const approvedReviews = reviews.filter(
    (r) => r.productId === product.id && r.status === 'approved'
  );
  const avgRating =
    approvedReviews.length > 0
      ? (approvedReviews.reduce((s, r) => s + r.rating, 0) / approvedReviews.length).toFixed(1)
      : null;

  const handleOrderProduct = () => {
    if (isUnavailable || !settings.isAcceptingOrders) return;
    addToCart(product.id, qty);
    onClose();
    onOpenCart();
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}${window.location.pathname}#product-${product.id}`;
    try {
      await navigator.clipboard.writeText(`${product.name} — معرض طابا\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Ignore clipboard failure
    }
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewerName.trim() || !comment.trim()) return;
    submitProductReview({
      productId: product.id,
      customerName: reviewerName,
      rating,
      comment,
    });
    setReviewerName('');
    setComment('');
    setRating(5);
    setReviewSubmitted(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label={`تفاصيل ${product.name}`}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
          <div className="text-xs sm:text-sm text-slate-500">
            <span>{categoryName}</span>
            <span className="mx-2">·</span>
            <span className="font-medium text-slate-900">تفاصيل المنتج</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-50 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto p-6 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            {/* Large Product Image */}
            <div className="md:col-span-6 aspect-[4/3] rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <ProductVisual
                visualKind={product.visualKind}
                imageUrl={product.imageUrl}
                alt={product.name}
              />
            </div>

            {/* Contiguous Purchase Module */}
            <div className="md:col-span-6 space-y-5">
              <div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{categoryName}</span>
                  <span>·</span>
                  <span
                    className={`font-semibold ${
                      product.availability === 'متوفر'
                        ? 'text-emerald-700'
                        : product.availability === 'كمية محدودة'
                        ? 'text-amber-700'
                        : 'text-[#DC2626]'
                    }`}
                  >
                    {product.availability}
                  </span>
                  {avgRating && (
                    <>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 font-bold text-amber-600 tabular-nums">
                        <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                        <span>{avgRating}</span>
                      </span>
                    </>
                  )}
                </div>
                <h2 className="mt-2 text-2xl font-bold text-slate-900 leading-snug">
                  {product.name}
                </h2>
                <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
                  {product.shortDescription}
                </p>
              </div>

              {/* Price Display / Policy Notice */}
              {settings.theme.showPricesOnStore ? (
                <div className="rounded-xl bg-blue-50/70 border border-blue-200 p-3.5 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs text-slate-600">سعر الوحدة التقديري</div>
                    <div className="text-xl font-extrabold text-[#0b347e] tabular-nums">
                      {product.internalPrice} ج.م
                    </div>
                  </div>
                  <div className="text-left">
                    <div className="text-xs text-slate-600">إجمالي ({qty}) قطعة</div>
                    <div className="text-base font-bold text-slate-900 tabular-nums">
                      {product.internalPrice * qty} ج.م
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs sm:text-sm text-slate-700">
                  الأسعار لا تُعرض على الموقع؛ أضف المنتج لطلبك أو استخدم زر <strong>الطلب السريع عبر واتساب</strong> لمعرفة السعر الإجمالي فورًا.
                </div>
              )}

              {/* Quantity Stepper */}
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-700">الكمية:</span>
                <div className="inline-flex items-center rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setQty((q) => Math.max(1, q - 1))}
                    aria-label="تقليل الكمية"
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center text-sm font-bold tabular-nums">{qty}</span>
                  <button
                    type="button"
                    onClick={() => setQty((q) => q + 1)}
                    aria-label="زيادة الكمية"
                    className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Primary CTAs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={handleOrderProduct}
                  disabled={isUnavailable || !settings.isAcceptingOrders}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-200 disabled:text-slate-400 text-white text-sm font-bold transition-colors whitespace-nowrap cursor-pointer disabled:cursor-not-allowed"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isUnavailable ? 'غير متوفر حاليًا' : 'اطلب المنتج'}</span>
                </button>

                <a
                  href={buildQuickWhatsAppProductOrderUrl(
                    product.name,
                    qty,
                    categoryName,
                    settings.whatsappNumber
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-lg bg-[#168b53] hover:bg-[#137445] text-white text-sm font-bold transition-colors whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>الطلب السريع عبر واتساب</span>
                </a>
              </div>

              {/* Secondary Actions: Favorite & Share */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => toggleFavorite(product.id)}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Heart
                    className={`w-4 h-4 ${isFav ? 'fill-[#DC2626] text-[#DC2626]' : 'text-slate-500'}`}
                  />
                  <span>{isFav ? 'في المفضلة' : 'إضافة للمفضلة'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleShare}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Share2 className="w-4 h-4 text-slate-500" />}
                  <span>{copied ? 'تم نسخ رابط المنتج' : 'مشاركة المنتج'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Product Reviews Section (Toggleable in Admin) */}
          {settings.allowProductReviews && (
            <div className="pt-6 border-t border-slate-200 grid grid-cols-1 md:grid-cols-12 gap-8">
              <div className="md:col-span-7 space-y-4">
                <h3 className="text-lg font-bold text-slate-900">
                  تقييمات العملاء المعتمدة ({approvedReviews.length})
                </h3>
                {approvedReviews.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    لا توجد تقييمات منشورة لهذا المنتج بعد. يمكنك إضافة تقييمك بعد التجربة.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {approvedReviews.map((rev) => (
                      <div key={rev.id} className="rounded-xl border border-slate-200 p-4">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-sm font-bold text-slate-900">{rev.customerName}</span>
                          <div className="flex items-center gap-0.5 text-amber-500">
                            {Array.from({ length: rev.rating }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                            ))}
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <form
                onSubmit={handleReviewSubmit}
                className="md:col-span-5 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <h4 className="text-sm font-bold text-slate-900">أضف تقييمك للمنتج</h4>
                {reviewSubmitted ? (
                  <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                    تم إرسال تقييمك بنجاح، وسيظهر بعد مراجعة واعتماد الإدارة.
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      required
                      value={reviewerName}
                      onChange={(e) => setReviewerName(e.target.value)}
                      placeholder="اسمك"
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                    <div className="flex items-center gap-2 text-xs text-slate-700">
                      <span>التقييم:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setRating(star)}
                          className="p-1 cursor-pointer"
                          aria-label={`${star} نجوم`}
                        >
                          <Star
                            className={`w-4 h-4 ${
                              star <= rating ? 'fill-amber-500 text-amber-500' : 'text-slate-300'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      rows={3}
                      required
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="اكتب رأيك في جودة المنتج..."
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      إرسال التقييم للمراجعة
                    </button>
                  </>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
