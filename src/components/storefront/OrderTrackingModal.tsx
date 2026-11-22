import React, { useEffect, useState } from 'react';
import {
  Check,
  Edit3,
  History,
  MessageCircle,
  Minus,
  PackageSearch,
  Plus,
  RotateCcw,
  Trash2,
  X,
  XCircle,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { OrderStatus } from '../../types/taba';
import { buildOrderTotalInquiryWhatsAppUrl } from '../../utils/whatsapp';

interface OrderTrackingModalProps {
  isOpen: boolean;
  initialOrderNumber?: string;
  initialPhone?: string;
  onClose: () => void;
  onOpenCart: () => void;
  onOpenReturnForm?: (orderNumber: string, phone: string) => void;
}

const ORDER_STAGES: OrderStatus[] = [
  'طلب جديد',
  'تم التأكيد',
  'جاري التجهيز',
  'خرج للتوصيل',
  'تم التسليم',
];

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  initialOrderNumber = '',
  initialPhone = '',
  onClose,
  onOpenCart,
  onOpenReturnForm,
}) => {
  const {
    settings,
    trackOrderPrivate,
    getOrdersByPhone,
    fetchOrderTracking,
    fetchOrdersByPhone,
    customerEditOrder,
    customerCancelOrder,
    customerRespondSubstitute,
    reorderIntoCart,
  } = useTaba();

  const [tab, setTab] = useState<'track' | 'history'>('track');
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber);
  const [phone, setPhone] = useState(initialPhone);
  const [searchTriggered, setSearchTriggered] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [isSavingAction, setIsSavingAction] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editAddress, setEditAddress] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editItems, setEditItems] = useState<Array<{ productId: string; productName: string; quantity: number }>>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (initialOrderNumber || initialPhone) {
      setOrderNumber(initialOrderNumber);
      setPhone(initialPhone);
      setSearchTriggered(true);
      setTab('track');
      if (initialOrderNumber && initialPhone) {
        setIsSearching(true);
        void fetchOrderTracking(initialOrderNumber, initialPhone).finally(() =>
          setIsSearching(false)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderNumber, initialPhone]);

  useEffect(() => {
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    if (tab === 'history' && /^01[0125][0-9]{8}$/.test(cleanPhone)) {
      setIsLoadingHistory(true);
      void fetchOrdersByPhone(cleanPhone).finally(() => setIsLoadingHistory(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, phone]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedOrder = searchTriggered ? trackOrderPrivate(orderNumber, phone) : null;
  const previousOrders = phone.trim() ? getOrdersByPhone(phone) : [];
  const canModifyOrder =
    matchedOrder &&
    (matchedOrder.status === 'طلب جديد' || matchedOrder.status === 'تم التأكيد');

  const openEditEditor = () => {
    if (!matchedOrder) return;
    setEditAddress(matchedOrder.detailedAddress);
    setEditLandmark(matchedOrder.landmark);
    setEditNotes(matchedOrder.notes);
    setEditItems(
      matchedOrder.items.map((it) => ({
        productId: it.productId,
        productName: it.productName,
        quantity: it.quantity,
      }))
    );
    setShowEditForm(true);
    setShowCancelForm(false);
    setFeedback(null);
  };

  const handleTrackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setShowCancelForm(false);
    setShowEditForm(false);
    setIsSearching(true);
    await fetchOrderTracking(orderNumber, phone);
    setIsSearching(false);
    setSearchTriggered(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedOrder || isSavingAction) return;
    setIsSavingAction(true);
    const res = await customerEditOrder(matchedOrder.id, phone, {
      detailedAddress: editAddress,
      landmark: editLandmark,
      notes: editNotes,
      items: editItems.map((i) => ({ productId: i.productId, quantity: i.quantity })),
    });
    setIsSavingAction(false);
    if (!res.ok) {
      setFeedback(res.error ?? 'تعذر تعديل الطلب');
    } else {
      setShowEditForm(false);
      setFeedback('تم حفظ تعديلاتك بنجاح وسيُعاد تأكيد السعر عبر واتساب.');
    }
  };

  const handleCancelOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matchedOrder || isSavingAction) return;
    setIsSavingAction(true);
    const res = await customerCancelOrder(matchedOrder.id, phone, cancelReason);
    setIsSavingAction(false);
    if (!res.ok) {
      setFeedback(res.error ?? 'تعذر الإلغاء');
    } else {
      setShowCancelForm(false);
      setCancelReason('');
      setFeedback('تم إلغاء الطلب وتسجيل السبب.');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="متابعة الطلبات"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PackageSearch className="w-5 h-5 text-[#1D4ED8]" />
            <h2 className="text-lg font-bold text-slate-900">متابعة الطلب وطلباتي السابقة</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 flex items-center gap-2 border-b border-slate-100 pb-3">
          <button
            type="button"
            onClick={() => setTab('track')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer ${
              tab === 'track'
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            متابعة طلب محدد
          </button>
          <button
            type="button"
            onClick={() => setTab('history')}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold cursor-pointer ${
              tab === 'history'
                ? 'bg-[#1D4ED8] text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            طلباتي السابقة وإعادة الطلب
          </button>
        </div>

        <div className="overflow-y-auto p-6 space-y-6">
          {tab === 'track' ? (
            <>
              <form
                onSubmit={handleTrackSubmit}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <p className="text-xs text-slate-600">
                  أدخل كود الطلب ورقم الهاتف المسجل لعرض حالة طلبك أو تعديله بخصوصية تامة من أي جهاز.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    type="text"
                    required
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder="كود الطلب (مثال: TABA-1001)"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="رقم الهاتف (010...)"
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <button
                    type="submit"
                    disabled={isSearching}
                    className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                  >
                    {isSearching ? 'جاري البحث...' : 'عرض حالة الطلب'}
                  </button>
                </div>
              </form>

              {feedback && (
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs sm:text-sm text-[#0B3B91]">
                  {feedback}
                </div>
              )}

              {searchTriggered && !isSearching && !matchedOrder && (
                <div className="rounded-xl border border-slate-200 p-6 text-center text-sm text-slate-600">
                  لم يتم العثور على طلب مطابق لرقم الطلب ورقم الهاتف المدخلين.
                </div>
              )}

              {matchedOrder && (
                <div className="space-y-6">
                  {/* Stage Progress */}
                  <div className="rounded-xl border border-slate-200 p-5 space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="text-base font-bold text-slate-900 tabular-nums">
                          الطلب {matchedOrder.orderNumber}
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {matchedOrder.customerName} · {matchedOrder.zoneName}
                        </div>
                        <div className="text-xs text-slate-600 mt-0.5">
                          {matchedOrder.addressType ? `${matchedOrder.addressType} — ` : ''}
                          {matchedOrder.detailedAddress} (علامة: {matchedOrder.landmark || '—'})
                        </div>
                        {matchedOrder.locationUrl && (
                          <a
                            href={matchedOrder.locationUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-[11px] font-bold text-[#1D4ED8] hover:underline mt-0.5"
                          >
                            عرض موقع التوصيل على الخريطة
                          </a>
                        )}
                      </div>
                      <span
                        className={`px-3 py-1 rounded text-xs font-bold ${
                          matchedOrder.status === 'ملغي'
                            ? 'bg-red-100 text-[#DC2626]'
                            : matchedOrder.status === 'تم التسليم'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-[#1D4ED8]'
                        }`}
                      >
                        {matchedOrder.status}
                      </span>
                    </div>

                    {matchedOrder.status !== 'ملغي' && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                        {ORDER_STAGES.map((stage, idx) => {
                          const activeIdx = ORDER_STAGES.indexOf(matchedOrder.status);
                          const reached = idx <= activeIdx;
                          return (
                            <div
                              key={stage}
                              className={`rounded-lg border p-2.5 text-center text-xs font-semibold ${
                                reached
                                  ? 'border-[#1D4ED8] bg-blue-50 text-[#0B3B91]'
                                  : 'border-slate-200 bg-slate-50 text-slate-400'
                              }`}
                            >
                              {stage}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {matchedOrder.cancellationReason && (
                      <div className="text-xs text-[#DC2626] bg-red-50 border border-red-200 rounded-lg p-3">
                        سبب الإلغاء: {matchedOrder.cancellationReason}
                      </div>
                    )}
                  </div>

                  {/* Items + Substitute Proposal */}
                  <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900">منتجات الطلب</h3>
                    {matchedOrder.items.map((item) => (
                      <div
                        key={item.productId}
                        className="border-b border-slate-100 pb-3 last:border-none last:pb-0 space-y-2"
                      >
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-slate-800">{item.productName}</span>
                          <span className="tabular-nums text-slate-600 font-semibold">
                            الكمية: {item.quantity}
                          </span>
                        </div>

                        {item.substitute && (
                          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 space-y-2">
                            <div className="text-xs font-bold text-amber-900">
                              مقترح منتج بديل: {item.substitute.productName}
                            </div>
                            <p className="text-xs text-amber-800">{item.substitute.note}</p>
                            {item.substitute.status === 'pending' ? (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() =>
                                    customerRespondSubstitute(
                                      matchedOrder.id,
                                      item.productId,
                                      'accepted'
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>موافقة على البديل</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    customerRespondSubstitute(
                                      matchedOrder.id,
                                      item.productId,
                                      'rejected'
                                    )
                                  }
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-white border border-red-300 text-[#DC2626] text-xs font-semibold hover:bg-red-50 cursor-pointer"
                                >
                                  <XCircle className="w-3.5 h-3.5" />
                                  <span>رفض البديل</span>
                                </button>
                              </div>
                            ) : (
                              <div className="text-xs font-bold text-slate-800">
                                قرارك المسجل:{' '}
                                {item.substitute.status === 'accepted'
                                  ? 'تمت الموافقة على البديل'
                                  : 'تم رفض البديل'}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Actions: WhatsApp Total Inquiry, Edit before prep, Cancel before prep, Reorder, Return */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    {matchedOrder.status !== 'ملغي' && (
                      <a
                        href={buildOrderTotalInquiryWhatsAppUrl(
                          matchedOrder,
                          settings.whatsappNumber
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#168b53] hover:bg-[#137445] text-white text-xs sm:text-sm font-bold"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>{settings.copy.orderWhatsappCtaText}</span>
                      </a>
                    )}

                    {canModifyOrder && (
                      <>
                        {settings.allowCustomerOrderEdit && (
                          <button
                            type="button"
                            onClick={openEditEditor}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-blue-300 bg-blue-50 text-[#0B3B91] hover:bg-blue-100 text-xs sm:text-sm font-semibold cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                            <span>تعديل الطلب قبل التجهيز</span>
                          </button>
                        )}
                        {settings.allowCustomerOrderCancel && (
                          <button
                            type="button"
                            onClick={() => {
                              setShowCancelForm((v) => !v);
                              setShowEditForm(false);
                            }}
                            className="px-4 py-2 rounded-lg border border-red-200 text-[#DC2626] hover:bg-red-50 text-xs sm:text-sm font-semibold cursor-pointer"
                          >
                            إلغاء الطلب
                          </button>
                        )}
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        reorderIntoCart(matchedOrder);
                        onClose();
                        onOpenCart();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs sm:text-sm font-semibold hover:bg-[#1E40AF] cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>إعادة طلب نفس المنتجات</span>
                    </button>

                    {onOpenReturnForm && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenReturnForm(matchedOrder.orderNumber, matchedOrder.customerPhone);
                        }}
                        className="px-4 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs sm:text-sm font-semibold cursor-pointer"
                      >
                        طلب استبدال أو استرجاع
                      </button>
                    )}
                  </div>

                  {/* Edit Order Inline Form */}
                  {showEditForm && canModifyOrder && (
                    <form
                      onSubmit={handleSaveEdit}
                      className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-4"
                    >
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-bold text-slate-900">
                          تعديل الكميات وعنوان التوصيل
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowEditForm(false)}
                          className="text-xs text-slate-500 hover:underline cursor-pointer"
                        >
                          إلغاء التعديل
                        </button>
                      </div>

                      <div className="space-y-2">
                        {editItems.map((it) => (
                          <div
                            key={it.productId}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white border border-slate-200 p-2.5 text-xs"
                          >
                            <span className="font-semibold text-slate-800 flex-1">
                              {it.productName}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  setEditItems((prev) =>
                                    prev.map((x) =>
                                      x.productId === it.productId
                                        ? { ...x, quantity: Math.max(1, x.quantity - 1) }
                                        : x
                                    )
                                  )
                                }
                                className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="w-6 text-center font-bold tabular-nums">
                                {it.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() =>
                                  setEditItems((prev) =>
                                    prev.map((x) =>
                                      x.productId === it.productId
                                        ? { ...x, quantity: x.quantity + 1 }
                                        : x
                                    )
                                  )
                                }
                                className="w-7 h-7 rounded border border-slate-200 flex items-center justify-center cursor-pointer"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                              {editItems.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditItems((prev) =>
                                      prev.filter((x) => x.productId !== it.productId)
                                    )
                                  }
                                  className="p-1.5 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                                  aria-label="حذف الصنف"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          value={editAddress}
                          onChange={(e) => setEditAddress(e.target.value)}
                          placeholder="العنوان التفصيلي"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                        />
                        <input
                          type="text"
                          required
                          value={editLandmark}
                          onChange={(e) => setEditLandmark(e.target.value)}
                          placeholder="أقرب علامة مميزة"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          placeholder="ملاحظات إضافية"
                          className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs sm:text-sm font-bold cursor-pointer"
                      >
                        حفظ تعديلات الطلب
                      </button>
                    </form>
                  )}

                  {showCancelForm && canModifyOrder && (
                    <form
                      onSubmit={handleCancelOrder}
                      className="rounded-xl border border-red-200 bg-red-50 p-4 space-y-3"
                    >
                      <label className="block text-xs font-bold text-red-900">
                        يرجى ذكر سبب الإلغاء:
                      </label>
                      <input
                        type="text"
                        required
                        value={cancelReason}
                        onChange={(e) => setCancelReason(e.target.value)}
                        placeholder="مثال: تعديل في المنتجات المطلوبة"
                        className="w-full rounded-lg border border-red-200 bg-white px-3 py-2 text-sm focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#DC2626] text-white text-xs font-semibold cursor-pointer"
                      >
                        تأكيد إلغاء الطلب
                      </button>
                    </form>
                  )}

                  {/* Audit Timeline */}
                  <div className="rounded-xl border border-slate-200 p-5 space-y-3">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <History className="w-4 h-4 text-slate-500" />
                      <span>سجل تغييرات الطلب</span>
                    </h3>
                    <div className="space-y-2.5">
                      {matchedOrder.history.map((h) => (
                        <div
                          key={h.id}
                          className="text-xs border-b border-slate-100 pb-2 last:border-none"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 font-semibold text-slate-800">
                            <span>
                              {h.oldStatus} ← {h.newStatus} ({h.changedBy})
                            </span>
                            <span className="text-slate-500 tabular-nums">
                              {new Date(h.changedAt).toLocaleString('ar-EG')}
                            </span>
                          </div>
                          <div className="text-slate-600 mt-0.5">{h.notes}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  أدخل رقم هاتفك لعرض طلباتك السابقة:
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01001234567"
                    className="flex-1 sm:max-w-xs rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={isLoadingHistory}
                    onClick={() => {
                      setIsLoadingHistory(true);
                      void fetchOrdersByPhone(phone).finally(() => setIsLoadingHistory(false));
                    }}
                    className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-xs sm:text-sm font-semibold cursor-pointer"
                  >
                    {isLoadingHistory ? 'جاري الجلب...' : 'بحث عن طلباتي'}
                  </button>
                </div>
              </div>

              {isLoadingHistory ? (
                <p className="text-sm text-slate-500 text-center py-8">جاري البحث في السجل السحابي...</p>
              ) : previousOrders.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">
                  أدخل رقم هاتف صحيح لعرض الطلبات المسجلة بهذا الرقم.
                </p>
              ) : (
                <div className="space-y-3">
                  {previousOrders.map((ord) => (
                    <div
                      key={ord.id}
                      className="rounded-xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4"
                    >
                      <div>
                        <div className="text-sm font-bold text-slate-900 tabular-nums">
                          {ord.orderNumber} · {ord.status}
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          {ord.items.length} أصناف ·{' '}
                          {new Date(ord.createdAt).toLocaleDateString('ar-EG')}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setOrderNumber(ord.orderNumber);
                            setSearchTriggered(true);
                            setTab('track');
                            void fetchOrderTracking(ord.orderNumber, phone);
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                        >
                          التفاصيل والتعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            reorderIntoCart(ord);
                            onClose();
                            onOpenCart();
                          }}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-semibold hover:bg-[#1E40AF] cursor-pointer"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>إعادة الطلب</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
