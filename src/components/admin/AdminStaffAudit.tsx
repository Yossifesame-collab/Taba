import React, { useState } from 'react';
import {
  Check,
  Copy,
  History,
  Lock,
  Mail,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCog,
  UserPlus,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { StaffPermissions, StaffRole } from '../../types/taba';

const DEFAULT_EMP_PERMS: StaffPermissions = {
  manageProducts: false,
  manageOrders: true,
  cancelOrders: false,
  manageOffers: false,
  manageHomepage: false,
  manageDelivery: false,
  manageReviews: true,
  viewReports: false,
  manageStaff: false,
  viewAuditLog: false,
};

const DEFAULT_MANAGER_PERMS: StaffPermissions = {
  manageProducts: true,
  manageOrders: true,
  cancelOrders: true,
  manageOffers: true,
  manageHomepage: true,
  manageDelivery: true,
  manageReviews: true,
  viewReports: true,
  manageStaff: false,
  viewAuditLog: false,
};

const PERM_LABELS: Array<{ key: keyof StaffPermissions; label: string }> = [
  { key: 'manageOrders', label: 'متابعة وتحديث الطلبات' },
  { key: 'cancelOrders', label: 'إلغاء الطلبات' },
  { key: 'manageProducts', label: 'إدارة المنتجات والأقسام' },
  { key: 'manageOffers', label: 'إدارة العروض والكوبونات' },
  { key: 'manageHomepage', label: 'تعديل شكل الموقع والبانرات' },
  { key: 'manageDelivery', label: 'التوصيل والإعدادات' },
  { key: 'manageReviews', label: 'مراجعة التقييمات' },
  { key: 'viewReports', label: 'الاطلاع على التقارير' },
  { key: 'viewAuditLog', label: 'عرض سجل التعديلات' },
];

export const AdminStaffAudit: React.FC = () => {
  const {
    currentStaff,
    staffUsers,
    auditLog,
    createStaffAccount,
    updateStaffAccount,
    deleteStaffAccount,
    updateOwnProfile,
  } = useTaba();

  const isOwner = currentStaff?.role === 'owner';

  // Owner own profile update
  const [ownerName, setOwnerName] = useState(currentStaff?.name ?? '');
  const [ownerFeedback, setOwnerFeedback] = useState<string | null>(null);

  // Create Staff Account state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<StaffRole>('employee');
  const [perms, setPerms] = useState<StaffPermissions>(DEFAULT_EMP_PERMS);
  const [creating, setCreating] = useState(false);
  const [formFeedback, setFormFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [createdInvite, setCreatedInvite] = useState<{
    name: string;
    email: string;
    role: StaffRole;
  } | null>(null);
  const [copiedInvite, setCopiedInvite] = useState(false);

  // Existing accounts management
  const [rowFeedback, setRowFeedback] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [auditSecurityOnly, setAuditSecurityOnly] = useState(false);

  const handleSaveOwnerProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setOwnerFeedback(null);
    const res = await updateOwnProfile({
      name: ownerName,
      username: currentStaff?.email || currentStaff?.username || ownerName,
    });
    if (!res.ok) {
      setOwnerFeedback(res.error ?? 'تعذر تحديث اسم المالك');
      return;
    }
    setOwnerFeedback('تم تحديث اسم العرض الخاص بالمالك بنجاح.');
  };

  const handleRolePreset = (nextRole: StaffRole) => {
    setRole(nextRole);
    setPerms(nextRole === 'manager' ? DEFAULT_MANAGER_PERMS : DEFAULT_EMP_PERMS);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (creating) return;
    setFormFeedback(null);
    setCreatedInvite(null);
    setCreating(true);
    const cleanEmail = email.trim().toLowerCase();
    const res = await createStaffAccount({
      name,
      username: cleanEmail,
      email: cleanEmail,
      role,
      permissions: perms,
    });
    setCreating(false);
    if (!res.ok) {
      setFormFeedback({ ok: false, text: res.error ?? 'تعذر إضافة الحساب' });
    } else {
      setCreatedInvite({
        name: name.trim(),
        email: cleanEmail,
        role,
      });
      setName('');
      setEmail('');
      setRole('employee');
      setPerms(DEFAULT_EMP_PERMS);
      setFormFeedback({
        ok: true,
        text: 'تمت إضافة الموظف في قاعدة البيانات السحابية بنجاح ويمكنه الدخول فورًا بحساب Google الخاص به.',
      });
    }
  };

  const handleCopyInvite = async () => {
    if (!createdInvite) return;
    const adminUrl =
      typeof window !== 'undefined' ? `${window.location.origin}/#/admin` : '#/admin';
    const roleLabel = createdInvite.role === 'manager' ? 'مدير' : 'موظف';
    const text = `دعوة الدخول للوحة إدارة معرض طابا (${roleLabel}):\nالاسم: ${createdInvite.name}\nالبريد المصرح له: ${createdInvite.email}\nرابط الدخول: ${adminUrl}\n(يرجى تسجيل الدخول بنفس حساب Google الموضح أعلاه)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedInvite(true);
      window.setTimeout(() => setCopiedInvite(false), 2000);
    } catch {
      // Ignore clipboard failures
    }
  };

  const handleDeleteStaff = (staffId: string, staffName: string) => {
    const res = deleteStaffAccount(staffId);
    setConfirmDeleteId(null);
    if (!res.ok) {
      setRowFeedback(res.error ?? 'تعذر حذف الحساب');
      return;
    }
    setRowFeedback(`تم حذف حساب (${staffName}) وإلغاء صلاحية دخوله نهائيًا.`);
  };

  const displayedAudit = auditSecurityOnly
    ? auditLog.filter((a) => a.isSecurityEvent)
    : auditLog;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">
          إدارة حسابات الموظفين (Google Auth) وسجل التعديلات
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          إضافة حسابات الموظفين والمديرين بالبريد الإلكتروني وتحديد الصلاحيات صلاحية حصرية للمالك فقط.
        </p>
      </div>

      {!isOwner && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs sm:text-sm font-semibold text-amber-900 flex items-center gap-2.5">
          <Lock className="w-5 h-5 text-amber-700 shrink-0" />
          <span>
            إضافة حسابات الموظفين أو تعديل صلاحياتهم وإيقاف الحسابات متاح للمالك الرئيسي فقط.
          </span>
        </div>
      )}

      {/* Owner Exclusive Sections */}
      {isOwner && (
        <>
          {/* 1. Owner Profile & Cloud Auth Security Status */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={handleSaveOwnerProfile}
              className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCog className="w-4 h-4 text-[#1D4ED8]" />
                <span>بيانات حساب المالك الرئيسي</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">اسم المالك</label>
                  <input
                    type="text"
                    required
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    بريد المالك الموثّق (Google)
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={currentStaff?.email || currentStaff?.username || ''}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm text-slate-600"
                    dir="ltr"
                  />
                </div>
              </div>

              {ownerFeedback && (
                <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                  {ownerFeedback}
                </div>
              )}

              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold cursor-pointer"
              >
                حفظ اسم المالك
              </button>
            </form>

            <div className="lg:col-span-5 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>حماية الدخول السحابية (مُفعّلة)</span>
                </h3>
                <p className="text-xs text-emerald-900/90 leading-relaxed">
                  يتم التحقق من دخول جميع الموظفين والمديرين عبر حساب Google الرسمي وقواعد أمان
                  Firestore — ولا يمكن لأي شخص غير مُضاف في القائمة أدناه فتح لوحة الإدارة.
                </p>
              </div>
              <div className="text-[11px] font-semibold text-emerald-800 bg-white/80 rounded-lg px-3 py-2 border border-emerald-200">
                أزرار التجربة الوهمية متوقفة نهائيًا في وضع التشغيل الفعلي.
              </div>
            </div>
          </div>

          {/* 2. Create New Staff / Manager Account by Owner */}
          <form
            onSubmit={handleCreate}
            className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#1D4ED8]" />
                <span>إضافة حساب موظف أو مدير جديد (عبر بريد Google)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleRolePreset('employee')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    role === 'employee'
                      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  قالب صلاحيات موظف
                </button>
                <button
                  type="button"
                  onClick={() => handleRolePreset('manager')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold border cursor-pointer ${
                    role === 'manager'
                      ? 'bg-[#1D4ED8] text-white border-[#1D4ED8]'
                      : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  قالب صلاحيات مدير
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الاسم الكامل *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثال: أحمد علي"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  بريد الموظف على Google (Gmail) *
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="employee@gmail.com"
                    className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">الدور الوظيفي</label>
                <select
                  value={role}
                  onChange={(e) => handleRolePreset(e.target.value as StaffRole)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                >
                  <option value="employee">موظف (Employee)</option>
                  <option value="manager">مدير (Manager)</option>
                </select>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3">
              <div className="text-xs font-bold text-slate-700 mb-2">صلاحيات الحساب داخل لوحة الإدارة:</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
                {PERM_LABELS.map((item) => (
                  <label
                    key={item.key}
                    className="inline-flex items-center gap-2 text-xs text-slate-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={perms[item.key]}
                      onChange={(e) => setPerms({ ...perms, [item.key]: e.target.checked })}
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {formFeedback && (
              <div
                className={`text-xs font-medium rounded-lg p-3 border ${
                  formFeedback.ok
                    ? 'text-emerald-900 bg-emerald-50 border-emerald-200'
                    : 'text-[#DC2626] bg-red-50 border-red-200'
                }`}
              >
                {formFeedback.text}
              </div>
            )}

            {createdInvite && (
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-[#0b347e]">
                    تم اعتماد حساب ({createdInvite.name}):
                  </div>
                  <div className="text-slate-800">
                    البريد المصرح له بالدخول:{' '}
                    <code className="bg-white px-2 py-0.5 rounded border border-blue-200 font-mono">
                      {createdInvite.email}
                    </code>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCopyInvite()}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                >
                  {copiedInvite ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedInvite ? 'تم النسخ!' : 'نسخ دعوة الدخول للموظف'}</span>
                </button>
              </div>
            )}

            <button
              type="submit"
              disabled={creating}
              className="px-5 py-2.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:opacity-60 text-white text-xs sm:text-sm font-bold cursor-pointer"
            >
              {creating ? 'جاري الحفظ في السحابة...' : 'إضافة الحساب ومنح الصلاحية'}
            </button>
          </form>

          {/* 3. Existing Accounts Matrix (Owner Full Control) */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">
              حسابات الفريق الحالية والتحكم بالصلاحيات ({staffUsers.length})
            </h3>
            {rowFeedback && (
              <div className="text-xs font-medium text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-2.5">
                {rowFeedback}
              </div>
            )}
            <div className="space-y-4">
              {staffUsers.map((u) => (
                <div key={u.id} className="rounded-xl border border-slate-200 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
                        <span>{u.name}</span>
                        <span className="text-xs font-mono text-slate-500" dir="ltr">
                          {u.email || u.username}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            u.role === 'owner'
                              ? 'bg-blue-100 text-[#0b347e]'
                              : u.role === 'manager'
                              ? 'bg-slate-200 text-slate-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {u.role === 'owner' ? 'المالك الرئيسي' : u.role === 'manager' ? 'مدير' : 'موظف'}
                        </span>
                        {!u.isActive && (
                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-[#DC2626]">
                            حساب موقوف
                          </span>
                        )}
                      </div>
                      {u.lastLoginAt && (
                        <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                          آخر دخول: {new Date(u.lastLoginAt).toLocaleString('ar-EG')}
                        </div>
                      )}
                    </div>

                    {u.role !== 'owner' && (
                      <div className="flex flex-wrap items-center gap-2">
                        <select
                          value={u.role}
                          onChange={(e) =>
                            void updateStaffAccount(u.id, { role: e.target.value as StaffRole })
                          }
                          aria-label={`تغيير دور ${u.name}`}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold"
                        >
                          <option value="employee">موظف</option>
                          <option value="manager">مدير</option>
                        </select>

                        <button
                          type="button"
                          onClick={() => void updateStaffAccount(u.id, { isActive: !u.isActive })}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                            u.isActive
                              ? 'bg-red-50 text-[#DC2626] border border-red-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}
                        >
                          {u.isActive ? 'إيقاف الحساب' : 'إعادة تفعيل'}
                        </button>

                        {confirmDeleteId === u.id ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleDeleteStaff(u.id, u.name)}
                              className="px-2.5 py-1.5 rounded-lg bg-[#DC2626] text-white text-xs font-bold cursor-pointer"
                            >
                              تأكيد الحذف
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-2 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-600 cursor-pointer"
                            >
                              تراجع
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(u.id)}
                            aria-label={`حذف حساب ${u.name}`}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {u.role !== 'owner' && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 pt-2 border-t border-slate-100">
                      {PERM_LABELS.map((item) => (
                        <label
                          key={item.key}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={u.permissions[item.key]}
                            onChange={(e) =>
                              void updateStaffAccount(u.id, {
                                permissions: { ...u.permissions, [item.key]: e.target.checked },
                              })
                            }
                          />
                          <span>{item.label}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Audit Log */}
      {(isOwner || currentStaff?.permissions.viewAuditLog) && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <History className="w-4 h-4 text-[#1D4ED8]" />
              <span>سجل التعديلات والأمان ({displayedAudit.length})</span>
            </h3>
            <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={auditSecurityOnly}
                onChange={(e) => setAuditSecurityOnly(e.target.checked)}
              />
              <span>عرض أحداث الأمان والدخول فقط</span>
            </label>
          </div>
          <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
            {displayedAudit.map((entry) => (
              <div
                key={entry.id}
                className="py-2.5 flex flex-wrap items-start justify-between gap-2 text-xs"
              >
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-900 flex items-center gap-1.5">
                    {entry.isSecurityEvent && (
                      <ShieldAlert className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    )}
                    <span>
                      {entry.actorName} — {entry.action}
                    </span>
                  </div>
                  <div className="text-slate-600">{entry.details}</div>
                </div>
                <span className="text-slate-400 tabular-nums shrink-0">
                  {new Date(entry.timestamp).toLocaleString('ar-EG')}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

