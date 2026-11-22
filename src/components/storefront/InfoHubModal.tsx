import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  Clock,
  Copy,
  Globe,
  HelpCircle,
  Info,
  MapPin,
  MessageCircle,
  MessageSquareWarning,
  Plus,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { ReturnedItemCondition, ReturnedProductEntry, ReturnRequest } from '../../types/taba';
import { buildGeneralWhatsAppUrl } from '../../utils/whatsapp';

export type InfoHubTab = 'about' | 'faq' | 'returns' | 'privacy' | 'complaints';

interface InfoHubModalProps {
  isOpen: boolean;
  initialTab?: InfoHubTab;
  prefillOrderNumber?: string;
  prefillPhone?: string;
  onClose: () => void;
}

export const InfoHubModal: React.FC<InfoHubModalProps> = ({
  isOpen,
  initialTab = 'faq',
  prefillOrderNumber = '',
  prefillPhone = '',
  onClose,
}) => {
  const {
    faqs,
    products,
    settings,
    submitComplaint,
    submitReturnRequest,
    fetchReturnTracking,
    trackReturnRequests,
  } = useTaba();
  const [activeTab, setActiveTab] = useState<InfoHubTab>(initialTab);

  // Complaint state
  const [type, setType] = useState<'شكوى' | 'مقترح'>('مقترح');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [orderNum, setOrderNum] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Return/Exchange request state
  const [returnsSubTab, setReturnsSubTab] = useState<'submit' | 'track'>('submit');
  const [retOrderNumber, setRetOrderNumber] = useState(prefillOrderNumber);
  const [retName, setRetName] = useState('');
  const [retPhone, setRetPhone] = useState(prefillPhone);
  const [retType, setRetType] = useState<'استبدال' | 'استرجاع'>('استبدال');
  const [retReason, setRetReason] = useState('');
  const [retItems, setRetItems] = useState<ReturnedProductEntry[]>([
    { productName: '', quantity: 1, condition: 'سليم بغلافه' },
  ]);
  const [submittedReturn, setSubmittedReturn] = useState<ReturnRequest | null>(null);
  const [retCodeCopied, setRetCodeCopied] = useState(false);

  // Return tracking state
  const [trackCodeOrOrder, setTrackCodeOrOrder] = useState(prefillOrderNumber);
  const [trackPhone, setTrackPhone] = useState(prefillPhone);
  const [trackSearched, setTrackSearched] = useState(false);
  const [isTrackingReturn, setIsTrackingReturn] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setSent(false);
      setSubmittedReturn(null);
      if (prefillOrderNumber) {
        setRetOrderNumber(prefillOrderNumber);
        setTrackCodeOrOrder(prefillOrderNumber);
      }
      if (prefillPhone) {
        setRetPhone(prefillPhone);
        setTrackPhone(prefillPhone);
      }
    }
  }, [isOpen, initialTab, prefillOrderNumber, prefillPhone]);

  useEffect(() => {
    if (!isOpen) return;
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onEsc);
    return () => window.removeEventListener('keydown', onEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleComplaintSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !message.trim()) return;
    submitComplaint({
      type,
      customerName: name,
      customerPhone: phone,
      orderNumber: orderNum,
      message,
    });
    setName('');
    setPhone('');
    setOrderNum('');
    setMessage('');
    setSent(true);
  };

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = retItems
      .map((it) => {
        const matchedProd = products.find((p) => p.name.trim() === it.productName.trim());
        return {
          ...it,
          productId: it.productId || matchedProd?.id,
          productName: it.productName.trim(),
          quantity: Math.max(1, it.quantity || 1),
        };
      })
      .filter((it) => it.productName.length > 0);

    if (
      !retOrderNumber.trim() ||
      !retName.trim() ||
      !retPhone.trim() ||
      validItems.length === 0 ||
      !retReason.trim()
    ) {
      return;
    }

    const created = submitReturnRequest({
      orderNumber: retOrderNumber,
      customerName: retName,
      customerPhone: retPhone,
      productName: validItems.map((it) => `${it.productName} (×${it.quantity})`).join('، '),
      returnedItems: validItems,
      requestType: retType,
      reason: retReason,
    });
    setRetItems([{ productName: '', quantity: 1, condition: 'سليم بغلافه' }]);
    setRetReason('');
    setSubmittedReturn(created);
  };

  const handleCopyRetCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setRetCodeCopied(true);
      window.setTimeout(() => setRetCodeCopied(false), 2000);
    } catch {
      // Ignore copy error
    }
  };

  const trackedReturns = trackSearched ? trackReturnRequests(trackCodeOrOrder, trackPhone) : [];

  const aboutLines = settings.aboutUsText.split('\n').filter((l) => l.trim());
  const returnLines = settings.returnPolicyText.split('\n').filter((l) => l.trim());
  const privacyLines = settings.privacyPolicyText.split('\n').filter((l) => l.trim());
  const siteUrl =
    settings.socialLinks.websiteUrl ||
    (typeof window !== 'undefined' ? window.location.origin : '');

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 flex items-center justify-center p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-label="مركز المساعدة والسياسات"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl bg-white text-slate-900 rounded-2xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">عن طابا وخدمة العملاء</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="w-9 h-9 rounded-lg border border-slate-200 flex items-center justify-center text-slate-600 hover:text-slate-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-3 border-b border-slate-100 flex items-center gap-2 overflow-x-auto">
          {[
            { id: 'about' as const, label: 'من نحن', icon: Info },
            { id: 'faq' as const, label: 'أبرز الأسئلة', icon: HelpCircle },
            { id: 'returns' as const, label: 'الاستبدال والاسترجاع', icon: RefreshCw },
            { id: 'privacy' as const, label: 'سياسة الخصوصية', icon: Shield },
            { id: 'complaints' as const, label: 'الشكاوى والمقترحات', icon: MessageSquareWarning },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveTab(item.id);
                  setSent(false);
                  setSubmittedReturn(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="overflow-y-auto p-6 space-y-5 text-sm text-slate-700 leading-relaxed">
          {activeTab === 'about' && (
            <div className="space-y-5">
              <div className="rounded-2xl bg-gradient-to-l from-[#0b347e] to-[#1554b9] text-white p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="bg-white rounded-2xl px-4 py-2.5 shrink-0">
                  <img
                    src={settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg'}
                    alt="شعار معرض طابا"
                    className="h-16 w-auto object-contain"
                  />
                </div>
                <div className="text-center sm:text-right space-y-1.5">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-200">
                    <Award className="w-4 h-4" />
                    <span>18 عامًا من الثقة منذ 2008</span>
                  </div>
                  <h3 className="text-xl font-extrabold">معرض طابا — كل احتياجات بيتك في مكان واحد</h3>
                  <p className="text-xs sm:text-sm text-white/90">{settings.storeTagline}</p>
                </div>
              </div>

              <div className="space-y-3 text-slate-700 leading-relaxed">
                {aboutLines.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-2.5 text-xs sm:text-sm">
                  <MapPin className="w-4 h-4 text-[#d9273e] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">مقر المعرض</div>
                    <div className="text-slate-600 mt-0.5">{settings.storeLocation || 'القناطر الخيرية'}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex items-start gap-2.5 text-xs sm:text-sm">
                  <Clock className="w-4 h-4 text-[#1554b9] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-slate-900">مواعيد العمل والطلبات</div>
                    <div className="text-slate-600 mt-0.5">{settings.dailyOrderHours}</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                <a
                  href={buildGeneralWhatsAppUrl(undefined, settings.whatsappNumber)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#168b53] hover:bg-[#147a49] text-white text-xs sm:text-sm font-bold"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span className="tabular-nums">واتساب: {settings.whatsappNumber}</span>
                </a>
                {settings.socialLinks.googleMapsUrl && (
                  <a
                    href={settings.socialLinks.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#d9273e] hover:bg-[#b81f33] text-white text-xs sm:text-sm font-bold"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>موقع المعرض على خرائط جوجل</span>
                  </a>
                )}
                {settings.socialLinks.facebookUrl && (
                  <a
                    href={settings.socialLinks.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1877f2] hover:opacity-90 text-white text-xs sm:text-sm font-bold"
                  >
                    <span>فيسبوك طابا</span>
                  </a>
                )}
                {settings.socialLinks.tiktokUrl && (
                  <a
                    href={settings.socialLinks.tiktokUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#111] hover:opacity-90 text-white text-xs sm:text-sm font-bold"
                  >
                    <span>تيك توك طابا</span>
                  </a>
                )}
                {siteUrl && (
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-800 hover:bg-slate-50 text-xs sm:text-sm font-semibold"
                  >
                    <Globe className="w-4 h-4 text-[#1554b9]" />
                    <span>الموقع الرسمي</span>
                  </a>
                )}
              </div>
            </div>
          )}

          {activeTab === 'faq' && (
            <div className="space-y-3">
              {faqs.map((faq) => (
                <div key={faq.id} className="rounded-xl border border-slate-200 p-4">
                  <h3 className="font-bold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'returns' && (
            <div className="space-y-5">
              {/* Sub-tabs: Submit vs Track Return/Exchange */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3">
                <button
                  type="button"
                  onClick={() => setReturnsSubTab('submit')}
                  className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    returnsSubTab === 'submit'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  تقديم طلب استبدال / استرجاع
                </button>
                <button
                  type="button"
                  onClick={() => setReturnsSubTab('track')}
                  className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                    returnsSubTab === 'track'
                      ? 'bg-[#1D4ED8] text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>متابعة حالة طلب الاستبدال / المرتجع</span>
                </button>
              </div>

              {returnsSubTab === 'submit' ? (
                <div className="space-y-5">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-bold text-slate-900">سياسة الاستبدال والاسترجاع</h3>
                    <ul className="list-disc pr-5 space-y-1.5 text-slate-600 text-xs sm:text-sm">
                      {returnLines.map((line, i) => (
                        <li key={i}>{line}</li>
                      ))}
                    </ul>
                  </div>

                  {/* Interactive Multi-Item Return / Exchange Request Form */}
                  <form
                    onSubmit={handleReturnSubmit}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 sm:p-5 space-y-4"
                  >
                    <h4 className="text-sm font-bold text-slate-900">
                      تسجيل طلب استبدال أو استرجاع جديد
                    </h4>

                    {submittedReturn ? (
                      <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 space-y-3">
                        <div className="text-emerald-900 font-bold text-sm">
                          تم استلام طلب {submittedReturn.requestType} وتسجيل المنتجات المرتجعة بنجاح!
                        </div>
                        <div className="rounded-lg bg-white border border-emerald-200 p-3 flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <div className="text-xs text-slate-500">كود متابعة الاستبدال / المرتجع:</div>
                            <div className="text-lg font-extrabold text-[#0b347e] font-mono tabular-nums">
                              {submittedReturn.returnCode}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleCopyRetCode(submittedReturn.returnCode)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
                            >
                              {retCodeCopied ? (
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
                            <button
                              type="button"
                              onClick={() => {
                                setTrackCodeOrOrder(submittedReturn.returnCode);
                                setTrackPhone(submittedReturn.customerPhone);
                                setTrackSearched(true);
                                setReturnsSubTab('track');
                                void fetchReturnTracking(
                                  submittedReturn.returnCode,
                                  submittedReturn.customerPhone
                                );
                              }}
                              className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                            >
                              متابعة الحالة الآن
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          {(['استبدال', 'استرجاع'] as const).map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setRetType(t)}
                              className={`px-4 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                                retType === t
                                  ? 'bg-[#1D4ED8] text-white'
                                  : 'bg-white border border-slate-200 text-slate-700'
                              }`}
                            >
                              طلب {t}
                            </button>
                          ))}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <input
                            type="text"
                            required
                            value={retOrderNumber}
                            onChange={(e) => setRetOrderNumber(e.target.value)}
                            placeholder="رقم الطلب (مثال: TABA-1001) *"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm uppercase tabular-nums"
                          />
                          <input
                            type="tel"
                            required
                            value={retPhone}
                            onChange={(e) => setRetPhone(e.target.value)}
                            placeholder="رقم الهاتف المسجل *"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
                          />
                          <input
                            type="text"
                            required
                            value={retName}
                            onChange={(e) => setRetName(e.target.value)}
                            placeholder="اسم العميل *"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                          />
                        </div>

                        {/* Returned Products Builder */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800">
                              المنتجات المطلوب استبدالها / استرجاعها *
                            </span>
                            <button
                              type="button"
                              onClick={() =>
                                setRetItems((prev) => [
                                  ...prev,
                                  { productName: '', quantity: 1, condition: 'سليم بغلافه' },
                                ])
                              }
                              className="inline-flex items-center gap-1 text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>إضافة منتج آخر</span>
                            </button>
                          </div>

                          <datalist id="taba-return-products-list">
                            {products.map((p) => (
                              <option key={p.id} value={p.name} />
                            ))}
                          </datalist>

                          {retItems.map((item, idx) => (
                            <div
                              key={idx}
                              className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center rounded-lg bg-white border border-slate-200 p-2.5"
                            >
                              <input
                                type="text"
                                required
                                list="taba-return-products-list"
                                value={item.productName}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  setRetItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, productName: val } : x))
                                  );
                                }}
                                placeholder="اسم المنتج *"
                                className="sm:col-span-6 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs"
                              />
                              <input
                                type="number"
                                min={1}
                                required
                                value={item.quantity}
                                onChange={(e) => {
                                  const qty = Math.max(1, Number(e.target.value) || 1);
                                  setRetItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, quantity: qty } : x))
                                  );
                                }}
                                aria-label="الكمية"
                                className="sm:col-span-2 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs tabular-nums"
                              />
                              <select
                                value={item.condition}
                                onChange={(e) => {
                                  const cond = e.target.value as ReturnedItemCondition;
                                  setRetItems((prev) =>
                                    prev.map((x, i) => (i === idx ? { ...x, condition: cond } : x))
                                  );
                                }}
                                className="sm:col-span-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                              >
                                <option value="سليم بغلافه">سليم بغلافه</option>
                                <option value="تالف / عيب صناعة">تالف / عيب صناعة</option>
                                <option value="مفتوح">مفتوح</option>
                              </select>
                              <div className="sm:col-span-1 flex justify-end">
                                {retItems.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setRetItems((prev) => prev.filter((_, i) => i !== idx))
                                    }
                                    aria-label="حذف الصنف"
                                    className="p-1.5 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <textarea
                          rows={3}
                          required
                          value={retReason}
                          onChange={(e) => setRetReason(e.target.value)}
                          placeholder="اذكر سبب الاستبدال أو المرتجع بالتفصيل..."
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                        />
                        <button
                          type="submit"
                          className="px-5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
                        >
                          إرسال طلب الاستبدال / المرتجع
                        </button>
                      </>
                    )}
                  </form>
                </div>
              ) : (
                <div className="space-y-4">
                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setIsTrackingReturn(true);
                      await fetchReturnTracking(trackCodeOrOrder, trackPhone);
                      setIsTrackingReturn(false);
                      setTrackSearched(true);
                    }}
                    className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
                  >
                    <p className="text-xs text-slate-600">
                      أدخل رقم هاتفك المسجل وكود المرتجع (مثال: RET-...) لمتابعة حالة المراجعة.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="tel"
                        required
                        value={trackPhone}
                        onChange={(e) => setTrackPhone(e.target.value)}
                        placeholder="رقم الهاتف المسجل *"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm tabular-nums"
                      />
                      <input
                        type="text"
                        required
                        value={trackCodeOrOrder}
                        onChange={(e) => setTrackCodeOrOrder(e.target.value)}
                        placeholder="كود المرتجع (RET-...) *"
                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm uppercase tabular-nums"
                      />
                      <button
                        type="submit"
                        disabled={isTrackingReturn}
                        className="px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-xs sm:text-sm font-bold cursor-pointer"
                      >
                        {isTrackingReturn ? 'جاري البحث...' : 'عرض حالة الطلب'}
                      </button>
                    </div>
                  </form>

                  {trackSearched && !isTrackingReturn && trackedReturns.length === 0 ? (
                    <div className="rounded-xl border border-slate-200 p-6 text-center text-xs sm:text-sm text-slate-500">
                      لم يتم العثور على طلبات استبدال أو مرتجع مطابقة لهذه البيانات.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {trackedReturns.map((req) => (
                        <div
                          key={req.id}
                          className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs sm:text-sm"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <span className="font-extrabold text-[#0b347e] tabular-nums">
                                {req.returnCode}
                              </span>
                              <span className="text-slate-400 mx-1.5">·</span>
                              <span className="font-bold text-slate-800">
                                {req.requestType} على طلب {req.orderNumber}
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-1 rounded text-xs font-bold ${
                                req.status === 'مرفوض'
                                  ? 'bg-red-100 text-[#DC2626]'
                                  : req.status === 'تم الاستبدال / الاسترجاع' ||
                                    req.status === 'تمت الموافقة'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-100 text-[#1D4ED8]'
                              }`}
                            >
                              {req.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600">
                            <strong>السبب المسجل:</strong> {req.reason}
                          </div>

                          {req.assignedStaffName && (
                            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg">
                              <UserCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                              <span>المسؤول عن المراجعة: {req.assignedStaffName}</span>
                            </div>
                          )}

                          <div className="space-y-1.5 border-t border-slate-100 pt-2">
                            <div className="text-xs font-bold text-slate-800">المنتجات المرتجعة:</div>
                            <ul className="space-y-1 text-xs text-slate-700">
                              {req.returnedItems.map((it, i) => (
                                <li key={i} className="flex items-center justify-between gap-2">
                                  <span>
                                    {it.productName} ({it.condition})
                                  </span>
                                  <span className="font-bold tabular-nums">الكمية: {it.quantity}</span>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {req.adminNote && (
                            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 text-xs text-[#0b347e]">
                              <strong>رد الإدارة:</strong> {req.adminNote}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">سياسة الخصوصية وحماية بيانات العملاء</h3>
              <ul className="list-disc pr-5 space-y-2 text-slate-600">
                {privacyLines.map((line, i) => (
                  <li key={i}>{line}</li>
                ))}
              </ul>
            </div>
          )}

          {activeTab === 'complaints' && (
            <form onSubmit={handleComplaintSubmit} className="space-y-4">
              <h3 className="text-base font-bold text-slate-900">تقديم شكوى أو مقترح</h3>
              {sent ? (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-800 font-medium">
                  شكرًا لتواصلك مع معرض طابا. تم تسجيل رسالتك وستقوم الإدارة بمراجعتها والرد عليك في أقرب وقت.
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setType('مقترح')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                        type === 'مقترح'
                          ? 'bg-[#1D4ED8] text-white'
                          : 'border border-slate-200 text-slate-700'
                      }`}
                    >
                      مقترح تطوير
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('شكوى')}
                      className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
                        type === 'شكوى'
                          ? 'bg-[#DC2626] text-white'
                          : 'border border-slate-200 text-slate-700'
                      }`}
                    >
                      تسجيل شكوى
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="الاسم الكامل *"
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                    />
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="رقم الهاتف للتواصل *"
                      className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm tabular-nums focus:border-[#1D4ED8] focus:outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={orderNum}
                    onChange={(e) => setOrderNum(e.target.value)}
                    placeholder="رقم الطلب (اختياري — مثال: TABA-1001)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="اكتب تفاصيل الشكوى أو المقترح..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm focus:border-[#1D4ED8] focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-sm font-bold cursor-pointer"
                  >
                    إرسال للإدارة
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
