import React, { useEffect } from 'react';
import { Heart, ShoppingBag, Trash2, X } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Product } from '../../types/taba';
import { ProductVisual } from '../ProductVisual';

interface FavoritesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProduct: (product: Product) => void;
}

export const FavoritesDrawer: React.FC<FavoritesDrawerProps> = ({
  isOpen,
  onClose,
  onSelectProduct,
}) => {
  const { favorites, products, toggleFavorite, clearFavorites, addToCart, settings } = useTaba();

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const favProducts = products.filter((p) => favorites.includes(p.id));
  const availableFavs = favProducts.filter((p) => p.availability !== 'غير متوفر');

  const handleAddAllFavs = () => {
    if (!settings.isAcceptingOrders) return;
    availableFavs.forEach((p) => addToCart(p.id, 1));
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="المنتجات المفضلة"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white text-slate-900 h-full flex flex-col border-r border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-[#DC2626]" />
            <h2 className="text-lg font-bold text-slate-900">
              المفضلة ({favProducts.length})
            </h2>
          </div>
          <div className="flex items-center gap-2">
            {favProducts.length > 0 && (
              <button
                type="button"
                onClick={clearFavorites}
                className="text-xs font-semibold text-[#DC2626] hover:underline px-2 py-1 cursor-pointer"
              >
                مسح الكل
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="إغلاق المفضلة"
              className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {favProducts.length > 0 && availableFavs.length > 0 && settings.isAcceptingOrders && (
            <button
              type="button"
              onClick={handleAddAllFavs}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1554b9] hover:bg-[#0b347e] text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>إضافة جميع المنتجات المتوفرة للسلة ({availableFavs.length})</span>
            </button>
          )}
          {favProducts.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Heart className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-sm font-bold text-slate-900">لا توجد منتجات في المفضلة</div>
              <p className="text-xs text-slate-500">
                اضغط على رمز القلب بجانب أي منتج لحفظه هنا للرجوع إليه لاحقًا.
              </p>
            </div>
          ) : (
            favProducts.map((prod) => (
              <div
                key={prod.id}
                className="rounded-xl border border-slate-200 p-3 flex items-center gap-3"
              >
                <div
                  onClick={() => {
                    onClose();
                    onSelectProduct(prod);
                  }}
                  className="w-16 h-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0 cursor-pointer"
                >
                  <ProductVisual
                    visualKind={prod.visualKind}
                    imageUrl={prod.imageUrl}
                    alt={prod.name}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    onClick={() => {
                      onClose();
                      onSelectProduct(prod);
                    }}
                    className="text-sm font-bold text-slate-900 truncate cursor-pointer hover:text-[#1D4ED8]"
                  >
                    {prod.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{prod.availability}</div>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    disabled={prod.availability === 'غير متوفر' || !settings.isAcceptingOrders}
                    onClick={() => addToCart(prod.id, 1)}
                    aria-label="إضافة للسلة"
                    className="p-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-200 text-white cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(prod.id)}
                    aria-label="إزالة من المفضلة"
                    className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
