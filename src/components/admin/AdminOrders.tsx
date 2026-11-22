import React, { useMemo, useState } from 'react';
import { Clock, ExternalLink, MapPin, MessageCircle, Printer, RefreshCw, Search, Trash2 } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { Order, OrderItem, OrderStatus } from '../../types/taba';
import { buildStaffOrderUpdateWhatsAppUrl } from '../../utils/whatsapp';

const ALL_STATUSES: OrderStatus[] = [
  'طلب جديد',
  'تم التأكيد',
  'جاري التجهيز',
  'خرج للتوصيل',
  'تم التسليم',
  'ملغي',
];

export const AdminOrders: React.FC = () => {
  const {
    orders,
    products,
    coupons,
    settings,
    currentStaff,
    updateOrderByStaff,
    updateOrderItemsAndFeeByStaff,
    proposeSubstituteItem,
  } = useTaba();

  const isOrderDelayed = (ord: Order) => {
    if (ord.status === 'تم التسليم' || ord.status === 'ملغي') return false;
    const thresholdMs = (settings.delayedOrderThresholdMinutes || 60) * 60 * 1000;
    return Date.now() - new Date(ord.createdAt).getTime() >= thresholdMs;
  };

  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(orders[0]?.id ?? null);

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (q) {
        const match =
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerPhone.includes(q) ||
          o.customerName.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [orders, query, statusFilter]);

  const activeOrder: Order | undefined =
    orders.find((o) => o.id === selectedOrderId) ?? filteredOrders[0];

  const [nextStatus, setNextStatus] = useState<OrderStatus>('طلب جديد');
  const [noteInput, setNoteInput] = useState('');
  const [discountInput, setDiscountInput] = useState<number>(0);
  const [deliveryFeeInput, setDeliveryFeeInput] = useState<number>(0);
  const [customerApprovedInput, setCustomerApprovedInput] = useState<boolean>(false);
  const [editableItems, setEditableItems] = useState<OrderItem[]>([]);
  const [cancelReasonInput, setCancelReasonInput] = useState('');
  const [subTargetProductId, setSubTargetProductId] = useState('');
  const [subProductId, setSubProductId] = useState('');
  const [subNote, setSubNote] = useState('');
  const [itemsFeedback, setItemsFeedback] = useState<string | null>(null);

  React.useEffect(() => {
    if (activeOrder) {
      setNextStatus(activeOrder.status);
      setDiscountInput(activeOrder.reviewedDiscount || 0);
      setDeliveryFeeInput(activeOrder.deliveryFee || 0);
      setCustomerApprovedInput(activeOrder.customerApprovedTotal);
      setEditableItems(activeOrder.items.map((it) => ({ ...it })));
      setCancelReasonInput(activeOrder.cancellationReason || '');
      setSubTargetProductId(activeOrder.items[0]?.productId ?? '');
      setSubProductId(products.find((p) => p.availability === 'متوفر')?.id ?? '');
      setItemsFeedback(null);
    }
  }, [activeOrder?.id, activeOrder?.items.length, products]);

  const calcInternalSubtotal = (items: OrderItem[]) =>
    items.reduce((sum, item) => sum + item.internalUnitPrice * item.quantity, 0);

  const matchedCoupon = activeOrder?.couponCode
    ? coupons.find((c) => c.code.toUpperCase() === activeOrder.couponCode?.toUpperCase())
    : undefined;

  const handleSaveItemsAndFee = () => {
    if (!activeOrder) return;
    if (editableItems.length === 0) {
      setItemsFeedback('يجب بقاء صنف واحد على الأقل في الطلب');
      return;
    }
    updateOrderItemsAndFeeByStaff(activeOrder.id, {
      items: editableItems,
      deliveryFee: deliveryFeeInput,
    });
    setItemsFeedback('تم تحديث كميات وأسعار البنود ورسوم التوصيل بنجاح');
  };

  const handleApplyCouponCalc = () => {
    if (!matchedCoupon) return;
    const sub = calcInternalSubtotal(editableItems);
    const val =
      matchedCoupon.discountType === 'percent'
        ? Math.round((sub * matchedCoupon.discountValue) / 100)
        : matchedCoupon.discountValue;
    setDiscountInput(Math.min(sub, val));
  };

  const handleSaveOrderUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder) return;
    if (nextStatus === 'ملغي' && !currentStaff?.permissions.cancelOrders) return;

    const internalSub = calcInternalSubtotal(editableItems);
    const totalAfterDiscount = Math.max(0, internalSub - discountInput + deliveryFeeInput);

    // Save item/fee changes if modified before status update
    updateOrderItemsAndFeeByStaff(activeOrder.id, {
      items: editableItems,
      deliveryFee: deliveryFeeInput,
    });

    updateOrderByStaff(activeOrder.id, {
      newStatus: nextStatus,
      notes: noteInput || `تحديث الحالة إلى ${nextStatus}`,
      reviewedDiscount: discountInput,
      reviewedTotal: totalAfterDiscount,
      priceReviewedByStaff: true,
      customerApprovedTotal: customerApprovedInput,
      cancellationReason: nextStatus === 'ملغي' ? cancelReasonInput : undefined,
    });
    setNoteInput('');
  };

  const handleProposeSubstitute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrder || !subTargetProductId || !subProductId) return;
    proposeSubstituteItem(activeOrder.id, subTargetProductId, subProductId, subNote);
    setSubNote('');
  };

  const previewOrderForWa: Order | undefined = activeOrder
    ? {
        ...activeOrder,
        items: editableItems,
        deliveryFee: deliveryFeeInput,
        reviewedDiscount: discountInput,
        reviewedTotal: Math.max(
          0,
          calcInternalSubtotal(editableItems) - discountInput + deliveryFeeInput
        ),
      }
    : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-xl font-bold text-slate-900">إدارة الطلبات ومراجعة الأسعار</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            راجع الكميات والأسعار الداخلية والكوبون والتوصيل، ثم أرسل الإجمالي للعميل يدويًا عبر واتساب قبل التأكيد.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3 no-print">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="بحث برقم الطلب أو رقم الهاتف أو اسم العميل..."
            className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | OrderStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
        >
          <option value="all">كل الحالات ({orders.length})</option>
          {ALL_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Orders List */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden no-print">
          {filteredOrders.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              لا توجد طلبات مطابقة للبحث.
            </div>
          ) : (
            filteredOrders.map((ord) => {
              const delayed = isOrderDelayed(ord);
              return (
                <button
                  key={ord.id}
                  type="button"
                  onClick={() => setSelectedOrderId(ord.id)}
                  className={`w-full text-right p-4 transition-colors cursor-pointer ${
                    activeOrder?.id === ord.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-900 tabular-nums">
                      {ord.orderNumber}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {delayed && (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-100 text-[#DC2626] text-[10px] font-bold">
                          <Clock className="w-3 h-3" />
                          <span>متأخر</span>
                        </span>
                      )}
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-semibold ${
                          ord.status === 'ملغي'
                            ? 'bg-red-100 text-[#DC2626]'
                            : ord.status === 'تم التسليم'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-[#1D4ED8]'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                  </div>
                  <div className="mt-1 text-xs text-slate-700 font-medium">
                    {ord.customerName} · <span className="tabular-nums">{ord.customerPhone}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">
                    {ord.zoneName} · {ord.items.length} أصناف ·{' '}
                    {ord.customerApprovedTotal ? 'موافقة العميل مسجلة' : 'بانتظار موافقة العميل'}
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Selected Order Workspace */}
        {activeOrder && previewOrderForWa && (
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold text-slate-900 tabular-nums">
                    تفاصيل الطلب {activeOrder.orderNumber}
                  </h3>
                  {isOrderDelayed(activeOrder) && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-100 text-[#DC2626] text-[11px] font-bold">
                      <Clock className="w-3.5 h-3.5" />
                      <span>طلب متأخر عن الموعد المحدد</span>
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500">
                  {activeOrder.customerName} ·{' '}
                  <span className="tabular-nums">{activeOrder.customerPhone}</span> ·{' '}
                  {new Date(activeOrder.createdAt).toLocaleString('ar-EG')}
                </div>

                {/* Structured Delivery Address Card */}
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 text-xs text-slate-700 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900">
                    <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
                    <span>
                      {activeOrder.zoneName}
                      {activeOrder.addressType ? ` (${activeOrder.addressType})` : ''}
                    </span>
                  </div>
                  <div>{activeOrder.detailedAddress}</div>
                  {(activeOrder.streetName ||
                    activeOrder.buildingNumber ||
                    activeOrder.floorNumber ||
                    activeOrder.apartmentNumber) && (
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-600">
                      {activeOrder.streetName && <span>شارع: {activeOrder.streetName}</span>}
                      {activeOrder.buildingNumber && (
                        <span>عقار/برج: {activeOrder.buildingNumber}</span>
                      )}
                      {activeOrder.floorNumber && <span>الدور: {activeOrder.floorNumber}</span>}
                      {activeOrder.apartmentNumber && (
                        <span>شقة/محل: {activeOrder.apartmentNumber}</span>
                      )}
                    </div>
                  )}
                  <div className="text-[11px] text-slate-600">
                    علامة مميزة: <strong>{activeOrder.landmark || '—'}</strong>
                  </div>
                  {activeOrder.locationUrl && (
                    <a
                      href={activeOrder.locationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8] hover:underline no-print"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>فتح موقع العميل على خرائط جوجل</span>
                    </a>
                  )}
                </div>

                {activeOrder.notes && (
                  <div className="text-xs text-slate-700">
                    ملاحظات العميل: {activeOrder.notes}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 no-print">
                <a
                  href={buildStaffOrderUpdateWhatsAppUrl(previewOrderForWa)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold whitespace-nowrap"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>إرسال التحديث واتساب</span>
                </a>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة الطلب</span>
                </button>
              </div>
            </div>

            {/* Editable Internal Price & Items Review Table */}
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-slate-700">
                  المنتجات والأسعار الداخلية للمراجعة (قابلة للتعديل في الإدارة فقط):
                </div>
                <button
                  type="button"
                  onClick={handleSaveItemsAndFee}
                  className="px-3 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold cursor-pointer no-print"
                >
                  حفظ تعديل البنود والتوصيل
                </button>
              </div>

              {itemsFeedback && (
                <div className="text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg p-2">
                  {itemsFeedback}
                </div>
              )}

              <div className="overflow-x-auto border border-slate-200 rounded-lg">
                <table className="w-full text-xs text-right">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                    <tr>
                      <th className="p-2.5 font-semibold">المنتج</th>
                      <th className="p-2.5 font-semibold">الكمية</th>
                      <th className="p-2.5 font-semibold">سعر الوحدة الداخلي</th>
                      <th className="p-2.5 font-semibold">الإجمالي الفرعي</th>
                      <th className="p-2.5 font-semibold no-print">حذف</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {editableItems.map((item, idx) => (
                      <tr key={item.productId}>
                        <td className="p-2.5 font-medium text-slate-900">
                          {item.productName}
                          {item.substitute && (
                            <div className="mt-1 text-[11px] text-amber-800">
                              بديل مقترح: {item.substitute.productName} (
                              {item.substitute.status === 'pending'
                                ? 'بانتظار موافقة العميل'
                                : item.substitute.status === 'accepted'
                                ? 'وافق العميل'
                                : 'رفض العميل'}
                              )
                            </div>
                          )}
                        </td>
                        <td className="p-2.5 tabular-nums">
                          <input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) => {
                              const val = Math.max(1, Number(e.target.value) || 1);
                              setEditableItems((prev) =>
                                prev.map((it, i) => (i === idx ? { ...it, quantity: val } : it))
                              );
                            }}
                            className="w-16 rounded border border-slate-200 px-2 py-1 text-xs tabular-nums"
                          />
                        </td>
                        <td className="p-2.5 tabular-nums">
                          <input
                            type="number"
                            min={0}
                            value={item.internalUnitPrice}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setEditableItems((prev) =>
                                prev.map((it, i) =>
                                  i === idx ? { ...it, internalUnitPrice: val } : it
                                )
                              );
                            }}
                            className="w-20 rounded border border-slate-200 px-2 py-1 text-xs tabular-nums"
                          />{' '}
                          ج.م
                        </td>
                        <td className="p-2.5 tabular-nums font-bold">
                          {item.internalUnitPrice * item.quantity} ج.م
                        </td>
                        <td className="p-2.5 no-print">
                          {editableItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setEditableItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              aria-label="حذف البند"
                              className="text-slate-400 hover:text-[#DC2626] cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span>إجمالي المنتجات الداخلي:</span>
                  <strong className="tabular-nums">{calcInternalSubtotal(editableItems)} ج.م</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span>رسوم توصيل ({activeOrder.zoneName}):</span>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min={0}
                      value={deliveryFeeInput}
                      onChange={(e) => setDeliveryFeeInput(Math.max(0, Number(e.target.value) || 0))}
                      className="w-20 rounded border border-slate-200 bg-white px-2 py-0.5 text-xs tabular-nums"
                    />
                    <strong>ج.م</strong>
                  </div>
                </div>
                {activeOrder.couponCode && (
                  <div className="flex flex-wrap justify-between items-center text-[#1D4ED8] gap-2">
                    <span>
                      الكوبون المسجل ({activeOrder.couponCode}
                      {matchedCoupon
                        ? ` — ${
                            matchedCoupon.discountType === 'percent'
                              ? `${matchedCoupon.discountValue}%`
                              : `${matchedCoupon.discountValue} ج.م`
                          }`
                        : ''}
                      ):
                    </span>
                    <div className="flex items-center gap-2">
                      {matchedCoupon && (
                        <button
                          type="button"
                          onClick={handleApplyCouponCalc}
                          className="underline text-[11px] font-bold cursor-pointer no-print"
                        >
                          حساب الخصم تلقائيًا
                        </button>
                      )}
                      <strong className="tabular-nums">خصم {discountInput} ج.م</strong>
                    </div>
                  </div>
                )}
                <div className="flex justify-between border-t border-slate-200 pt-1.5 text-sm font-bold text-slate-900">
                  <span>الإجمالي النهائي المقترح:</span>
                  <span className="tabular-nums">
                    {Math.max(
                      0,
                      calcInternalSubtotal(editableItems) - discountInput + deliveryFeeInput
                    )}{' '}
                    ج.م
                  </span>
                </div>
              </div>
            </div>

            {/* Staff Update Status & Review Form */}
            <form onSubmit={handleSaveOrderUpdate} className="space-y-3 border-t border-slate-100 pt-4 no-print">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    تحديث حالة الطلب
                  </label>
                  <select
                    value={nextStatus}
                    onChange={(e) => setNextStatus(e.target.value as OrderStatus)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  >
                    {ALL_STATUSES.map((st) => (
                      <option
                        key={st}
                        value={st}
                        disabled={st === 'ملغي' && !currentStaff?.permissions.cancelOrders}
                      >
                        {st}
                        {st === 'ملغي' && !currentStaff?.permissions.cancelOrders
                          ? ' (يتطلب صلاحية الإلغاء)'
                          : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    قيمة الخصم المراجع (ج.م)
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={discountInput}
                    onChange={(e) => setDiscountInput(Number(e.target.value) || 0)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-2 rounded-lg cursor-pointer">
                <input
                  type="checkbox"
                  checked={customerApprovedInput}
                  onChange={(e) => setCustomerApprovedInput(e.target.checked)}
                />
                <span>تمت موافقة العميل على الإجمالي النهائي عبر واتساب</span>
              </label>

              {nextStatus === 'ملغي' && (
                <div>
                  <label className="block text-xs font-bold text-[#DC2626] mb-1">
                    سبب الإلغاء *
                  </label>
                  <input
                    type="text"
                    required
                    value={cancelReasonInput}
                    onChange={(e) => setCancelReasonInput(e.target.value)}
                    placeholder="اكتب سبب الإلغاء لتسجيله في السجل"
                    className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm focus:outline-none"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  ملاحظات الموظف (تُسجل في سجل التعديلات)
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="مثال: تمت مراجعة الأسعار وإرسال الإجمالي عبر واتساب"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
              >
                حفظ تحديث الطلب والأسعار
              </button>
            </form>

            {/* Propose Substitute Item */}
            <form
              onSubmit={handleProposeSubstitute}
              className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 no-print"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                <RefreshCw className="w-4 h-4 text-[#1D4ED8]" />
                <span>اقتراح منتج بديل (لا يتم الاستبدال إلا بموافقة العميل)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <select
                  value={subTargetProductId}
                  onChange={(e) => setSubTargetProductId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  {activeOrder.items.map((it) => (
                    <option key={it.productId} value={it.productId}>
                      الصنف الأصلي: {it.productName}
                    </option>
                  ))}
                </select>
                <select
                  value={subProductId}
                  onChange={(e) => setSubProductId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                >
                  {products
                    .filter((p) => p.availability !== 'غير متوفر')
                    .map((p) => (
                      <option key={p.id} value={p.id}>
                        البديل: {p.name}
                      </option>
                    ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subNote}
                  onChange={(e) => setSubNote(e.target.value)}
                  placeholder="رسالة توضيحية للعميل عن البديل..."
                  className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  إرسال المقترح للعميل
                </button>
              </div>
            </form>

            {/* History Log */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <div className="text-xs font-bold text-slate-700">سجل تغييرات الطلب:</div>
              {activeOrder.history.map((h) => (
                <div key={h.id} className="text-xs text-slate-600 flex flex-wrap justify-between gap-2">
                  <span>
                    <strong>{h.changedBy}:</strong> {h.oldStatus} ← {h.newStatus} ({h.notes})
                  </span>
                  <span className="tabular-nums text-slate-400">
                    {new Date(h.changedAt).toLocaleString('ar-EG')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
