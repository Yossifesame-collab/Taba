import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowUpLeft,
  Bell,
  Check,
  CheckCheck,
  Clock,
  MessageSquareWarning,
  Package,
  RefreshCw,
  ShoppingBag,
  Tag,
  X,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { NotificationCategory } from '../../types/taba';

interface AdminNotificationsProps {
  onNavigateSection: (section: string) => void;
}

const CATEGORY_LABELS: Array<{ id: 'all' | NotificationCategory; label: string }> = [
  { id: 'all', label: 'الكل' },
  { id: 'new_order', label: 'طلبات جديدة' },
  { id: 'delayed_order', label: 'طلبات متأخرة' },
  { id: 'new_return', label: 'مرتجعات واستبدال' },
  { id: 'new_complaint', label: 'شكاوى ومقترحات' },
  { id: 'low_stock', label: 'نواقص المخزون' },
  { id: 'expired_offer', label: 'عروض منتهية' },
];

export const AdminNotifications: React.FC<AdminNotificationsProps> = ({ onNavigateSection }) => {
  const {
    notifications,
    unreadNotificationsCount,
    readNotificationIds,
    currentStaff,
    settings,
    updateSettings,
    markNotificationRead,
    markAllNotificationsRead,
    dismissNotification,
  } = useTaba();

  const [categoryFilter, setCategoryFilter] = useState<'all' | NotificationCategory>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);

  const readSet = useMemo(() => new Set(readNotificationIds), [readNotificationIds]);

  const displayed = useMemo(() => {
    return notifications.filter((n) => {
      if (categoryFilter !== 'all' && n.category !== categoryFilter) return false;
      if (unreadOnly && readSet.has(n.id)) return false;
      return true;
    });
  }, [notifications, categoryFilter, unreadOnly, readSet]);

  const getCategoryIcon = (cat: NotificationCategory) => {
    switch (cat) {
      case 'new_order':
        return <ShoppingBag className="w-4 h-4 text-[#1D4ED8]" />;
      case 'delayed_order':
        return <Clock className="w-4 h-4 text-[#DC2626]" />;
      case 'new_complaint':
        return <MessageSquareWarning className="w-4 h-4 text-amber-600" />;
      case 'new_return':
        return <RefreshCw className="w-4 h-4 text-purple-700" />;
      case 'low_stock':
        return <Package className="w-4 h-4 text-[#DC2626]" />;
      case 'expired_offer':
        return <Tag className="w-4 h-4 text-amber-700" />;
      default:
        return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#1D4ED8]" />
            <span>مركز الإشعارات والتنبيهات ({notifications.length})</span>
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            تنبيهات ذكية مفلترة تلقائيًا حسب صلاحيات حسابك ({currentStaff?.name}) لمتابعة الطلبات والشكاوى والمخزون والعروض.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={markAllNotificationsRead}
            disabled={unreadNotificationsCount === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] disabled:bg-slate-200 disabled:text-slate-500 text-white text-xs font-bold cursor-pointer disabled:cursor-not-allowed"
          >
            <CheckCheck className="w-4 h-4" />
            <span>تحديد الكل كمقروء ({unreadNotificationsCount})</span>
          </button>
        </div>
      </div>

      {/* SLA Setting for Delayed Orders (Owner & Manager) */}
      {(currentStaff?.role === 'owner' || currentStaff?.permissions.manageOrders) && (
        <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-slate-900">تنبيه الطلبات المتأخرة عن الموعد</div>
              <div className="text-xs text-slate-500">
                يصدر النظام تنبيهًا تلقائيًا لأي طلب لم يُسلم أو يُلغَ بعد مرور المدة المحددة.
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <label htmlFor="delay-threshold" className="font-bold text-slate-700">
              حد التأخير:
            </label>
            <select
              id="delay-threshold"
              value={settings.delayedOrderThresholdMinutes}
              onChange={(e) =>
                updateSettings({ delayedOrderThresholdMinutes: Number(e.target.value) || 60 })
              }
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 font-bold"
            >
              <option value={30}>30 دقيقة</option>
              <option value={60}>ساعة واحدة (60 دقيقة)</option>
              <option value={120}>ساعتان</option>
              <option value={240}>4 ساعات</option>
            </select>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORY_LABELS.map((cat) => {
            const count =
              cat.id === 'all'
                ? notifications.length
                : notifications.filter((n) => n.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-[#1D4ED8] text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat.label} ({count})
              </button>
            );
          })}
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
          />
          <span>غير المقروءة فقط</span>
        </label>
      </div>

      {/* Notifications List */}
      <div className="rounded-xl border border-slate-200 bg-white divide-y divide-slate-100 overflow-hidden">
        {displayed.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <Bell className="w-8 h-8 text-slate-300 mx-auto" />
            <div className="text-sm font-bold text-slate-800">لا توجد تنبيهات مطابقة حاليًا</div>
            <p className="text-xs text-slate-500">
              جميع المهام والتنبيهات المتاحة لصلاحياتك تم التعامل معها.
            </p>
          </div>
        ) : (
          displayed.map((n) => {
            const isRead = readSet.has(n.id);
            return (
              <div
                key={n.id}
                className={`p-4 flex flex-wrap items-start justify-between gap-4 transition-colors ${
                  isRead ? 'bg-white' : 'bg-blue-50/40'
                }`}
              >
                <div className="flex items-start gap-3 flex-1 min-w-[240px]">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                      n.severity === 'high'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-amber-50 border border-amber-200'
                    }`}
                  >
                    {getCategoryIcon(n.category)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      {!isRead && (
                        <span className="w-2 h-2 rounded-full bg-[#1D4ED8] shrink-0" />
                      )}
                      <span className="text-sm font-bold text-slate-900">{n.title}</span>
                      <span className="text-[11px] text-slate-400 tabular-nums">
                        {new Date(n.createdAt).toLocaleString('ar-EG')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{n.message}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      markNotificationRead(n.id);
                      onNavigateSection(n.targetSection);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1D4ED8] hover:bg-[#1E40AF] text-white text-xs font-bold cursor-pointer"
                  >
                    <span>فتح</span>
                    <ArrowUpLeft className="w-3.5 h-3.5" />
                  </button>
                  {!isRead && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      title="تحديد كمقروء"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => dismissNotification(n.id)}
                    title="إخفاء التنبيه"
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-[#DC2626] cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
