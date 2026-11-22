import React, { useState } from 'react';
import { Calendar, Layers, RefreshCw, Tag, Trash2 } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Coupon } from '../../types/taba';

function toDateInput(iso?: string): string {
  if (!iso) return new Date().toISOString().slice(0, 10);
  return new Date(iso).toISOString().slice(0, 10);
}

export const AdminOffersCoupons: React.FC = () => {
  const {
    products,
    categories,
    coupons,
    orders,
    renewProductOfferThreeDays,
    applyBulkOffer,
    saveProduct,
    saveCoupon,
    deleteCoupon,
  } = useTaba();

  // Bulk Offer Creator State
  const [bulkScope, setBulkScope] = useState<'category' | 'custom'>('category');
  const [bulkCategoryId, setBulkCategoryId] = useState(categories[0]?.id ?? '');
  const [selectedProdIds, setSelectedProdIds] = useState<string[]>([]);
  const [offerStartDate, setOfferStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [offerEndDate, setOfferEndDate] = useState(() =>
    new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);

  // Coupon Form State
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent');
  const [discountValue, setDiscountValue] = useState(10);
  const [minItemsCount, setMinItemsCount] = useState(2);
  const [maxUses, setMaxUses] = useState(50);
  const [daysValid, setDaysValid] = useState(7);

  const handleBulkOfferApply = (e: React.FormEvent) => {
    e.preventDefault();
    const targetIds =
      bulkScope === 'category'
        ? products.filter((p) => p.categoryId === bulkCategoryId).map((p) => p.id)
        : selectedProdIds;
    if (targetIds.length === 0) {
      setBulkMessage('يرجى اختيار قسم يحتوي على منتجات أو تحديد منتج واحد على الأقل.');
      return;
    }
    const startIso = new Date(`${offerStartDate}T00:00:00`).toISOString();
    const endIso = new Date(`${offerEndDate}T23:59:59`).toISOString();
    applyBulkOffer({
      productIds: targetIds,
      startsAt: startIso,
      expiresAt: endIso,
      active: true,
    });
    setBulkMessage(`تم تفعيل العرض على ${targetIds.length} منتج من ${offerStartDate} حتى ${offerEndDate}`);
  };

  const handleCreateOrUpdateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    const existing = editingCouponId
      ? coupons.find((c) => c.id === editingCouponId)
      : undefined;

    const newCoupon: Coupon = {
      id: existing ? existing.id : `coup-${Date.now()}`,
      code: code.trim().toUpperCase(),
      description: description.trim() || `خصم ${discountValue}`,
      discountType,
      discountValue,
      minItemsCount,
      maxUses,
      usedCount: existing ? existing.usedCount : 0,
      expiresAt: new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString(),
      isActive: existing ? existing.isActive : true,
    };
    saveCoupon(newCoupon);
    setEditingCouponId(null);
    setCode('');
    setDescription('');
  };

  const loadCouponForEdit = (c: Coupon) => {
    setEditingCouponId(c.id);
    setCode(c.code);
    setDescription(c.description);
    setDiscountType(c.discountType);
    setDiscountValue(c.discountValue);
    setMinItemsCount(c.minItemsCount);
    setMaxUses(c.maxUses);
    const remainingDays = Math.max(
      1,
      Math.ceil((new Date(c.expiresAt).getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    );
    setDaysValid(remainingDays);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">العروض (3 أيام) والكوبونات</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          كل عرض يستمر لمدة 3 أيام افتراضيًا وينتهي تلقائيًا ما لم يتم تجديده. يمكنك إنشاء عروض على قسم كامل أو منتجات محددة مع تاريخ بداية ونهاية.
        </p>
      </div>

      {/* Bulk Offer Creator by Category or Selected Products */}
      <form
        onSubmit={handleBulkOfferApply}
        className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
      >
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#DC2626]" />
          <span>إنشاء عرض مؤقت (على قسم كامل أو منتجات محددة)</span>
        </h3>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBulkScope('category')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              bulkScope === 'category'
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            حسب القسم
          </button>
          <button
            type="button"
            onClick={() => setBulkScope('custom')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
              bulkScope === 'custom'
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-slate-100 text-slate-700'
            }`}
          >
            اختيار منتجات محددة
          </button>
        </div>

        {bulkScope === 'category' ? (
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">اختر القسم</label>
            <select
              value={bulkCategoryId}
              onChange={(e) => setBulkCategoryId(e.target.value)}
              className="w-full sm:max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({products.filter((p) => p.categoryId === c.id).length} منتج)
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-44 overflow-y-auto border border-slate-200 rounded-lg p-3 bg-slate-50">
            {products.map((p) => (
              <label key={p.id} className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProdIds.includes(p.id)}
                  onChange={(e) =>
                    setSelectedProdIds((prev) =>
                      e.target.checked ? [...prev, p.id] : prev.filter((id) => id !== p.id)
                    )
                  }
                />
                <span className="truncate">{p.name}</span>
              </label>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>تاريخ بداية العرض</span>
            </label>
            <input
              type="date"
              required
              value={offerStartDate}
              onChange={(e) => setOfferStartDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>تاريخ نهاية العرض (افتراضي 3 أيام)</span>
            </label>
            <input
              type="date"
              required
              value={offerEndDate}
              onChange={(e) => setOfferEndDate(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#DC2626] hover:bg-[#b81f33] text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            تفعيل العرض المحدد
          </button>
        </div>

        {bulkMessage && (
          <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
            {bulkMessage}
          </div>
        )}
      </form>

      {/* 3-day Product Offers List */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900">حالة العروض الحالية على المنتجات</h3>
        <div className="divide-y divide-slate-100">
          {products.map((p) => {
            const isExpired =
              p.isOffer &&
              p.offerExpiresAt &&
              new Date(p.offerExpiresAt).getTime() <= Date.now();
            return (
              <div
                key={p.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div>
                  <div className="font-semibold text-slate-900">{p.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                    {!p.isOffer
                      ? 'لا يوجد عرض مفعل'
                      : isExpired
                      ? 'انتهى العرض (3 أيام)'
                      : `عرض نشط: ${toDateInput(p.offerStartsAt)} ← ${toDateInput(p.offerExpiresAt)}`}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => renewProductOfferThreeDays(p.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-semibold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{p.isOffer ? 'تجديد 3 أيام' : 'تفعيل عرض 3 أيام'}</span>
                  </button>
                  {p.isOffer && (
                    <button
                      type="button"
                      onClick={() => saveProduct({ ...p, isOffer: false })}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                    >
                      إيقاف
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coupons Manager */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Tag className="w-4 h-4 text-[#1D4ED8]" />
            <span>{editingCouponId ? 'تعديل الكوبون' : 'إدارة كوبونات الخصم'}</span>
          </h3>
          {editingCouponId && (
            <button
              type="button"
              onClick={() => {
                setEditingCouponId(null);
                setCode('');
                setDescription('');
              }}
              className="text-xs text-slate-500 underline cursor-pointer"
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <form
          onSubmit={handleCreateOrUpdateCoupon}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200"
        >
          <input
            type="text"
            required
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="كود الكوبون (مثال: TABA20)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase"
          />
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="وصف وشروط الكوبون"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm sm:col-span-2"
          />
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as 'percent' | 'fixed')}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          >
            <option value="percent">نسبة مئوية (%)</option>
            <option value="fixed">مبلغ ثابت (ج.م)</option>
          </select>
          <input
            type="number"
            min={1}
            value={discountValue}
            onChange={(e) => setDiscountValue(Number(e.target.value) || 0)}
            placeholder="قيمة الخصم"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <input
            type="number"
            min={1}
            value={minItemsCount}
            onChange={(e) => setMinItemsCount(Number(e.target.value) || 1)}
            placeholder="الحد الأدنى للقطع"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <input
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(Number(e.target.value) || 1)}
            placeholder="حد مرات الاستخدام"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <input
            type="number"
            min={1}
            value={daysValid}
            onChange={(e) => setDaysValid(Number(e.target.value) || 1)}
            placeholder="الصلاحية بالأيام"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold cursor-pointer"
          >
            {editingCouponId ? 'حفظ تعديلات الكوبون' : 'إنشاء الكوبون'}
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {coupons.map((c) => {
            const usedOrders = orders.filter(
              (o) => o.couponCode?.toUpperCase() === c.code.toUpperCase()
            );
            return (
              <div
                key={c.id}
                className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm"
              >
                <div>
                  <div className="font-bold text-slate-900">
                    <span className="font-mono">{c.code}</span> ·{' '}
                    {c.discountType === 'percent' ? `${c.discountValue}%` : `${c.discountValue} ج.م`}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {c.description} · حد أدنى {c.minItemsCount} قطع · الاستخدام:{' '}
                    <span className="tabular-nums">
                      {c.usedCount} / {c.maxUses}
                    </span>
                  </div>
                  {usedOrders.length > 0 && (
                    <div className="text-[11px] text-[#1D4ED8] mt-0.5">
                      طلبات استخدمت الكوبون: {usedOrders.map((o) => o.orderNumber).join('، ')}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => loadCouponForEdit(c)}
                    className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                  >
                    تعديل
                  </button>
                  <button
                    type="button"
                    onClick={() => saveCoupon({ ...c, isActive: !c.isActive })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                      c.isActive
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {c.isActive ? 'نشط' : 'متوقف'}
                  </button>
                  <button
                    type="button"
                    onClick={() => deleteCoupon(c.id)}
                    aria-label="حذف الكوبون"
                    className="p-2 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
