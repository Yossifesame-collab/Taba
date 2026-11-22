import React, { useMemo, useState } from 'react';
import { Check, Download, Star, Users, XCircle } from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { exportCsvForExcel } from '../../utils/imageProcessor';

export const AdminReviews: React.FC = () => {
  const { reviews, moderateReview } = useTaba();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-900">مراجعة تقييمات العملاء</h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          لا يُنشر أي تقييم على صفحة المنتج إلا بعد موافقة الإدارة.
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100">
        {reviews.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">لا توجد تقييمات مسجلة.</div>
        ) : (
          reviews.map((rev) => (
            <div key={rev.id} className="p-4 flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1 max-w-xl">
                <div className="text-sm font-bold text-slate-900">{rev.productName}</div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span>{rev.customerName}</span>
                  <span>·</span>
                  <span className="inline-flex items-center gap-0.5 text-amber-500">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-500" />
                    ))}
                  </span>
                  <span>·</span>
                  <span
                    className={`font-semibold ${
                      rev.status === 'approved'
                        ? 'text-emerald-700'
                        : rev.status === 'rejected'
                        ? 'text-[#DC2626]'
                        : 'text-amber-700'
                    }`}
                  >
                    {rev.status === 'approved'
                      ? 'منشور'
                      : rev.status === 'rejected'
                      ? 'مرفوض'
                      : 'بانتظار المراجعة'}
                  </span>
                </div>
                <p className="text-sm text-slate-700 pt-1">{rev.comment}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => moderateReview(rev.id, 'approved')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>اعتماد ونشر</span>
                </button>
                <button
                  type="button"
                  onClick={() => moderateReview(rev.id, 'rejected')}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-200 text-[#DC2626] hover:bg-red-50 text-xs font-semibold cursor-pointer"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>رفض</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const AdminReports: React.FC = () => {
  const { orders, products, staffUsers, auditLog } = useTaba();
  const [period, setPeriod] = useState<'all' | 'daily' | 'monthly'>('all');

  const filteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter((o) => {
      if (period === 'all') return true;
      const d = new Date(o.createdAt);
      if (period === 'daily') {
        return (
          d.getFullYear() === now.getFullYear() &&
          d.getMonth() === now.getMonth() &&
          d.getDate() === now.getDate()
        );
      }
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    });
  }, [orders, period]);

  const completed = filteredOrders.filter((o) => o.status === 'تم التسليم');
  const cancelled = filteredOrders.filter((o) => o.status === 'ملغي');

  // Top zones computed directly from filtered orders
  const zoneCounts = filteredOrders.reduce<Record<string, number>>((acc, ord) => {
    acc[ord.zoneName] = (acc[ord.zoneName] ?? 0) + 1;
    return acc;
  }, {});
  const topZones = Object.entries(zoneCounts).sort((a, b) => b[1] - a[1]);

  const topProducts = [...products].sort((a, b) => b.requestCount - a.requestCount).slice(0, 6);

  const staffStats = staffUsers.map((u) => {
    const handled = filteredOrders.filter((o) =>
      o.history.some((h) => h.changedBy === u.name)
    ).length;
    const totalActions = auditLog.filter((a) => a.actorName === u.name).length;
    return {
      id: u.id,
      name: u.name,
      role: u.role === 'owner' ? 'مالك' : u.role === 'manager' ? 'مدير' : 'موظف',
      handled,
      totalActions,
      lastLoginAt: u.lastLoginAt,
    };
  });

  const handleExportExcel = () => {
    const headers = [
      'رقم الطلب',
      'التاريخ',
      'اسم العميل',
      'الهاتف',
      'المنطقة',
      'الحالة',
      'رسوم التوصيل',
      'الخصم المراجع',
      'الإجمالي المراجع',
      'الكوبون',
      'موافقة العميل',
    ];
    const rows = filteredOrders.map((o) => [
      o.orderNumber,
      new Date(o.createdAt).toLocaleString('ar-EG'),
      o.customerName,
      o.customerPhone,
      o.zoneName,
      o.status,
      String(o.deliveryFee),
      String(o.reviewedDiscount),
      o.reviewedTotal !== undefined ? String(o.reviewedTotal) : 'قيد المراجعة',
      o.couponCode ?? '',
      o.customerApprovedTotal ? 'نعم' : 'بانتظار الموافقة',
    ]);
    exportCsvForExcel(
      `taba-orders-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`,
      headers,
      rows
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">التقارير الفعلية وتصدير Excel</h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            جميع الإحصائيات مستخرجة مباشرة من الطلبات والمنتجات وأداء الموظفين المسجل في النظام.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1 text-xs font-semibold">
            {[
              { id: 'all' as const, label: 'الإجمالي' },
              { id: 'daily' as const, label: 'تقرير يومي' },
              { id: 'monthly' as const, label: 'تقرير شهري' },
            ].map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-3 py-1.5 rounded-md cursor-pointer ${
                  period === p.id ? 'bg-[#1D4ED8] text-white' : 'text-slate-600'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={handleExportExcel}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs sm:text-sm font-bold cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>تصدير Excel (CSV)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">إجمالي الطلبات ({period === 'daily' ? 'اليوم' : period === 'monthly' ? 'هذا الشهر' : 'الكل'})</div>
          <div className="mt-1 text-2xl font-bold text-slate-900 tabular-nums">{filteredOrders.length}</div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">الطلبات المكتملة</div>
          <div className="mt-1 text-2xl font-bold text-emerald-700 tabular-nums">
            {completed.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <div className="text-xs text-slate-500">الطلبات الملغاة</div>
          <div className="mt-1 text-2xl font-bold text-[#DC2626] tabular-nums">
            {cancelled.length}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">المناطق الأكثر طلبًا</h3>
          {topZones.length === 0 ? (
            <p className="text-xs text-slate-500">لا توجد بيانات مناطق في هذه الفترة.</p>
          ) : (
            <div className="divide-y divide-slate-100">
              {topZones.map(([zoneName, count]) => (
                <div key={zoneName} className="py-2.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-medium text-slate-800">{zoneName}</span>
                  <span className="font-bold tabular-nums text-slate-900">{count} طلب</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
          <h3 className="text-sm font-bold text-slate-900">المنتجات الأكثر طلبًا</h3>
          <div className="divide-y divide-slate-100">
            {topProducts.map((p) => (
              <div key={p.id} className="py-2.5 flex items-center justify-between text-xs sm:text-sm gap-3">
                <span className="font-medium text-slate-800 truncate">{p.name}</span>
                <span className="font-bold tabular-nums text-slate-900 shrink-0">
                  {p.requestCount} مرة
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Staff Performance Report Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-4 h-4 text-[#1D4ED8]" />
          <span>تقرير أداء الموظفين والمديرين</span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm text-right">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
              <tr>
                <th className="p-2.5 font-semibold">الاسم</th>
                <th className="p-2.5 font-semibold">الدور</th>
                <th className="p-2.5 font-semibold">الطلبات المعالجة</th>
                <th className="p-2.5 font-semibold">إجمالي الحركات المسجلة</th>
                <th className="p-2.5 font-semibold">آخر دخول</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffStats.map((st) => (
                <tr key={st.id}>
                  <td className="p-2.5 font-semibold text-slate-900">{st.name}</td>
                  <td className="p-2.5 text-slate-600">{st.role}</td>
                  <td className="p-2.5 tabular-nums font-bold text-[#1D4ED8]">{st.handled}</td>
                  <td className="p-2.5 tabular-nums text-slate-800">{st.totalActions}</td>
                  <td className="p-2.5 text-slate-500 tabular-nums">
                    {st.lastLoginAt
                      ? new Date(st.lastLoginAt).toLocaleString('ar-EG')
                      : 'لم يسجل دخول بعد'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
