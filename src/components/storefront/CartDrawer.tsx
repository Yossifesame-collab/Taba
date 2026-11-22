import React, { useEffect, useMemo, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  Crosshair,
  Home,
  MapPin,
  MessageCircle,
  Minus,
  Navigation,
  PhoneCall,
  Plus,
  Printer,
  ShoppingBag,
  Store,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { AddressPlaceType, Order } from '../../types/taba';
import {
  buildOrderTotalInquiryWhatsAppUrl,
  buildQuickWhatsAppCartOrderUrl,
} from '../../utils/whatsapp';
import { ProductVisual } from '../ProductVisual';

const SAVED_ADDRESS_KEY = 'taba_saved_customer_address_v1';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTrackingWithOrder: (orderNumber: string, phone: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  onOpenTrackingWithOrder,
}) => {
  const {
    cart,
    products,
    zones,
    settings,
    updateCartQty,
    removeFromCart,
    clearCart,
    validateCouponAsync,
    submitOrder,
  } = useTaba();

  const activeZones = useMemo(() => zones.filter((z) => z.isActive), [zones]);

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [zoneId, setZoneId] = useState<string>(() => activeZones[0]?.id ?? '');
  const [addressType, setAddressType] = useState<AddressPlaceType>('شقة');
  const [streetName, setStreetName] = useState('');
  const [buildingNumber, setBuildingNumber] = useState('');
  const [floorNumber, setFloorNumber] = useState('');
  const [apartmentNumber, setApartmentNumber] = useState('');
  const [locationUrl, setLocationUrl] = useState('');
  const [landmark, setLandmark] = useState('');
  const [notes, setNotes] = useState('');
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [geoStatus, setGeoStatus] = useState<string | null>(null);
  const [isLocating, setIsLocating] = useState(false);

  const [couponCode, setCouponCode] = useState('');
  const [couponFeedback, setCouponFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(() => `key-${Date.now()}`);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);

  // Restore saved customer address if present
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SAVED_ADDRESS_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.customerName) setCustomerName(saved.customerName);
        if (saved.customerPhone) setCustomerPhone(saved.customerPhone);
        if (saved.zoneId) setZoneId(saved.zoneId);
        if (saved.addressType) setAddressType(saved.addressType);
        if (saved.streetName) setStreetName(saved.streetName);
        if (saved.buildingNumber) setBuildingNumber(saved.buildingNumber);
        if (saved.floorNumber) setFloorNumber(saved.floorNumber);
        if (saved.apartmentNumber) setApartmentNumber(saved.apartmentNumber);
        if (saved.landmark) setLandmark(saved.landmark);
        if (saved.locationUrl) setLocationUrl(saved.locationUrl);
      }
    } catch {
      // Ignore saved address errors
    }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const selectedZone = zones.find((z) => z.id === zoneId) ?? activeZones[0];
  const totalItems = cart.reduce((sum, entry) => sum + entry.quantity, 0);
  const itemsSubtotal = cart.reduce((sum, entry) => {
    const prod = products.find((p) => p.id === entry.productId);
    return sum + (prod ? prod.internalPrice * entry.quantity : 0);
  }, 0);
  const quickCartItems = cart
    .map((entry) => {
      const prod = products.find((p) => p.id === entry.productId);
      return prod ? { productName: prod.name, quantity: entry.quantity } : null;
    })
    .filter((x): x is { productName: string; quantity: number } => x !== null);

  const composedAddressPreview = [
    streetName.trim(),
    buildingNumber.trim() ? `عمارة/منزل ${buildingNumber.trim()}` : '',
    floorNumber.trim() ? `الدور ${floorNumber.trim()}` : '',
    apartmentNumber.trim() ? `شقة/وحدة ${apartmentNumber.trim()}` : '',
    `(${addressType})`,
  ]
    .filter(Boolean)
    .join(' — ');

  const handleDetectGpsLocation = () => {
    if (!navigator.geolocation) {
      setGeoStatus('متصفحك لا يدعم تحديد الموقع تلقائيًا، يمكنك لصق رابط خرائط جوجل يدويًا.');
      return;
    }
    setIsLocating(true);
    setGeoStatus(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        setLocationUrl(`https://maps.google.com/?q=${lat},${lng}`);
        setGeoStatus('تم التقاط إحداثيات موقعك بدقة وإضافتها لتسهيل وصول المندوب.');
        setIsLocating(false);
      },
      () => {
        setGeoStatus('لم يتم السماح بالوصول للموقع، تأكد من كتابة اسم الشارع والعلامة المميزة بدقة.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const [couponChecking, setCouponChecking] = useState(false);

  const handleCheckCoupon = async () => {
    setCouponChecking(true);
    const res = await validateCouponAsync(couponCode, totalItems);
    setCouponChecking(false);
    setCouponFeedback({ ok: res.valid, text: res.message });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setErrorMsg(null);
    if (!streetName.trim() || !buildingNumber.trim()) {
      setErrorMsg('يرجى إدخال اسم الشارع ورقم العمارة أو المنزل لتفادي أي خطأ في التوصيل.');
      return;
    }
    if (addressType === 'شقة' && (!floorNumber.trim() || !apartmentNumber.trim())) {
      setErrorMsg('يرجى تحديد الدور ورقم الشقة لتوصيل الطلب لباب الشقة بدقة.');
      return;
    }
    setIsSubmitting(true);

    const res = await submitOrder({
      customerName,
      customerPhone,
      zoneId: selectedZone?.id ?? '',
      addressType,
      streetName,
      buildingNumber,
      floorNumber,
      apartmentNumber,
      locationUrl,
      detailedAddress: composedAddressPreview,
      landmark,
      notes,
      couponCode: couponCode.trim() || undefined,
      idempotencyKey,
    });

    setIsSubmitting(false);

    if (!res.ok || !res.order) {
      setErrorMsg(res.error ?? 'تعذر إرسال الطلب، يرجى مراجعة البيانات');
      return;
    }

    if (saveAddressForFuture) {
      try {
        localStorage.setItem(
          SAVED_ADDRESS_KEY,
          JSON.stringify({
            customerName,
            customerPhone,
            zoneId: selectedZone?.id ?? '',
            addressType,
            streetName,
            buildingNumber,
            floorNumber,
            apartmentNumber,
            landmark,
            locationUrl,
          })
        );
      } catch {
        // Ignore storage error
      }
    }

    setCompletedOrder(res.order);
    setIdempotencyKey(`key-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`);
  };

  const resetFormAndClose = () => {
    setCompletedOrder(null);
    setErrorMsg(null);
    setCouponFeedback(null);
    setCodeCopied(false);
    onClose();
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCodeCopied(true);
      window.setTimeout(() => setCodeCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-label="سلة الطلبات"
      onClick={resetFormAndClose}
    >
      <div
        className="w-full max-w-xl bg-white text-slate-900 h-full flex flex-col border-r border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4 no-print">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5 text-[#1D4ED8]" />
            <h2 className="text-lg font-bold text-slate-900">
              {completedOrder ? 'تم استلام طلبك بنجاح' : `سلة الطلب (${totalItems})`}
            </h2>
          </div>
          <button
            type="button"
            onClick={resetFormAndClose}
            aria-label="إغلاق السلة"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {completedOrder ? (
            <div className="space-y-5">
              {/* Clear Confirmation & Inquiry Code Card */}
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 space-y-3">
                <div className="flex items-center gap-2 text-emerald-800 font-extrabold text-base sm:text-lg">
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span>{settings.copy.orderSuccessTitle}</span>
                </div>
                <p className="text-sm text-emerald-950 leading-relaxed flex items-start gap-2">
                  <PhoneCall className="w-4 h-4 text-emerald-700 shrink-0 mt-1" />
                  <span>{settings.copy.orderSuccessSubtitle}</span>
                </p>

                {/* Prominent Inquiry Code Box */}
                <div className="rounded-xl bg-white border border-emerald-200 p-3.5 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500">
                      كود الطلب للاستفسار والمتابعة:
                    </div>
                    <div className="text-xl font-extrabold text-[#0b347e] font-mono tabular-nums mt-0.5">
                      {completedOrder.orderNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(completedOrder.orderNumber)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                  >
                    {codeCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-700" />
                        <span>تم النسخ</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>نسخ الكود</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Primary WhatsApp Total Inquiry CTA */}
                <a
                  href={buildOrderTotalInquiryWhatsAppUrl(completedOrder, settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-[#168b53] hover:bg-[#137445] text-white text-sm sm:text-base font-extrabold shadow-md transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>{settings.copy.orderWhatsappCtaText}</span>
                </a>
                <p className="text-[11px] text-emerald-900/80 text-center">
                  بالضغط على الزر سيتم فتح واتساب برسالة جاهزة تحتوي على كود طلبك ({completedOrder.orderNumber}) وأصنافك للاستفسار عن التوتال.
                </p>
              </div>

              {/* Printable Summary */}
              <div className="rounded-xl border border-slate-200 p-5 space-y-4 bg-white">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div>
                    <div className="text-sm font-bold text-slate-900">معرض طابا — ملخص طلب</div>
                    <div className="text-xs text-slate-500 mt-0.5 tabular-nums">
                      كود الطلب: {completedOrder.orderNumber} ·{' '}
                      {new Date(completedOrder.createdAt).toLocaleString('ar-EG')}
                    </div>
                  </div>
                  <img
                    src={settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg'}
                    alt="شعار طابا"
                    className="h-10 w-auto object-contain"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div>
                    <span className="text-slate-500">العميل: </span>
                    <span className="font-semibold text-slate-900">{completedOrder.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">الهاتف: </span>
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {completedOrder.customerPhone}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-500">المنطقة والعنوان: </span>
                    <span className="font-medium text-slate-900">
                      {completedOrder.zoneName} — {completedOrder.detailedAddress} (علامة مميزة:{' '}
                      {completedOrder.landmark || 'غير محددة'})
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <div className="text-xs font-bold text-slate-700 mb-2">المنتجات المطلوبة (بدون أسعار)</div>
                  <ul className="space-y-2 text-sm">
                    {completedOrder.items.map((item) => (
                      <li
                        key={item.productId}
                        className="flex items-center justify-between gap-4 border-b border-slate-100 pb-2 last:border-none"
                      >
                        <span className="text-slate-800">{item.productName}</span>
                        <span className="font-bold tabular-nums text-slate-900 shrink-0">
                          الكمية: {item.quantity}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm text-slate-700">
                  <span>
                    رسوم التوصيل للمنطقة:{' '}
                    <strong className="tabular-nums">{completedOrder.deliveryFee} ج.م</strong>
                  </span>
                  <span>طريقة الدفع: {completedOrder.paymentMethod}</span>
                </div>
                {completedOrder.couponCode && (
                  <div className="text-xs text-[#1D4ED8] font-medium">
                    الكوبون المسجل للمراجعة: {completedOrder.couponCode}
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-3 no-print">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border border-slate-200 text-sm font-semibold text-slate-800 hover:bg-slate-50 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>طباعة ملخص الطلب</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const num = completedOrder.orderNumber;
                    const ph = completedOrder.customerPhone;
                    resetFormAndClose();
                    onOpenTrackingWithOrder(num, ph);
                  }}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#1D4ED8] text-white text-sm font-semibold hover:bg-[#1E40AF] cursor-pointer"
                >
                  <span>متابعة أو تعديل الطلب بالكود</span>
                </button>
              </div>
            </div>
          ) : cart.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="text-base font-bold text-slate-900">سلة الطلبات فارغة</div>
              <p className="text-sm text-slate-500 max-w-xs mx-auto">
                تصفح أقسام معرض طابا وأضف احتياجاتك إلى السلة لإرسال طلبك للمراجعة.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Trial Mode Notice or Live Pricing Card */}
              {settings.theme.showPricesOnStore ? (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs sm:text-sm text-[#0B3B91] space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span>إجمالي المنتجات ({totalItems} قطعة):</span>
                    <strong className="tabular-nums">{itemsSubtotal} ج.م</strong>
                  </div>
                  {selectedZone && (
                    <div className="flex items-center justify-between">
                      <span>رسوم التوصيل ({selectedZone.name}):</span>
                      <strong className="tabular-nums">{selectedZone.fee} ج.م</strong>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-t border-blue-200 pt-1.5 font-extrabold text-sm">
                    <span>الإجمالي التقديري قبل الكوبون:</span>
                    <strong className="tabular-nums">
                      {itemsSubtotal + (selectedZone?.fee ?? 0)} ج.م
                    </strong>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-blue-50 border border-blue-200 p-3.5 text-xs sm:text-sm text-[#0B3B91] font-medium leading-relaxed">
                  {settings.copy.cartNoticeText}
                </div>
              )}

              {/* Cart Items List */}
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-bold text-slate-800">الأصناف المختارة ({totalItems} قطعة)</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-1 text-[#DC2626] hover:underline font-semibold cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إفراغ السلة</span>
                </button>
              </div>
              <div className="space-y-3">
                {cart.map((entry) => {
                  const prod = products.find((p) => p.id === entry.productId);
                  if (!prod) return null;
                  return (
                    <div
                      key={entry.productId}
                      className="flex items-center gap-3 rounded-xl border border-slate-200 p-3"
                    >
                      <div className="w-16 h-14 rounded-lg overflow-hidden bg-slate-50 border border-slate-100 shrink-0">
                        <ProductVisual
                          visualKind={prod.visualKind}
                          imageUrl={prod.imageUrl}
                          alt={prod.name}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-slate-900 truncate">{prod.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                          <span>{prod.availability}</span>
                          {settings.theme.showPricesOnStore && (
                            <span className="font-bold text-[#1554b9] tabular-nums">
                              · {prod.internalPrice * entry.quantity} ج.م
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => updateCartQty(entry.productId, entry.quantity - 1)}
                          aria-label="إنقاص الكمية"
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="w-7 text-center text-sm font-bold tabular-nums">
                          {entry.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateCartQty(entry.productId, entry.quantity + 1)}
                          aria-label="زيادة الكمية"
                          className="w-8 h-8 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => removeFromCart(entry.productId)}
                          aria-label="حذف المنتج"
                          className="w-8 h-8 rounded-lg text-slate-400 hover:text-[#DC2626] flex items-center justify-center cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Coupon Box */}
              <div className="rounded-xl border border-slate-200 p-4 space-y-2.5 bg-slate-50">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-[#1D4ED8]" />
                  <span>هل لديك كوبون خصم؟</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="أدخل كود الكوبون"
                    className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <button
                    type="button"
                    disabled={couponChecking}
                    onClick={() => void handleCheckCoupon()}
                    className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-60 text-white text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    {couponChecking ? 'جاري الفحص...' : 'فحص الكوبون'}
                  </button>
                </div>
                {couponFeedback && (
                  <p
                    className={`text-xs font-medium ${
                      couponFeedback.ok ? 'text-emerald-700' : 'text-[#DC2626]'
                    }`}
                  >
                    {couponFeedback.text}
                  </p>
                )}
              </div>

              {/* Checkout Form */}
              <form onSubmit={handleSubmit} className="space-y-4 border-t border-slate-200 pt-5">
                <h3 className="text-base font-bold text-slate-900">بيانات العميل والتوصيل</h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      اسم العميل *
                    </label>
                    <input
                      type="text"
                      required
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="الاسم الثلاثي"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      رقم الهاتف (واتساب) *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="010xxxxxxxx"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    منطقة التوصيل *
                  </label>
                  <select
                    required
                    value={selectedZone?.id ?? ''}
                    onChange={(e) => setZoneId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  >
                    {activeZones.map((z) => (
                      <option key={z.id} value={z.id}>
                        {z.name} — رسوم التوصيل: {z.fee} ج.م
                      </option>
                    ))}
                  </select>

                  {selectedZone && (
                    <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3 text-xs text-slate-700 space-y-1">
                      <div>
                        رسوم التوصيل لهذه المنطقة:{' '}
                        <strong className="tabular-nums text-slate-900">{selectedZone.fee} ج.م</strong>
                      </div>
                      <div>
                        الحد الأدنى للطلب: <strong>{selectedZone.minOrderNote}</strong>
                        {totalItems < selectedZone.minItemsCount && (
                          <span className="text-[#DC2626] font-bold block mt-1 tabular-nums">
                            يرجى إضافة {selectedZone.minItemsCount - totalItems} قطعة أخرى للوصول للحد الأدنى لهذه المنطقة.
                          </span>
                        )}
                      </div>
                      <div>مواعيد التوصيل: {selectedZone.deliveryHours}</div>
                    </div>
                  )}
                </div>

                {/* Structured High-Precision Address Registration */}
                <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-extrabold text-[#0b347e] flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#d9273e]" />
                      <span>تسجيل العنوان بدقة لتقليل أخطاء التوصيل</span>
                    </div>
                  </div>

                  {/* Place Type Selector */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'شقة' as const, label: 'شقة سكنية', icon: Building2 },
                      { id: 'منزل عائلة' as const, label: 'منزل عائلة', icon: Home },
                      { id: 'محل / شركة' as const, label: 'محل / شركة', icon: Store },
                    ].map((opt) => {
                      const Icon = opt.icon;
                      const active = addressType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setAddressType(opt.id)}
                          className={`py-2 px-2 rounded-lg border text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                            active
                              ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 shrink-0" />
                          <span>{opt.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        اسم الشارع / المنطقة الفرعية *
                      </label>
                      <input
                        type="text"
                        required
                        value={streetName}
                        onChange={(e) => setStreetName(e.target.value)}
                        placeholder="مثال: شارع الجمهورية / تقسيم السلام"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        رقم العقار / المنزل *
                      </label>
                      <input
                        type="text"
                        required
                        value={buildingNumber}
                        onChange={(e) => setBuildingNumber(e.target.value)}
                        placeholder="مثال: عمارة 14 أو منزل 8"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        الدور {addressType === 'شقة' ? '*' : '(اختياري)'}
                      </label>
                      <input
                        type="text"
                        required={addressType === 'شقة'}
                        value={floorNumber}
                        onChange={(e) => setFloorNumber(e.target.value)}
                        placeholder="مثال: الأرضي / الثالث"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {addressType === 'محل / شركة'
                          ? 'اسم المحل أو المكتب *'
                          : addressType === 'شقة'
                          ? 'رقم الشقة *'
                          : 'رقم الشقة (إن وجد)'}
                      </label>
                      <input
                        type="text"
                        required={addressType === 'شقة' || addressType === 'محل / شركة'}
                        value={apartmentNumber}
                        onChange={(e) => setApartmentNumber(e.target.value)}
                        placeholder={addressType === 'محل / شركة' ? 'مثال: صيدلية الأمل' : 'مثال: شقة 6'}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        أقرب علامة مميزة *
                      </label>
                      <input
                        type="text"
                        required
                        value={landmark}
                        onChange={(e) => setLandmark(e.target.value)}
                        placeholder="بجوار مسجد / صيدلية / مدرسة"
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* GPS Location Pin / Maps Link */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-xs font-semibold text-slate-700">
                      موقع الخريطة / GPS للمندوب (اختياري)
                    </label>
                    <div className="flex flex-wrap items-center gap-2">
                      <input
                        type="url"
                        value={locationUrl}
                        onChange={(e) => setLocationUrl(e.target.value)}
                        placeholder="https://maps.google.com/?q=..."
                        dir="ltr"
                        className="flex-1 min-w-[180px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-[#1D4ED8] focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleDetectGpsLocation}
                        disabled={isLocating}
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
                      >
                        <Crosshair className="w-3.5 h-3.5" />
                        <span>{isLocating ? 'جاري التحديد...' : 'تحديد موقعي الآن'}</span>
                      </button>
                    </div>
                    {geoStatus && (
                      <p className="text-[11px] font-medium text-[#0b347e]">{geoStatus}</p>
                    )}
                  </div>

                  {/* Live Address Confirmation Preview */}
                  {streetName.trim() && (
                    <div className="rounded-lg bg-white border border-blue-200 p-2.5 text-xs text-slate-800 flex items-start gap-2">
                      <Navigation className="w-4 h-4 text-[#1D4ED8] shrink-0 mt-0.5" />
                      <div>
                        <div className="font-bold text-[#0b347e]">معاينة العنوان المسجل للمندوب:</div>
                        <div className="mt-0.5">
                          {selectedZone?.name} — {composedAddressPreview}
                          {landmark.trim() ? ` · علامة مميزة: ${landmark.trim()}` : ''}
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={saveAddressForFuture}
                      onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    />
                    <span>حفظ بيانات هذا العنوان لطلباتي القادمة</span>
                  </label>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    ملاحظات إضافية للتوصيل أو البدائل
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="مثال: الاتصال قبل الوصول بنصف ساعة / وقت التسليم المفضل"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                </div>

                <div className="text-xs text-slate-600 flex items-center justify-between border-t border-slate-100 pt-3">
                  <span>طريقة الدفع:</span>
                  <strong className="text-slate-900">الدفع عند الاستلام</strong>
                </div>

                {errorMsg && (
                  <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-xs font-medium text-[#DC2626]">
                    {errorMsg}
                  </div>
                )}

                <div className="space-y-2.5">
                  <button
                    type="submit"
                    disabled={isSubmitting || !settings.isAcceptingOrders}
                    className="w-full py-3 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-300 text-white text-sm font-bold transition-colors cursor-pointer disabled:cursor-not-allowed"
                  >
                    {isSubmitting
                      ? 'جاري تسجيل الطلب...'
                      : 'تأكيد وإرسال الطلب للمعرض'}
                  </button>

                  <a
                    href={buildQuickWhatsAppCartOrderUrl(
                      quickCartItems,
                      selectedZone?.name,
                      settings.whatsappNumber
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg bg-[#168b53] hover:bg-[#137445] text-white text-xs sm:text-sm font-bold transition-colors"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>الطلب السريع عبر واتساب ({settings.whatsappNumber})</span>
                  </a>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
