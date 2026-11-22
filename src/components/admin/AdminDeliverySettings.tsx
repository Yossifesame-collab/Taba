import React, { useState } from 'react';
import {
  Database,
  Download,
  HelpCircle,
  MapPin,
  PauseCircle,
  Plus,
  RefreshCw,
  Shield,
  Trash2,
  Upload,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { ComplaintSuggestion, DeliveryZone, ReturnRequest } from '../../types/taba';

export const AdminDeliverySettings: React.FC = () => {
  const {
    zones,
    settings,
    complaints,
    returnRequests,
    faqs,
    saveZone,
    deleteZone,
    updateSettings,
    updateComplaintStatus,
    updateReturnRequestStatus,
    saveFaq,
    deleteFaq,
    exportJsonBackup,
    importJsonBackup,
  } = useTaba();

  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState(30);
  const [minItems, setMinItems] = useState(2);
  const [minNote, setMinNote] = useState('حد أدنى: قطعتان');
  const [hours, setHours] = useState('يوميًا من 10 صباحًا حتى 10 مساءً');

  const [newFaqQuestion, setNewFaqQuestion] = useState('');
  const [newFaqAnswer, setNewFaqAnswer] = useState('');
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleAddZone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!zoneName.trim()) return;
    const newZone: DeliveryZone = {
      id: `zone-${Date.now()}`,
      name: zoneName.trim(),
      fee: zoneFee,
      minItemsCount: minItems,
      minOrderNote: minNote.trim(),
      deliveryHours: hours.trim(),
      isActive: true,
    };
    saveZone(newZone);
    setZoneName('');
  };

  const handleAddFaq = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFaqQuestion.trim() || !newFaqAnswer.trim()) return;
    saveFaq({
      id: `faq-${Date.now()}`,
      question: newFaqQuestion.trim(),
      answer: newFaqAnswer.trim(),
    });
    setNewFaqQuestion('');
    setNewFaqAnswer('');
  };

  const handleDownloadBackup = () => {
    const json = exportJsonBackup();
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `taba-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setBackupMessage('تم تحميل ملف النسخة الاحتياطية (JSON) بنجاح.');
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const res = importJsonBackup(String(reader.result));
      setBackupMessage(
        res.ok ? 'تمت استعادة البيانات من النسخة الاحتياطية بنجاح.' : res.error ?? 'فشلت الاستعادة'
      );
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          التوصيل والمواعيد والسياسات والمرتجعات والنسخ الاحتياطي
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          تحكم كامل في مناطق التوصيل، إيقاف الطلبات، بيانات المعرض والسياسات، إدارة المرتجعات والشكاوى، والنسخ الاحتياطي.
        </p>
      </div>

      {/* Store Order Acceptance Toggle, Hours & Identity */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <PauseCircle className="w-5 h-5 text-[#DC2626]" />
            <div>
              <h3 className="text-sm font-bold text-slate-900">حالة استقبال الطلبات على الموقع</h3>
              <p className="text-xs text-slate-500">
                عند الإيقاف المؤقت تظهر الرسالة للعملاء وتُعطل أزرار الإضافة والسلة.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ isAcceptingOrders: !settings.isAcceptingOrders })}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              settings.isAcceptingOrders
                ? 'bg-emerald-700 text-white'
                : 'bg-[#DC2626] text-white'
            }`}
          >
            {settings.isAcceptingOrders
              ? 'الطلبات مفتوحة حاليًا (اضغط للإيقاف)'
              : 'الطلبات متوقفة مؤقتًا (اضغط للتشغيل)'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رسالة الإيقاف المؤقت للعملاء
            </label>
            <input
              type="text"
              value={settings.pauseMessage}
              onChange={(e) => updateSettings({ pauseMessage: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              مواعيد الطلبات والتوصيل اليومية
            </label>
            <input
              type="text"
              value={settings.dailyOrderHours}
              onChange={(e) => updateSettings({ dailyOrderHours: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              ملاحظة الإجازات الرسمية والأسبوعية
            </label>
            <input
              type="text"
              value={settings.holidaysNote}
              onChange={(e) => updateSettings({ holidaysNote: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رقم واتساب الرسمي للمعرض
            </label>
            <input
              type="text"
              value={settings.whatsappNumber}
              onChange={(e) => updateSettings({ whatsappNumber: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm tabular-nums"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الجملة التعريفية للموقع
            </label>
            <input
              type="text"
              value={settings.storeTagline}
              onChange={(e) => updateSettings({ storeTagline: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رابط فيسبوك</label>
            <input
              type="url"
              value={settings.socialLinks.facebookUrl}
              onChange={(e) =>
                updateSettings({
                  socialLinks: { ...settings.socialLinks, facebookUrl: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رابط إنستجرام</label>
            <input
              type="url"
              value={settings.socialLinks.instagramUrl}
              onChange={(e) =>
                updateSettings({
                  socialLinks: { ...settings.socialLinks, instagramUrl: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">رابط تيك توك</label>
            <input
              type="url"
              value={settings.socialLinks.tiktokUrl}
              onChange={(e) =>
                updateSettings({
                  socialLinks: { ...settings.socialLinks, tiktokUrl: e.target.value },
                })
              }
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
          </div>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer pt-1">
          <input
            type="checkbox"
            checked={settings.splashEnabled}
            onChange={(e) => updateSettings({ splashEnabled: e.target.checked })}
          />
          <span>تفعيل شاشة الترحيب (18 عامًا من الثقة منذ 2008) عند دخول المتجر</span>
        </label>
      </div>

      {/* Delivery Zones CRUD */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <MapPin className="w-4 h-4 text-[#1D4ED8]" />
          <span>مناطق التوصيل والرسوم والحد الأدنى</span>
        </h3>

        <form onSubmit={handleAddZone} className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
          <input
            type="text"
            required
            value={zoneName}
            onChange={(e) => setZoneName(e.target.value)}
            placeholder="اسم المنطقة"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            type="number"
            min={0}
            value={zoneFee}
            onChange={(e) => setZoneFee(Number(e.target.value) || 0)}
            placeholder="رسوم التوصيل (ج.م)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <input
            type="number"
            min={1}
            value={minItems}
            onChange={(e) => setMinItems(Number(e.target.value) || 1)}
            placeholder="الحد الأدنى (عدد القطع)"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm tabular-nums"
          />
          <input
            type="text"
            value={minNote}
            onChange={(e) => setMinNote(e.target.value)}
            placeholder="وصف الحد الأدنى"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <input
            type="text"
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            placeholder="مواعيد التوصيل للمنطقة"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-sm font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة منطقة</span>
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {zones.map((z) => (
            <div key={z.id} className="py-3 flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
              <div>
                <div className="font-bold text-slate-900">{z.name}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  الرسوم: <strong className="tabular-nums">{z.fee} ج.م</strong> · {z.minOrderNote} ·{' '}
                  {z.deliveryHours}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={z.fee}
                  onChange={(e) => saveZone({ ...z, fee: Number(e.target.value) || 0 })}
                  aria-label={`تعديل رسوم ${z.name}`}
                  className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-xs tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => saveZone({ ...z, isActive: !z.isActive })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                    z.isActive
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-[#DC2626] border border-red-200'
                  }`}
                >
                  {z.isActive ? 'متاح' : 'متوقف'}
                </button>
                <button
                  type="button"
                  onClick={() => deleteZone(z.id)}
                  aria-label="حذف المنطقة"
                  className="p-2 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Return Requests & Complaints Inbox */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#1D4ED8]" />
            <span>طلبات الاستبدال والاسترجاع ({returnRequests.length})</span>
          </h3>
          {returnRequests.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد طلبات استبدال أو استرجاع.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {returnRequests.map((r) => (
                <div key={r.id} className="py-3 flex flex-wrap items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-sm">
                    <div className="font-bold text-slate-900">
                      [{r.requestType}] {r.orderNumber} · {r.customerName}
                    </div>
                    <div className="text-slate-700 font-medium">{r.productName}</div>
                    <p className="text-slate-500">{r.reason}</p>
                    <div className="text-[11px] text-slate-400 tabular-nums">{r.customerPhone}</div>
                  </div>
                  <select
                    value={r.status}
                    onChange={(e) =>
                      updateReturnRequestStatus(r.id, e.target.value as ReturnRequest['status'])
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="جديد">جديد</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="بانتظار استلام المنتج">بانتظار استلام المنتج</option>
                    <option value="تمت الموافقة">تمت الموافقة</option>
                    <option value="تم الاستبدال / الاسترجاع">تم الاستبدال / الاسترجاع</option>
                    <option value="مرفوض">مرفوض</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">
            الشكاوى والمقترحات الواردة ({complaints.length})
          </h3>
          {complaints.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد شكاوى أو مقترحات مسجلة.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {complaints.map((c) => (
                <div key={c.id} className="py-3 flex flex-wrap items-start justify-between gap-3 text-xs">
                  <div className="space-y-1 max-w-sm">
                    <div className="font-bold text-slate-900">
                      [{c.type}] {c.customerName} ·{' '}
                      <span className="tabular-nums">{c.customerPhone}</span>
                      {c.orderNumber ? ` · طلب ${c.orderNumber}` : ''}
                    </div>
                    <p className="text-slate-600">{c.message}</p>
                  </div>
                  <select
                    value={c.status}
                    onChange={(e) =>
                      updateComplaintStatus(c.id, e.target.value as ComplaintSuggestion['status'])
                    }
                    className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                  >
                    <option value="جديد">جديد</option>
                    <option value="قيد المراجعة">قيد المراجعة</option>
                    <option value="تم الحل">تم الحل</option>
                  </select>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Policies Editor & FAQ CRUD */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#1D4ED8]" />
          <span>تحرير السياسات والأسئلة الشائعة</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نص سياسة الاستبدال والاسترجاع (كل سطر كبند)
            </label>
            <textarea
              rows={5}
              value={settings.returnPolicyText}
              onChange={(e) => updateSettings({ returnPolicyText: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs leading-relaxed"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              نص سياسة الخصوصية وحماية البيانات (كل سطر كبند)
            </label>
            <textarea
              rows={5}
              value={settings.privacyPolicyText}
              onChange={(e) => updateSettings({ privacyPolicyText: e.target.value })}
              className="w-full rounded-lg border border-slate-200 p-3 text-xs leading-relaxed"
            />
          </div>
        </div>

        <div className="border-t border-slate-100 pt-4 space-y-3">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4 text-[#1D4ED8]" />
            <span>الأسئلة الشائعة ({faqs.length})</span>
          </div>
          <div className="space-y-2">
            {faqs.map((faq) => (
              <div
                key={faq.id}
                className="rounded-lg border border-slate-200 p-3 flex items-start justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900">{faq.question}</div>
                  <div className="text-slate-600 mt-1">{faq.answer}</div>
                </div>
                <button
                  type="button"
                  onClick={() => deleteFaq(faq.id)}
                  className="text-slate-400 hover:text-[#DC2626] p-1 cursor-pointer shrink-0"
                  aria-label="حذف السؤال"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddFaq} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
            <input
              type="text"
              required
              value={newFaqQuestion}
              onChange={(e) => setNewFaqQuestion(e.target.value)}
              placeholder="السؤال الشائع..."
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <input
              type="text"
              required
              value={newFaqAnswer}
              onChange={(e) => setNewFaqAnswer(e.target.value)}
              placeholder="الإجابة التوضيحية..."
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
            >
              إضافة سؤال للعملاء
            </button>
          </form>
        </div>
      </div>

      {/* JSON Backup & Restore (Section 12) */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[#1D4ED8]" />
          <h3 className="text-sm font-bold text-slate-900">النسخ الاحتياطي واستعادة البيانات (JSON)</h3>
        </div>
        <p className="text-xs text-slate-600">
          احفظ نسخة كاملة من المنتجات والأقسام والطلبات والإعدادات كملف JSON أو استعدها في أي وقت.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تحميل نسخة احتياطية كاملة</span>
          </button>
          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer">
            <Upload className="w-4 h-4 text-[#1D4ED8]" />
            <span>استعادة من ملف JSON</span>
            <input type="file" accept=".json,application/json" onChange={handleImportBackup} className="hidden" />
          </label>
        </div>
        {backupMessage && (
          <div className="text-xs font-medium text-[#0B3B91] bg-blue-50 border border-blue-200 rounded-lg p-2.5">
            {backupMessage}
          </div>
        )}
      </div>
    </div>
  );
};
