import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Database,
  Download,
  FileCheck2,
  PauseCircle,
  RotateCcw,
  ShieldCheck,
  Trash2,
  Upload,
  Wrench,
} from 'lucide-react';
import { BackupRestoreScope, useTaba } from '../../context/TabaContext';
import { BackupVerificationReport } from '../../types/taba';

export const AdminMaintenanceBackup: React.FC = () => {
  const {
    settings,
    backupSnapshots,
    updateSettings,
    exportJsonBackup,
    verifyBackupJson,
    importJsonBackup,
    createBackupSnapshot,
    restoreFromSnapshot,
    deleteBackupSnapshot,
  } = useTaba();

  const [snapshotLabel, setSnapshotLabel] = useState('');
  const [restoreScope, setRestoreScope] = useState<BackupRestoreScope>('all');
  const [uploadedFileText, setUploadedFileText] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [verificationReport, setVerificationReport] = useState<{
    sourceLabel: string;
    report: BackupVerificationReport;
  } | null>(null);
  const [actionMessage, setActionMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const handleDownloadJsonFile = (jsonText?: string, prefix = 'taba-backup') => {
    const content = jsonText ?? exportJsonBackup();
    const blob = new Blob([content], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${prefix}-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setActionMessage({ ok: true, text: 'تم تصدير وتحميل ملف النسخة الاحتياطية بنجاح.' });
  };

  const handleSaveManualSnapshot = () => {
    const snap = createBackupSnapshot(snapshotLabel || undefined, 'manual');
    setSnapshotLabel('');
    setActionMessage({
      ok: true,
      text: `تم حفظ نسخة احتياطية فورية (${snap.label}) ويمكنك اختبار استرجاعها أو تنزيلها.`,
    });
  };

  const handleTestSnapshot = (label: string, jsonText: string) => {
    const report = verifyBackupJson(jsonText);
    setVerificationReport({ sourceLabel: label, report });
    setActionMessage({
      ok: report.valid,
      text: report.valid
        ? `نجح اختبار الاسترجاع للنسخة «${label}» والملف سليم وجاهز للاستعادة دون تعديل البيانات الحالية.`
        : `فشل اختبار الاسترجاع للنسخة «${label}» بسبب تلف أو نقص في البيانات.`,
    });
  };

  const handleSelectUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result);
      setUploadedFileText(text);
      setUploadedFileName(file.name);
      const report = verifyBackupJson(text);
      setVerificationReport({ sourceLabel: `ملف خارجي: ${file.name}`, report });
      setActionMessage({
        ok: report.valid,
        text: report.valid
          ? `تم فحص الملف «${file.name}» بنجاح (اختبار استرجاع ناجح) — اضغط زر الاستعادة للتطبيق.`
          : `الملف «${file.name}» غير صالح للاسترجاع.`,
      });
    };
    reader.readAsText(file);
  };

  const handleRestoreSnapshot = (snapId: string, label: string) => {
    const res = restoreFromSnapshot(snapId, restoreScope);
    setActionMessage({
      ok: res.ok,
      text: res.ok
        ? `تمت استعادة البيانات (${
            restoreScope === 'all'
              ? 'الكاملة'
              : restoreScope === 'products'
              ? 'المنتجات والأقسام'
              : restoreScope === 'orders'
              ? 'الطلبات والمرتجعات'
              : 'الإعدادات'
          }) من النسخة «${label}» بنجاح.`
        : res.error ?? 'تعذرت الاستعادة',
    });
  };

  const handleRestoreUploaded = () => {
    if (!uploadedFileText) return;
    const res = importJsonBackup(uploadedFileText, restoreScope);
    setActionMessage({
      ok: res.ok,
      text: res.ok
        ? `تمت استعادة البيانات من الملف «${uploadedFileName}» بنجاح.`
        : res.error ?? 'تعذرت الاستعادة',
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">وضع الصيانة والنسخ الاحتياطي والاستعادة</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          إيقاف الموقع أو الطلبات مؤقتًا وقت التحديثات، مع إدارة النسخ الاحتياطية الدورية واختبار صلاحية استرجاعها قبل التطبيق.
        </p>
      </div>

      {actionMessage && (
        <div
          className={`rounded-xl border p-3.5 text-xs sm:text-sm font-semibold flex items-center justify-between gap-2 ${
            actionMessage.ok
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-red-50 border-red-200 text-[#DC2626]'
          }`}
        >
          <span>{actionMessage.text}</span>
          <button
            type="button"
            onClick={() => setActionMessage(null)}
            className="text-xs underline cursor-pointer"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* 1. Maintenance Mode & Order Pause Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                settings.isMaintenanceMode ? 'bg-red-100 text-[#DC2626]' : 'bg-blue-50 text-[#1D4ED8]'
              }`}
            >
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                وضع الصيانة الكامل للمتجر
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                عند تفعيله تظهر صفحة صيانة رسمية للعملاء وتُمنع أي طلبات جديدة، بينما تظل لوحة الإدارة متاحة لك بالكامل.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => updateSettings({ isMaintenanceMode: !settings.isMaintenanceMode })}
            className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold cursor-pointer transition-colors ${
              settings.isMaintenanceMode
                ? 'bg-[#DC2626] hover:bg-red-700 text-white'
                : 'bg-slate-900 hover:bg-slate-800 text-white'
            }`}
          >
            {settings.isMaintenanceMode
              ? 'وضع الصيانة مُفعّل الآن (اضغط لإنهاء الصيانة)'
              : 'تفعيل وضع الصيانة الآن'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              عنوان شاشة الصيانة للعملاء
            </label>
            <input
              type="text"
              value={settings.maintenanceTitle}
              onChange={(e) => updateSettings({ maintenanceTitle: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              الوقت المتوقع للعودة
            </label>
            <input
              type="text"
              value={settings.maintenanceExpectedReturn}
              onChange={(e) => updateSettings({ maintenanceExpectedReturn: e.target.value })}
              placeholder="مثال: نعود للعمل خلال ساعتين"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              رسالة التوضيح التي تظهر للعميل أثناء الصيانة
            </label>
            <textarea
              rows={2}
              value={settings.maintenanceMessage}
              onChange={(e) => updateSettings({ maintenanceMessage: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 pt-1">
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceAllowTracking}
              onChange={(e) => updateSettings({ maintenanceAllowTracking: e.target.checked })}
            />
            <span>السماح للعملاء بمتابعة طلباتهم السابقة أثناء الصيانة</span>
          </label>
          <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
            <input
              type="checkbox"
              checked={settings.maintenanceAllowWhatsApp}
              onChange={(e) => updateSettings({ maintenanceAllowWhatsApp: e.target.checked })}
            />
            <span>إظهار زر التواصل عبر واتساب أثناء الصيانة</span>
          </label>
        </div>

        {/* Order-only Pause Mode */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-2.5">
            <PauseCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs sm:text-sm font-bold text-slate-900">
                إيقاف استقبال الطلبات فقط (مع بقاء تصفح المنتجات مفتوحًا)
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                مفيد في أوقات الضغط أو الإجازات القصيرة مع استمرار تصفح الكتالوج.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => updateSettings({ isAcceptingOrders: !settings.isAcceptingOrders })}
            className={`px-4 py-2 rounded-lg text-xs font-bold cursor-pointer ${
              settings.isAcceptingOrders
                ? 'bg-emerald-700 text-white'
                : 'bg-amber-600 text-white'
            }`}
          >
            {settings.isAcceptingOrders
              ? 'الطلبات مفتوحة حاليًا (إيقاف مؤقت)'
              : 'الطلبات متوقفة حاليًا (إعادة فتح)'}
          </button>
        </div>
      </div>

      {/* 2. Periodic Backup & Restore Testing */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1D4ED8] flex items-center justify-center shrink-0">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900">
                النسخ الاحتياطي الدوري واختبار الاستعادة
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                حفظ نسخ دورية تلقائية ويدوية للطلبات والمنتجات والإعدادات مع اختبار سلامة الاسترجاع قبل التنفيذ.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoBackupEnabled}
                onChange={(e) => updateSettings({ autoBackupEnabled: e.target.checked })}
              />
              <span>نسخ دوري تلقائي كل</span>
            </label>
            <select
              value={settings.autoBackupIntervalHours}
              onChange={(e) =>
                updateSettings({ autoBackupIntervalHours: Number(e.target.value) || 6 })
              }
              disabled={!settings.autoBackupEnabled}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold"
            >
              <option value={1}>ساعة واحدة</option>
              <option value={6}>6 ساعات</option>
              <option value={12}>12 ساعة</option>
              <option value={24}>24 ساعة (يوميًا)</option>
            </select>
          </div>
        </div>

        {/* Create Immediate Snapshot / Download / Upload Test */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">إنشاء أو تنزيل نسخة احتياطية فورية</div>
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={snapshotLabel}
                onChange={(e) => setSnapshotLabel(e.target.value)}
                placeholder="اسم مميز للنسخة (اختياري)..."
                className="flex-1 min-w-[160px] rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs"
              />
              <button
                type="button"
                onClick={handleSaveManualSnapshot}
                className="px-3.5 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer"
              >
                حفظ نسخة بالنظام
              </button>
              <button
                type="button"
                onClick={() => handleDownloadJsonFile()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-800 text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>تصدير JSON</span>
              </button>
            </div>
            {settings.lastAutoBackupAt && (
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5 tabular-nums">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  آخر نسخة دورية تلقائية:{' '}
                  {new Date(settings.lastAutoBackupAt).toLocaleString('ar-EG')}
                </span>
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-800">
              استعادة واختبار ملف نسخة احتياطية خارجي (JSON)
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs font-bold text-slate-800 cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-[#1D4ED8]" />
                <span>{uploadedFileName ? uploadedFileName : 'اختيار ملف JSON للفحص والاستعادة'}</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleSelectUploadFile}
                  className="hidden"
                />
              </label>

              {uploadedFileText && (
                <button
                  type="button"
                  onClick={handleRestoreUploaded}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>تنفيذ الاستعادة من الملف</span>
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-700">نطاق الاستعادة:</span>
              <select
                value={restoreScope}
                onChange={(e) => setRestoreScope(e.target.value as BackupRestoreScope)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-bold"
              >
                <option value="all">استعادة كاملة للنظام</option>
                <option value="products">المنتجات والأقسام فقط</option>
                <option value="orders">الطلبات والمرتجعات والشكاوى فقط</option>
                <option value="settings">الإعدادات والمظهر والبانرات فقط</option>
              </select>
            </div>
          </div>
        </div>

        {/* Dry-Run Verification Report */}
        {verificationReport && (
          <div
            className={`rounded-xl border p-4 space-y-2.5 text-xs ${
              verificationReport.report.valid
                ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                : 'bg-red-50 border-red-200 text-red-950'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="font-extrabold flex items-center gap-2 text-sm">
                {verificationReport.report.valid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
                )}
                <span>تقرير اختبار إمكانية الاسترجاع — {verificationReport.sourceLabel}</span>
              </div>
              <span className="text-[11px] opacity-75 tabular-nums">
                {new Date(verificationReport.report.checkedAt).toLocaleTimeString('ar-EG')}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 tabular-nums">
              <div className="rounded-lg bg-white/80 p-2 border border-black/5">
                المنتجات: <strong>{verificationReport.report.summary.products}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2 border border-black/5">
                الأقسام: <strong>{verificationReport.report.summary.categories}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2 border border-black/5">
                الطلبات: <strong>{verificationReport.report.summary.orders}</strong>
              </div>
              <div className="rounded-lg bg-white/80 p-2 border border-black/5">
                المرتجعات: <strong>{verificationReport.report.summary.returns}</strong>
              </div>
            </div>

            {verificationReport.report.errors.length > 0 && (
              <ul className="list-disc pr-5 text-[#DC2626] font-semibold">
                {verificationReport.report.errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}

            {verificationReport.report.warnings.length > 0 && (
              <ul className="list-disc pr-5 text-amber-800">
                {verificationReport.report.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Saved Snapshots History */}
        <div className="space-y-2.5">
          <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-[#1D4ED8]" />
            <span>سجل النسخ الاحتياطية المحفوظة ({backupSnapshots.length})</span>
          </div>

          {backupSnapshots.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد نسخ احتياطية محفوظة بعد.</p>
          ) : (
            <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
              {backupSnapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          snap.kind === 'auto'
                            ? 'bg-blue-100 text-[#0b347e]'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {snap.kind === 'auto' ? 'نسخة دورية' : 'نسخة يدوية'}
                      </span>
                      <span className="font-bold text-slate-900">{snap.label}</span>
                    </div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {snap.stats.products} منتج · {snap.stats.orders} طلب · {snap.stats.returns}{' '}
                      مرتجع · {snap.stats.categories} قسم · بواسطة {snap.createdBy}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTestSnapshot(snap.label, snap.payloadJson)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-[#0b347e] font-bold hover:bg-blue-100 cursor-pointer"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span>اختبار الاسترجاع</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreSnapshot(snap.id, snap.label)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>استعادة</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadJsonFile(snap.payloadJson, `taba-snapshot-${snap.kind}`)
                      }
                      title="تحميل ملف JSON"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteBackupSnapshot(snap.id)}
                      title="حذف النسخة"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
