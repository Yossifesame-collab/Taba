import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Bell,
  CheckCheck,
  ClipboardList,
  Database,
  Home,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  RefreshCw,
  RotateCcw,
  Shield,
  Star,
  Tag,
  Wrench,
} from 'lucide-react';
import { useTaba } from '../../context/TabaContext';
import { AdminDeliverySettings } from './AdminDeliverySettings';
import { AdminHomepage } from './AdminHomepage';
import { AdminLogin } from './AdminLogin';
import { AdminMaintenanceBackup } from './AdminMaintenanceBackup';
import { AdminNotifications } from './AdminNotifications';
import { AdminOffersCoupons } from './AdminOffersCoupons';
import { AdminOrders } from './AdminOrders';
import { AdminOverview } from './AdminOverview';
import { AdminProducts } from './AdminProducts';
import { AdminReturns } from './AdminReturns';
import { AdminReports, AdminReviews } from './AdminReviewsReports';
import { AdminStaffAudit } from './AdminStaffAudit';

export const AdminDashboard: React.FC = () => {
  const {
    currentStaff,
    settings,
    notifications,
    readNotificationIds,
    unreadNotificationsCount,
    returnRequests,
    markNotificationRead,
    markAllNotificationsRead,
    logoutStaff,
    setCurrentView,
    resetDemoWorkspace,
  } = useTaba();
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [notifPopoverOpen, setNotifPopoverOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!notifPopoverOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setNotifPopoverOpen(false);
      }
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNotifPopoverOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleEsc);
    };
  }, [notifPopoverOpen]);

  const openReturnsCount = useMemo(
    () =>
      returnRequests.filter(
        (r) =>
          r.status === 'جديد' ||
          r.status === 'قيد المراجعة' ||
          r.status === 'بانتظار استلام المنتج'
      ).length,
    [returnRequests]
  );

  const navItems = useMemo(() => {
    if (!currentStaff) return [];
    const p = currentStaff.permissions;
    const isOwner = currentStaff.role === 'owner';
    return [
      { id: 'overview', label: 'الرئيسية', icon: LayoutDashboard, allowed: true, badge: 0 },
      {
        id: 'notifications',
        label: 'مركز الإشعارات',
        icon: Bell,
        allowed: true,
        badge: unreadNotificationsCount,
      },
      { id: 'orders', label: 'إدارة الطلبات', icon: ClipboardList, allowed: isOwner || p.manageOrders, badge: 0 },
      {
        id: 'returns',
        label: 'المرتجعات والاستبدال',
        icon: RefreshCw,
        allowed: isOwner || p.manageOrders || p.manageDelivery,
        badge: openReturnsCount,
      },
      { id: 'products', label: 'المنتجات والأقسام', icon: Package, allowed: isOwner || p.manageProducts, badge: 0 },
      { id: 'offers', label: 'العروض والكوبونات', icon: Tag, allowed: isOwner || p.manageOffers, badge: 0 },
      { id: 'homepage', label: 'الشكل والتحكم الكامل', icon: Home, allowed: isOwner || p.manageHomepage, badge: 0 },
      {
        id: 'staff',
        label: 'الموظفون والسجل',
        icon: Shield,
        allowed: isOwner || p.manageStaff || p.viewAuditLog,
        badge: 0,
      },
      { id: 'delivery', label: 'التوصيل والشكاوى', icon: MapPin, allowed: isOwner || p.manageDelivery, badge: 0 },
      {
        id: 'backup',
        label: 'الصيانة والنسخ الاحتياطي',
        icon: Database,
        allowed: isOwner || p.manageDelivery || p.manageHomepage,
        badge: 0,
      },
      { id: 'reviews', label: 'التقييمات', icon: Star, allowed: isOwner || p.manageReviews, badge: 0 },
      { id: 'reports', label: 'التقارير وExcel', icon: BarChart3, allowed: isOwner || p.viewReports, badge: 0 },
    ].filter((item) => item.allowed);
  }, [currentStaff, unreadNotificationsCount, openReturnsCount]);

  if (!currentStaff || currentStaff.mustChangePassword) {
    return <AdminLogin />;
  }

  const currentTabValid = navItems.some((item) => item.id === activeSection);
  const resolvedSection = currentTabValid ? activeSection : 'overview';

  const latestPopoverItems = [...notifications]
    .sort(
      (a, b) =>
        Number(readNotificationIds.includes(a.id)) - Number(readNotificationIds.includes(b.id))
    )
    .slice(0, 5);

  return (
    <div className="min-h-screen bg-[#F1F5F9] flex flex-col">
      {/* Admin Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 no-print">
        <div className="px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <img
              src={settings.brandLogoUrl || '/assets/aistudio/IMG_0035_58f5bab1.jpeg'}
              alt="شعار معرض طابا"
              className="h-9 w-auto object-contain shrink-0"
            />
            <div className="border-r border-slate-200 pr-3 min-w-0">
              <div className="text-sm font-bold text-slate-900 truncate">لوحة إدارة معرض طابا</div>
              <div className="text-[11px] text-slate-500 truncate">
                {currentStaff.name} ·{' '}
                {currentStaff.role === 'owner'
                  ? 'صلاحية المالك الكاملة'
                  : currentStaff.role === 'manager'
                  ? 'حساب مدير'
                  : 'حساب موظف'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Active Maintenance or Paused indicator */}
            {settings.isMaintenanceMode ? (
              <button
                type="button"
                onClick={() => setActiveSection('backup')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-[#DC2626] text-xs font-bold cursor-pointer hover:bg-red-100"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>وضع الصيانة مُفعّل</span>
              </button>
            ) : !settings.isAcceptingOrders ? (
              <button
                type="button"
                onClick={() => setActiveSection('backup')}
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold cursor-pointer hover:bg-amber-100"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>الطلبات متوقفة مؤقتًا</span>
              </button>
            ) : null}

            {/* Notification Bell + Popover */}
            <div className="relative" ref={popoverRef}>
              <button
                type="button"
                onClick={() => setNotifPopoverOpen((v) => !v)}
                aria-label="مركز الإشعارات"
                className="relative inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-[#DC2626] text-white text-[10px] font-bold flex items-center justify-center tabular-nums">
                    {unreadNotificationsCount > 99 ? '99+' : unreadNotificationsCount}
                  </span>
                )}
              </button>

              {notifPopoverOpen && (
                <div className="absolute left-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50">
                    <div className="text-xs font-bold text-slate-900">
                      التنبيهات حسب صلاحيتك ({unreadNotificationsCount} جديد)
                    </div>
                    {unreadNotificationsCount > 0 && (
                      <button
                        type="button"
                        onClick={markAllNotificationsRead}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-[#1D4ED8] hover:underline cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        <span>قراءة الكل</span>
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {latestPopoverItems.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500">
                        لا توجد إشعارات أو تنبيهات حالية.
                      </div>
                    ) : (
                      latestPopoverItems.map((n) => {
                        const isRead = readNotificationIds.includes(n.id);
                        return (
                          <button
                            key={n.id}
                            type="button"
                            onClick={() => {
                              markNotificationRead(n.id);
                              setNotifPopoverOpen(false);
                              setActiveSection(n.targetSection);
                            }}
                            className={`w-full text-right p-3.5 transition-colors cursor-pointer hover:bg-slate-50 ${
                              !isRead ? 'bg-blue-50/40' : ''
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={`text-xs font-bold ${
                                  n.severity === 'high'
                                    ? 'text-[#DC2626]'
                                    : n.severity === 'medium'
                                    ? 'text-amber-800'
                                    : 'text-[#1D4ED8]'
                                }`}
                              >
                                {n.title}
                              </span>
                              {!isRead && (
                                <span className="w-2 h-2 rounded-full bg-[#DC2626] shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                            <div className="text-[10px] text-slate-400 mt-1 tabular-nums">
                              {new Date(n.createdAt).toLocaleString('ar-EG')}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setNotifPopoverOpen(false);
                      setActiveSection('notifications');
                    }}
                    className="w-full py-2.5 px-4 bg-slate-50 hover:bg-slate-100 border-t border-slate-100 text-xs font-bold text-[#1D4ED8] text-center cursor-pointer"
                  >
                    عرض مركز الإشعارات الكامل ({notifications.length})
                  </button>
                </div>
              )}
            </div>

            {currentStaff.role === 'owner' && (
              <button
                type="button"
                onClick={resetDemoWorkspace}
                title="إضافة الأقسام والمنتجات الافتراضية المفقودة فقط دون مسح الطلبات"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>تهيئة الكتالوج الافتراضي</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setCurrentView('store')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-slate-700 hover:border-[#1D4ED8] hover:text-[#1D4ED8] cursor-pointer whitespace-nowrap"
            >
              <ArrowRight className="w-3.5 h-3.5" />
              <span>واجهة العميل</span>
            </button>
            <button
              type="button"
              onClick={logoutStaff}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace: Sidebar + Content */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="lg:w-64 bg-white border-b lg:border-b-0 lg:border-l border-slate-200 p-3 sm:p-4 shrink-0 no-print">
          <nav className="flex lg:flex-col gap-1.5 overflow-x-auto lg:overflow-visible">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = resolvedSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`inline-flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-[#1D4ED8] text-white'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span className="inline-flex items-center gap-2.5">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </span>
                  {item.badge > 0 && (
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold tabular-nums ${
                        isActive ? 'bg-white text-[#1D4ED8]' : 'bg-[#DC2626] text-white'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Main Panel */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-6xl w-full mx-auto">
          {resolvedSection === 'overview' && (
            <AdminOverview onNavigateSection={setActiveSection} />
          )}
          {resolvedSection === 'notifications' && (
            <AdminNotifications onNavigateSection={setActiveSection} />
          )}
          {resolvedSection === 'orders' && <AdminOrders />}
          {resolvedSection === 'returns' && <AdminReturns />}
          {resolvedSection === 'products' && <AdminProducts />}
          {resolvedSection === 'offers' && <AdminOffersCoupons />}
          {resolvedSection === 'homepage' && <AdminHomepage />}
          {resolvedSection === 'staff' && <AdminStaffAudit />}
          {resolvedSection === 'delivery' && <AdminDeliverySettings />}
          {resolvedSection === 'backup' && <AdminMaintenanceBackup />}
          {resolvedSection === 'reviews' && <AdminReviews />}
          {resolvedSection === 'reports' && <AdminReports />}
        </main>
      </div>
    </div>
  );
};

