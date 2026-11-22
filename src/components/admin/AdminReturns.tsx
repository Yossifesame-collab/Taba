import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  PackageCheck,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import {
  ReturnedItemCondition,
  ReturnedProductEntry,
  ReturnRequest,
  ReturnRequestStatus,
} from '../../types/taba';

const RETURN_STATUSES: ReturnRequestStatus[] = [
  'جديد',
  'قيد المراجعة',
  'بانتظار استلام المنتج',
  'تمت الموافقة',
  'تم الاستبدال / الاسترجاع',
  'مرفوض',
];

export const AdminReturns: React.FC = () => {
  const {
    returnRequests,
    products,
    staffUsers,
    currentStaff,
    updateReturnRequestDetails,
    createStaffReturnRequest,
    restockReturnedItem,
  } = useTaba();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReturnRequestStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'استبدال' | 'استرجاع'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(returnRequests[0]?.id ?? null);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Manual creation modal/drawer state
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newOrderNumber, setNewOrderNumber] = useState('');
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newType, setNewType] = useState<'استبدال' | 'استرجاع'>('استبدال');
  const [newReason, setNewReason] = useState('');
  const [newAssignedId, setNewAssignedId] = useState(currentStaff?.id ?? '');
  const [newAdminNote, setNewAdminNote] = useState('');
  const [newItems, setNewItems] = useState<ReturnedProductEntry[]>([
    { productName: '', quantity: 1, condition: 'سليم بغلافه' },
  ]);

  // Add returned product to existing request
  const [extraProductName, setExtraProductName] = useState('');
  const [extraQty, setExtraQty] = useState(1);
  const [extraCond, setExtraCond] = useState<ReturnedItemCondition>('سليم بغلافه');

  const activeStaffList = useMemo(
    () => staffUsers.filter((u) => u.isActive),
    [staffUsers]
  );

  const filteredRequests = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return returnRequests.filter((r) => {
      if (statusFilter !== 'all' && r.status !== statusFilter) return false;
      if (typeFilter !== 'all' && r.requestType !== typeFilter) return false;
      if (q) {
        const hay = `${r.returnCode} ${r.orderNumber} ${r.customerName} ${r.customerPhone} ${r.productName}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [returnRequests, searchQuery, statusFilter, typeFilter]);

  const activeRequest: ReturnRequest | undefined =
    returnRequests.find((r) => r.id === selectedId) ?? filteredRequests[0];

  const [noteDraft, setNoteDraft] = useState('');
  React.useEffect(() => {
    if (activeRequest) {
      setNoteDraft(activeRequest.adminNote ?? '');
    }
  }, [activeRequest?.id]);

  const handleAssignReviewer = (reqId: string, staffId: string) => {
    const staff = staffUsers.find((u) => u.id === staffId);
    updateReturnRequestDetails(reqId, {
      assignedStaffId: staff?.id || undefined,
      assignedStaffName: staff?.name || undefined,
    });
    setFeedback(
      staff
        ? `تم تعيين «${staff.name}» مسؤولاً عن مراجعة الطلب.`
        : 'تم إلغاء تعيين المسؤول عن المراجعة.'
    );
  };

  const handleAddExtraReturnedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRequest || !extraProductName.trim()) return;
    const matched = products.find((p) => p.name.trim() === extraProductName.trim());
    const nextItems: ReturnedProductEntry[] = [
      ...activeRequest.returnedItems,
      {
        productId: matched?.id,
        productName: extraProductName.trim(),
        quantity: Math.max(1, extraQty),
        condition: extraCond,
        restocked: false,
      },
    ];
    updateReturnRequestDetails(activeRequest.id, { returnedItems: nextItems });
    setExtraProductName('');
    setExtraQty(1);
    setFeedback('تم تسجيل المنتج المرتجع داخل الطلب بنجاح.');
  };

  const handleRemoveReturnedItem = (req: ReturnRequest, idx: number) => {
    if (req.returnedItems.length <= 1) return;
    const next = req.returnedItems.filter((_, i) => i !== idx);
    updateReturnRequestDetails(req.id, { returnedItems: next });
  };

  const handleRestock = (reqId: string, idx: number) => {
    const res = restockReturnedItem(reqId, idx);
    setFeedback(res.message);
  };

  const handleCreateManual = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedItems = newItems
      .map((it) => {
        const matched = products.find((p) => p.name.trim() === it.productName.trim());
        return {
          ...it,
          productId: matched?.id,
          productName: it.productName.trim(),
          quantity: Math.max(1, it.quantity || 1),
          restocked: false,
        };
      })
      .filter((it) => it.productName.length > 0);

    if (
      !newOrderNumber.trim() ||
      !newCustomerName.trim() ||
      !newCustomerPhone.trim() ||
      !newReason.trim() ||
      cleanedItems.length === 0
    ) {
      return;
    }

    const created = createStaffReturnRequest({
      orderNumber: newOrderNumber,
      customerName: newCustomerName,
      customerPhone: newCustomerPhone,
      requestType: newType,
      reason: newReason,
      returnedItems: cleanedItems,
      assignedStaffId: newAssignedId || undefined,
      adminNote: newAdminNote || undefined,
    });

    setSelectedId(created.id);
    setShowCreateForm(false);
    setNewOrderNumber('');
    setNewCustomerName('');
    setNewCustomerPhone('');
    setNewReason('');
    setNewAdminNote('');
    setNewItems([{ productName: '', quantity: 1, condition: 'سليم بغلافه' }]);
    setFeedback(`تم تسجيل طلب ${created.requestType} بكود (${created.returnCode}) بنجاح.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">نظام المرتجعات والاستبدال</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تسجيل سبب المرتجع، تحديد المسؤول عن المراجعة، متابعة حالة الاستبدال، وتسجيل المنتجات المرتجعة وإعادتها للمخزون.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs sm:text-sm font-bold cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>{showCreateForm ? 'إغلاق نموذج التسجيل' : 'تسجيل مرتجع / استبدال يدوي'}</span>
        </button>
      </div>

      {feedback && (
        <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs sm:text-sm font-semibold text-[#0b347e] flex items-center justify-between">
          <span>{feedback}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs underline cursor-pointer"
          >
            إخفاء
          </button>
        </div>
      )}

      {/* Manual Return Recording Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreateManual}
          className="rounded-xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm"
        >
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-[#1D4ED8]" />
            <span>تسجيل طلب مرتجع أو استبدال من الإدارة (هاتف / واتساب)</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <input
              type="text"
              required
              value={newOrderNumber}
              onChange={(e) => setNewOrderNumber(e.target.value)}
              placeholder="رقم الطلب (TABA-1001) *"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm uppercase tabular-nums"
            />
            <input
              type="text"
              required
              value={newCustomerName}
              onChange={(e) => setNewCustomerName(e.target.value)}
              placeholder="اسم العميل *"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
            />
            <input
              type="tel"
              required
              value={newCustomerPhone}
              onChange={(e) => setNewCustomerPhone(e.target.value)}
              placeholder="رقم الهاتف *"
              className="rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm tabular-nums"
            />
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value as 'استبدال' | 'استرجاع')}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold"
            >
              <option value="استبدال">استبدال</option>
              <option value="استرجاع">استرجاع</option>
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                تحديد المسؤول عن المراجعة
              </label>
              <select
                value={newAssignedId}
                onChange={(e) => setNewAssignedId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
              >
                <option value="">غير محدد</option>
                {activeStaffList.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role === 'owner' ? 'مالك' : u.role === 'manager' ? 'مدير' : 'موظف'})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">سبب المرتجع / الاستبدال *</label>
              <input
                type="text"
                required
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder="مثال: عيب تغليف / تبديل بمقاس أو نوع آخر"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">المنتجات المرتجعة *</span>
              <button
                type="button"
                onClick={() =>
                  setNewItems((prev) => [
                    ...prev,
                    { productName: '', quantity: 1, condition: 'سليم بغلافه' },
                  ])
                }
                className="text-xs font-bold text-[#1D4ED8] hover:underline cursor-pointer"
              >
                + إضافة صنف آخر
              </button>
            </div>

            <datalist id="admin-return-products-datalist">
              {products.map((p) => (
                <option key={p.id} value={p.name} />
              ))}
            </datalist>

            {newItems.map((it, idx) => (
              <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <input
                  type="text"
                  required
                  list="admin-return-products-datalist"
                  value={it.productName}
                  onChange={(e) =>
                    setNewItems((prev) =>
                      prev.map((x, i) => (i === idx ? { ...x, productName: e.target.value } : x))
                    )
                  }
                  placeholder="اختر أو اكتب اسم المنتج..."
                  className="sm:col-span-6 rounded-lg border border-slate-200 px-3 py-1.5 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  value={it.quantity}
                  onChange={(e) =>
                    setNewItems((prev) =>
                      prev.map((x, i) =>
                        i === idx ? { ...x, quantity: Math.max(1, Number(e.target.value) || 1) } : x
                      )
                    )
                  }
                  className="sm:col-span-2 rounded-lg border border-slate-200 px-3 py-1.5 text-xs tabular-nums"
                />
                <select
                  value={it.condition}
                  onChange={(e) =>
                    setNewItems((prev) =>
                      prev.map((x, i) =>
                        i === idx
                          ? { ...x, condition: e.target.value as ReturnedItemCondition }
                          : x
                      )
                    )
                  }
                  className="sm:col-span-3 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                >
                  <option value="سليم بغلافه">سليم بغلافه</option>
                  <option value="تالف / عيب صناعة">تالف / عيب صناعة</option>
                  <option value="مفتوح">مفتوح</option>
                </select>
                <div className="sm:col-span-1 flex justify-end">
                  {newItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setNewItems((prev) => prev.filter((_, i) => i !== idx))}
                      className="text-slate-400 hover:text-[#DC2626] p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          <input
            type="text"
            value={newAdminNote}
            onChange={(e) => setNewAdminNote(e.target.value)}
            placeholder="ملاحظات داخلية أو رد يظهر للعميل (اختياري)"
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
          />

          <button
            type="submit"
            className="px-5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            حفظ وتسجيل الطلب
          </button>
        </form>
      )}

      {/* Search & Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="بحث بكود المرتجع (RET-) أو رقم الطلب أو الهاتف أو اسم المنتج..."
            className="w-full rounded-lg border border-slate-200 pr-9 pl-3 py-2 text-sm focus:border-[#1D4ED8] focus:outline-none"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as 'all' | 'استبدال' | 'استرجاع')}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
        >
          <option value="all">الكل (استبدال واسترجاع)</option>
          <option value="استبدال">استبدال فقط</option>
          <option value="استرجاع">استرجاع فقط</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | ReturnRequestStatus)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm"
        >
          <option value="all">كل الحالات ({returnRequests.length})</option>
          {RETURN_STATUSES.map((st) => (
            <option key={st} value={st}>
              {st}
            </option>
          ))}
        </select>
      </div>

      {/* Master-Detail View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* List */}
        <div className="lg:col-span-5 rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
          {filteredRequests.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500">
              لا توجد طلبات مرتجعات أو استبدال مطابقة.
            </div>
          ) : (
            filteredRequests.map((req) => (
              <button
                key={req.id}
                type="button"
                onClick={() => setSelectedId(req.id)}
                className={`w-full text-right p-4 transition-colors cursor-pointer ${
                  activeRequest?.id === req.id ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-extrabold text-[#0b347e] tabular-nums">
                    {req.returnCode} · {req.requestType}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      req.status === 'مرفوض'
                        ? 'bg-red-100 text-[#DC2626]'
                        : req.status === 'تم الاستبدال / الاسترجاع' || req.status === 'تمت الموافقة'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-blue-100 text-[#1D4ED8]'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
                <div className="text-xs font-semibold text-slate-800 mt-1">
                  طلب {req.orderNumber} · {req.customerName}
                </div>
                <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-2">
                  <span>{req.returnedItems.length} صنف مرتجع</span>
                  <span>·</span>
                  <span>المراجع: {req.assignedStaffName || 'غير معين'}</span>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Detail Workspace */}
        {activeRequest && (
          <div className="lg:col-span-7 rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-extrabold text-slate-900 tabular-nums">
                    {activeRequest.returnCode}
                  </h3>
                  <span className="px-2.5 py-0.5 rounded bg-slate-100 text-slate-800 text-xs font-bold">
                    {activeRequest.requestType}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  مرتبط بالطلب <strong className="text-slate-800">{activeRequest.orderNumber}</strong> ·{' '}
                  {activeRequest.customerName} (
                  <span className="tabular-nums">{activeRequest.customerPhone}</span>)
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5 tabular-nums">
                  تاريخ التسجيل: {new Date(activeRequest.createdAt).toLocaleString('ar-EG')}
                </div>
              </div>

              <select
                value={activeRequest.status}
                onChange={(e) =>
                  updateReturnRequestDetails(activeRequest.id, {
                    status: e.target.value as ReturnRequestStatus,
                  })
                }
                aria-label="حالة طلب الاستبدال"
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs sm:text-sm font-bold text-slate-900"
              >
                {RETURN_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            {/* Reason & Assigned Reviewer */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl bg-amber-50/60 border border-amber-200 p-3.5 space-y-1">
                <div className="text-xs font-bold text-amber-900">سبب المرتجع / الاستبدال المسجل:</div>
                <p className="text-xs sm:text-sm text-slate-800 leading-relaxed">
                  {activeRequest.reason}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 space-y-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-[#1D4ED8]" />
                  <span>المسؤول عن المراجعة والمتابعة:</span>
                </label>
                <select
                  value={activeRequest.assignedStaffId ?? ''}
                  onChange={(e) => handleAssignReviewer(activeRequest.id, e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs sm:text-sm font-semibold"
                >
                  <option value="">-- لم يُحدد مسؤول بعد --</option>
                  {activeStaffList.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} (
                      {u.role === 'owner' ? 'مالك' : u.role === 'manager' ? 'مدير' : 'موظف'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Returned Products Table & Restock Action */}
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <PackageCheck className="w-4 h-4 text-[#1D4ED8]" />
                <span>المنتجات المرتجعة وحالتها ({activeRequest.returnedItems.length})</span>
              </div>

              <div className="border border-slate-200 rounded-xl divide-y divide-slate-100">
                {activeRequest.returnedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="flex flex-wrap items-center gap-2 text-slate-500">
                        <span className="tabular-nums font-semibold">الكمية: {item.quantity}</span>
                        <span>·</span>
                        <span
                          className={`px-2 py-0.5 rounded font-semibold ${
                            item.condition === 'سليم بغلافه'
                              ? 'bg-emerald-50 text-emerald-700'
                              : item.condition === 'تالف / عيب صناعة'
                              ? 'bg-red-50 text-[#DC2626]'
                              : 'bg-amber-50 text-amber-800'
                          }`}
                        >
                          {item.condition}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.restocked ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>أُعيد للمخزون</span>
                        </span>
                      ) : (
                        item.condition === 'سليم بغلافه' && (
                          <button
                            type="button"
                            onClick={() => handleRestock(activeRequest.id, idx)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold cursor-pointer"
                          >
                            إرجاع للمخزون (+{item.quantity})
                          </button>
                        )
                      )}
                      {activeRequest.returnedItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveReturnedItem(activeRequest, idx)}
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

              {/* Add another returned item */}
              <form
                onSubmit={handleAddExtraReturnedItem}
                className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3"
              >
                <input
                  type="text"
                  required
                  list="admin-return-products-datalist"
                  value={extraProductName}
                  onChange={(e) => setExtraProductName(e.target.value)}
                  placeholder="إضافة منتج مرتجع إضافي..."
                  className="sm:col-span-5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs"
                />
                <input
                  type="number"
                  min={1}
                  value={extraQty}
                  onChange={(e) => setExtraQty(Math.max(1, Number(e.target.value) || 1))}
                  className="sm:col-span-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs tabular-nums"
                />
                <select
                  value={extraCond}
                  onChange={(e) => setExtraCond(e.target.value as ReturnedItemCondition)}
                  className="sm:col-span-3 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-xs"
                >
                  <option value="سليم بغلافه">سليم بغلافه</option>
                  <option value="تالف / عيب صناعة">تالف / عيب صناعة</option>
                  <option value="مفتوح">مفتوح</option>
                </select>
                <button
                  type="submit"
                  className="sm:col-span-2 px-3 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-bold cursor-pointer"
                >
                  إضافة
                </button>
              </form>
            </div>

            {/* Admin Note */}
            <div className="space-y-2 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-700">
                ملاحظة الإدارة والقرار (تظهر للعميل عند متابعة الطلب)
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="مثال: تم فحص المنتج والموافقة على الاستبدال خلال 24 ساعة"
                  className="flex-1 min-w-[200px] rounded-lg border border-slate-200 px-3 py-2 text-xs sm:text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    updateReturnRequestDetails(activeRequest.id, { adminNote: noteDraft });
                    setFeedback('تم حفظ ملاحظة المراجعة للعميل.');
                  }}
                  className="px-4 py-2 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
                >
                  حفظ الملاحظة
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
