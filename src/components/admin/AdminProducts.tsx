import React, { useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Edit3, ImagePlus, Plus, Search, Trash2, X } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { AvailabilityStatus, Product, ProductVisualKind } from '../../types/taba';
import { compressImageToWebP, formatBytes } from '../../utils/imageProcessor';
import { ProductVisual } from '../ProductVisual';

export const AdminProducts: React.FC = () => {
  const {
    products,
    categories,
    saveProduct,
    deleteProduct,
    addCategory,
    updateCategoryDetails,
    moveCategory,
    deleteCategory,
  } = useTaba();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '');
  const [availability, setAvailability] = useState<AvailabilityStatus>('متوفر');
  const [stockQty, setStockQty] = useState(20);
  const [lowStockThreshold, setLowStockThreshold] = useState(8);
  const [internalPrice, setInternalPrice] = useState(100);
  const [isNew, setIsNew] = useState(true);
  const [isOffer, setIsOffer] = useState(false);
  const [isFeaturedPick, setIsFeaturedPick] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [visualKind, setVisualKind] = useState<ProductVisualKind>('tissue');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);
  const [originalImageUrl, setOriginalImageUrl] = useState<string | undefined>(undefined);
  const [keepOriginalImage, setKeepOriginalImage] = useState(false);
  const [compressionInfo, setCompressionInfo] = useState<string | null>(null);

  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState<ProductVisualKind>('personalcare');
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editingCatName, setEditingCatName] = useState('');
  const [editingCatIcon, setEditingCatIcon] = useState<ProductVisualKind>('tissue');
  const [tableQuery, setTableQuery] = useState('');

  const sortedCategories = useMemo(
    () => [...categories].sort((a, b) => a.sortOrder - b.sortOrder),
    [categories]
  );

  const filteredProducts = useMemo(() => {
    const q = tableQuery.trim().toLowerCase();
    if (!q) return products;
    return products.filter((p) => {
      const cat = categories.find((c) => c.id === p.categoryId)?.name ?? '';
      return `${p.name} ${cat} ${p.availability}`.toLowerCase().includes(q);
    });
  }, [products, categories, tableQuery]);

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setShortDescription('');
    setCategoryId(categories[0]?.id ?? '');
    setAvailability('متوفر');
    setStockQty(20);
    setLowStockThreshold(8);
    setInternalPrice(100);
    setIsNew(true);
    setIsOffer(false);
    setIsFeaturedPick(false);
    setIsVisible(true);
    setVisualKind('tissue');
    setImageUrl(undefined);
    setOriginalImageUrl(undefined);
    setCompressionInfo(null);
  };

  const loadForEdit = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setShortDescription(prod.shortDescription);
    setCategoryId(prod.categoryId);
    setAvailability(prod.availability);
    setStockQty(prod.stockQty);
    setLowStockThreshold(prod.lowStockThreshold);
    setInternalPrice(prod.internalPrice);
    setIsNew(prod.isNew);
    setIsOffer(prod.isOffer);
    setIsFeaturedPick(prod.isFeaturedPick);
    setIsVisible(prod.isVisible);
    setVisualKind(prod.visualKind);
    setImageUrl(prod.imageUrl);
    setOriginalImageUrl(prod.originalImageUrl);
    setKeepOriginalImage(Boolean(prod.originalImageUrl));
    setCompressionInfo(prod.originalImageUrl ? 'تم الاحتفاظ بنسخة أصلية مع النسخة المضغوطة' : null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await compressImageToWebP(file, 960, 0.82);
      setImageUrl(result.dataUrl);

      if (keepOriginalImage) {
        const reader = new FileReader();
        reader.onload = () => setOriginalImageUrl(String(reader.result));
        reader.readAsDataURL(file);
      } else {
        setOriginalImageUrl(undefined);
      }

      setCompressionInfo(
        `تمت المعالجة (${result.format.toUpperCase()}) · ${result.width}×${result.height} · ${formatBytes(
          result.originalBytes
        )} ← ${formatBytes(result.compressedBytes)} (توفير ${result.savedPercent}%)${
          keepOriginalImage ? ' + احتفاظ بالأصل' : ''
        }`
      );
    } catch {
      setCompressionInfo('تعذر ضغط الصورة، يرجى اختيار صورة صالحة');
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    saveProduct({
      id: editingId ?? undefined,
      name: name.trim(),
      shortDescription: shortDescription.trim(),
      categoryId,
      availability,
      stockQty,
      lowStockThreshold,
      internalPrice,
      isNew,
      isOffer,
      isFeaturedPick,
      isVisible,
      visualKind,
      imageUrl,
      originalImageUrl: keepOriginalImage ? originalImageUrl : undefined,
    });
    resetForm();
  };

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    addCategory(newCategoryName, newCategoryIcon);
    setNewCategoryName('');
    setNewCategoryIcon('personalcare');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">إدارة المنتجات والأقسام والمخزون</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          الأسعار الداخلية تُحفظ للموظفين فقط ولا تظهر للعملاء. الصور تُضغط وتُحوّل تلقائيًا إلى WebP مع خيار الاحتفاظ بالأصل.
        </p>
      </div>

      {/* Categories Manager: Add, Rename, Icon, Reorder, Delete */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900">الأقسام الحالية (الاسم والأيقونة والترتيب)</h3>
        <div className="space-y-2">
          {sortedCategories.map((cat, idx) => (
            <div
              key={cat.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800"
            >
              {editingCatId === cat.id ? (
                <div className="flex flex-wrap items-center gap-2 flex-1">
                  <input
                    type="text"
                    value={editingCatName}
                    onChange={(e) => setEditingCatName(e.target.value)}
                    className="rounded border border-slate-300 bg-white px-2.5 py-1 text-xs"
                  />
                  <select
                    value={editingCatIcon}
                    onChange={(e) => setEditingCatIcon(e.target.value as ProductVisualKind)}
                    className="rounded border border-slate-300 bg-white px-2 py-1 text-xs"
                  >
                    <option value="tissue">أيقونة ورقيات</option>
                    <option value="detergent">أيقونة منظفات</option>
                    <option value="plastic">أيقونة بلاستيك</option>
                    <option value="kitchenware">أيقونة أدوات منزلية</option>
                    <option value="personalcare">أيقونة عناية وإكسسوارات</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => {
                      updateCategoryDetails(cat.id, {
                        name: editingCatName,
                        iconKey: editingCatIcon,
                      });
                      setEditingCatId(null);
                    }}
                    className="p-1 text-emerald-700 cursor-pointer"
                    aria-label="حفظ تعديل القسم"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingCatId(null)}
                    className="p-1 text-slate-500 cursor-pointer"
                    aria-label="إلغاء"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <span className="font-bold">
                  {idx + 1}. {cat.name}
                </span>
              )}

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => moveCategory(cat.id, 'up')}
                  disabled={idx === 0}
                  aria-label="تحريك القسم لأعلى"
                  className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveCategory(cat.id, 'down')}
                  disabled={idx === sortedCategories.length - 1}
                  aria-label="تحريك القسم لأسفل"
                  className="p-1 rounded border border-slate-200 bg-white disabled:opacity-40 cursor-pointer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingCatId(cat.id);
                    setEditingCatName(cat.name);
                    setEditingCatIcon(cat.iconKey ?? 'personalcare');
                  }}
                  aria-label={`تعديل ${cat.name}`}
                  className="p-1 rounded border border-slate-200 bg-white text-[#1D4ED8] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                {categories.length > 1 && (
                  <button
                    type="button"
                    onClick={() => deleteCategory(cat.id)}
                    aria-label={`حذف قسم ${cat.name}`}
                    className="p-1 rounded border border-slate-200 bg-white text-slate-400 hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddCategory} className="flex flex-wrap items-center gap-2 max-w-xl pt-2">
          <input
            type="text"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="إضافة قسم جديد..."
            className="flex-1 min-w-[180px] rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
          />
          <select
            value={newCategoryIcon}
            onChange={(e) => setNewCategoryIcon(e.target.value as ProductVisualKind)}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold"
          >
            <option value="tissue">أيقونة ورقيات</option>
            <option value="detergent">أيقونة منظفات</option>
            <option value="plastic">أيقونة بلاستيك</option>
            <option value="kitchenware">أيقونة أدوات منزلية</option>
            <option value="personalcare">أيقونة عناية وإكسسوارات</option>
          </select>
          <button
            type="submit"
            className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>إضافة قسم</span>
          </button>
        </form>
      </div>

      {/* Add / Edit Product Form */}
      <form
        onSubmit={handleSave}
        className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900">
            {editingId ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </h3>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="text-xs font-semibold text-slate-600 hover:underline cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">اسم المنتج *</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: مناديل مطبخ فائقة الامتصاص"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">القسم</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {sortedCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">وصف مختصر</label>
          <input
            type="text"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="وصف واضح ومباشر للعميل"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حالة التوفر</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value as AvailabilityStatus)}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <option value="متوفر">متوفر</option>
              <option value="كمية محدودة">كمية محدودة</option>
              <option value="غير متوفر">غير متوفر</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">الكمية بالمخزون</label>
            <input
              type="number"
              min={0}
              value={stockQty}
              onChange={(e) => setStockQty(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">حد تنبيه المخزون</label>
            <input
              type="number"
              min={0}
              value={lowStockThreshold}
              onChange={(e) => setLowStockThreshold(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              السعر الداخلي (ج.م)
            </label>
            <input
              type="number"
              min={0}
              value={internalPrice}
              onChange={(e) => setInternalPrice(Number(e.target.value) || 0)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
        </div>

        {/* Image Upload + Auto WebP Compression + Retain Original Option */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-bold text-slate-800 hover:border-[#1D4ED8] cursor-pointer">
                <ImagePlus className="w-4 h-4 text-[#1D4ED8]" />
                <span>رفع صورة وضغطها تلقائيًا (WebP)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              </label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => {
                    setImageUrl(undefined);
                    setOriginalImageUrl(undefined);
                    setCompressionInfo(null);
                  }}
                  className="text-xs text-[#DC2626] underline cursor-pointer"
                >
                  حذف الصورة
                </button>
              )}
            </div>

            <label className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={keepOriginalImage}
                onChange={(e) => setKeepOriginalImage(e.target.checked)}
              />
              <span>الاحتفاظ بنسخة من الصورة الأصلية عند الحاجة</span>
            </label>

            {compressionInfo && (
              <p className="text-[11px] font-medium text-emerald-700">{compressionInfo}</p>
            )}
            {!imageUrl && (
              <div className="flex items-center gap-2 text-xs text-slate-600 pt-1">
                <span>أو رسم توضيحي مؤقت:</span>
                <select
                  value={visualKind}
                  onChange={(e) => setVisualKind(e.target.value as ProductVisualKind)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  <option value="tissue">ورقيات</option>
                  <option value="detergent">منظفات</option>
                  <option value="plastic">بلاستيك</option>
                  <option value="kitchenware">أدوات منزلية</option>
                  <option value="personalcare">عناية شخصية</option>
                </select>
              </div>
            )}
          </div>

          <div className="w-32 h-24 rounded-lg border border-slate-200 bg-white overflow-hidden">
            <ProductVisual visualKind={visualKind} imageUrl={imageUrl} alt="معاينة الصورة" />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-5 text-xs font-semibold text-slate-700">
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isNew} onChange={(e) => setIsNew(e.target.checked)} />
            <span>وسم «جديد»</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isOffer} onChange={(e) => setIsOffer(e.target.checked)} />
            <span>تفعيل عرض (3 أيام)</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isFeaturedPick}
              onChange={(e) => setIsFeaturedPick(e.target.checked)}
            />
            <span>ضمن «ترشيحات طابا»</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isVisible}
              onChange={(e) => setIsVisible(e.target.checked)}
            />
            <span>ظاهر للعملاء</span>
          </label>
        </div>

        <button
          type="submit"
          className="px-6 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold cursor-pointer"
        >
          {editingId ? 'حفظ تعديلات المنتج' : 'إضافة المنتج للمعرض'}
        </button>
      </form>

      {/* Products Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold text-slate-900">
            قائمة المنتجات ({filteredProducts.length})
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
            <input
              type="search"
              value={tableQuery}
              onChange={(e) => setTableQuery(e.target.value)}
              placeholder="بحث في المنتجات..."
              className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-1.5 text-xs"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-right">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
              <tr>
                <th className="p-3 font-semibold">المنتج</th>
                <th className="p-3 font-semibold">القسم</th>
                <th className="p-3 font-semibold">السعر الداخلي</th>
                <th className="p-3 font-semibold">المخزون</th>
                <th className="p-3 font-semibold">الحالة</th>
                <th className="p-3 font-semibold">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((prod) => (
                <tr key={prod.id} className="hover:bg-slate-50">
                  <td className="p-3 font-semibold text-slate-900">
                    {prod.name}
                    {!prod.isVisible && (
                      <span className="mr-2 text-[11px] text-slate-400">(مخفي)</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-600">
                    {categories.find((c) => c.id === prod.categoryId)?.name ?? '—'}
                  </td>
                  <td className="p-3 tabular-nums font-semibold text-slate-900">
                    {prod.internalPrice} ج.م
                  </td>
                  <td
                    className={`p-3 tabular-nums font-bold ${
                      prod.stockQty <= prod.lowStockThreshold ? 'text-[#DC2626]' : 'text-slate-700'
                    }`}
                  >
                    {prod.stockQty}
                  </td>
                  <td className="p-3 text-slate-700">{prod.availability}</td>
                  <td className="p-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => loadForEdit(prod)}
                      className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
                    >
                      تعديل
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(prod.id)}
                      className="text-xs font-semibold text-[#DC2626] hover:underline cursor-pointer"
                    >
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
