import React from 'react';
import {
  AlertTriangle,
  Bell,
  CheckCircle2,
  ClipboardList,
  MessageSquare,
  Package,
  RefreshCw,
  Star,
  Users,
  Wrench,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';

export const AdminOverview: React.FC<{ onNavigateSection: (section: string) => void }> = ({
  onNavigateSection,
}) => {
  const {
    orders,
    products,
    reviews,
    complaints,
    returnRequests,
    staffUsers,
    auditLog,
    settings,
    unreadNotificationsCount,
  } = useTaba();

  const newOrdersCount = orders.filter((o) => o.status === 'طلب جديد').length;
  const prepOrdersCount = orders.filter(
    (o) => o.status === 'تم التأكيد' || o.status === 'جاري التجهيز' || o.status === 'خرج للتوصيل'
  ).length;
  const completedCount = orders.filter((o) => o.status === 'تم التسليم').length;
  const cancelledCount = orders.filter((o) => o.status === 'ملغي').length;

  const lowStockProducts = products.filter(
    (p) => p.stockQty <= p.lowStockThreshold || p.availability !== 'متوفر'
  );
  const pendingReviewsCount = reviews.filter((r) => r.status === 'pending').length;
  const openComplaintsCount = complaints.filter((c) => c.status !== 'تم الحل').length;
  const openReturnsCount = returnRequests.filter(
    (r) => r.status === 'جديد' || r.status === 'قيد المراجعة' || r.status === 'بانتظار استلام المنتج'
  ).length;
  const topRequested = [...products].sort((a, b) => b.requestCount - a.requestCount).slice(0, 5);

  const staffPerformance = staffUsers.map((u) => {
    const ordersTouched = orders.filter((ord) =>
      ord.history.some((h) => h.changedBy === u.name)
    ).length;
    const actionsCount = auditLog.filter((a) => a.actorName === u.name).length;
    return { user: u, ordersTouched, actionsCount };
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">نظرة عامة على التشغيل</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          ملخص حيّ مبني على الطلبات والمنتجات والتقييمات والمرتجعات وأداء الفريق المسجل في النظام.
        </p>
      </div>

      {/* Quick Alerts Bar */}
      {(settings.isMaintenanceMode || unreadNotificationsCount > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50/70 p-4">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {settings.isMaintenanceMode && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-red-100 text-[#DC2626] font-bold">
                <Wrench className="w-3.5 h-3.5" />
                <span>المتجر في وضع الصيانة حاليًا</span>
              </span>
            )}
            {unreadNotificationsCount > 0 && (
              <span className="inline-flex items-center gap-1.5 text-[#0B3B91] font-bold">
                <Bell className="w-4 h-4 text-[#1D4ED8]" />
                <span>لديك {unreadNotificationsCount} تنبيهًا جديدًا حسب صلاحياتك</span>
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadNotificationsCount > 0 && (
              <button
                type="button"
                onClick={() => onNavigateSection('notifications')}
                className="px-3 py-1.5 rounded-lg bg-[#1D4ED8] text-white text-xs font-bold cursor-pointer"
              >
                فتح مركز الإشعارات
              </button>
            )}
            {settings.isMaintenanceMode && (
              <button
                type="button"
                onClick={() => onNavigateSection('backup')}
                className="px-3 py-1.5 rounded-lg bg-white border border-red-200 text-[#DC2626] text-xs font-bold cursor-pointer"
              >
                إدارة الصيانة
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          type="button"
          onClick={() => onNavigateSection('orders')}
          className="text-right rounded-xl border border-slate-200 bg-white p-4 hover:border-[#1D4ED8] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>طلبات جديدة</span>
            <ClipboardList className="w-4 h-4 text-[#1D4ED8]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{newOrdersCount}</div>
          <div className="mt-1 text-xs text-slate-500">بانتظار مراجعة الأسعار</div>
        </button>

        <button
          type="button"
          onClick={() => onNavigateSection('orders')}
          className="text-right rounded-xl border border-slate-200 bg-white p-4 hover:border-[#1D4ED8] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>قيد التجهيز والتوصيل</span>
            <Package className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">{prepOrdersCount}</div>
          <div className="mt-1 text-xs text-slate-500">طلبات جارية</div>
        </button>

        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>مكتملة / ملغاة</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {completedCount} / {cancelledCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">إجمالي الطلبات: {orders.length}</div>
        </div>

        <button
          type="button"
          onClick={() => onNavigateSection(openReturnsCount > 0 ? 'returns' : 'delivery')}
          className="text-right rounded-xl border border-slate-200 bg-white p-4 hover:border-[#1D4ED8] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>تقييمات · شكاوى · مرتجعات</span>
            <RefreshCw className="w-4 h-4 text-[#DC2626]" />
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 tabular-nums">
            {pendingReviewsCount} / {openComplaintsCount} / {openReturnsCount}
          </div>
          <div className="mt-1 text-xs text-slate-500">بانتظار المتابعة</div>
        </button>
      </div>

      {/* Stock Alerts & Top Products */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#DC2626]" />
              <span>تنبيهات المخزون المنخفض ({lowStockProducts.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('products')}
              className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
            >
              إدارة المخزون
            </button>
          </div>
          {lowStockProducts.length === 0 ? (
            <p className="text-xs text-slate-500">جميع المنتجات متوفرة بكميات آمنة.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {lowStockProducts.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{p.name}</div>
                    <div className="text-slate-500">{p.availability}</div>
                  </div>
                  <span className="tabular-nums font-bold text-[#DC2626] shrink-0">
                    متبقي: {p.stockQty}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-900">المنتجات الأكثر طلبًا</h3>
          <div className="divide-y divide-slate-100">
            {topRequested.map((p, idx) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-100 text-slate-700 font-bold flex items-center justify-center tabular-nums shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-semibold text-slate-900 truncate">{p.name}</span>
                </div>
                <span className="tabular-nums text-slate-700 font-semibold shrink-0">
                  {p.requestCount} طلب
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Performance & Recent System Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-[#1D4ED8]" />
              <span>أداء وحالة حسابات الفريق ({staffUsers.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => onNavigateSection('reviews')}
              className="text-xs font-semibold text-[#1D4ED8] hover:underline cursor-pointer"
            >
              تقييمات ({pendingReviewsCount})
            </button>
          </div>
          <div className="divide-y divide-slate-100">
            {staffPerformance.map(({ user, ordersTouched, actionsCount }) => (
              <div key={user.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div>
                  <span className="font-semibold text-slate-900">{user.name}</span>
                  <span className="text-slate-500 mx-1.5">·</span>
                  <span className="text-slate-500">
                    {user.role === 'owner' ? 'مالك' : user.role === 'manager' ? 'مدير' : 'موظف'}
                  </span>
                  <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                    طلبات تمت معالجتها: {ordersTouched} · حركات مسجلة: {actionsCount}
                  </div>
                </div>
                <span className={user.isActive ? 'text-emerald-700 font-semibold' : 'text-[#DC2626]'}>
                  {user.isActive ? 'نشط' : 'موقوف'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-600" />
              <span>أحدث الحركات في النظام</span>
            </h3>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="divide-y divide-slate-100">
            {auditLog.slice(0, 5).map((entry) => (
              <div key={entry.id} className="py-2 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-slate-900">
                    {entry.actorName} — {entry.action}
                  </span>
                  <span className="text-slate-400 tabular-nums shrink-0">
                    {new Date(entry.timestamp).toLocaleTimeString('ar-EG', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="text-slate-500 mt-0.5 truncate">{entry.details}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
