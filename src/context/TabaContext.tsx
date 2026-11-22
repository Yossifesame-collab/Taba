import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  INITIAL_BANNERS,
  INITIAL_CATEGORIES,
  INITIAL_COUPONS,
  INITIAL_FAQS,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_SETTINGS,
  INITIAL_ZONES,
} from '../data/tabaSeed';
import {
  auth,
  BOOTSTRAPPED_OWNER_EMAIL,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
  testConnection,
} from '../firebase';
import {
  AddressPlaceType,
  AdminNotification,
  AuditLogEntry,
  BackupSnapshot,
  BackupVerificationReport,
  Banner,
  Category,
  ComplaintSuggestion,
  Coupon,
  DeliveryZone,
  FaqItem,
  Order,
  OrderItem,
  OrderStatus,
  Product,
  ProductReview,
  ProductVisualKind,
  ReturnedProductEntry,
  ReturnRequest,
  ReturnRequestStatus,
  StaffPermissions,
  StaffRole,
  StaffUser,
  StoreSettings,
} from '../types/taba';

const CART_STORAGE_KEY = 'taba_cart_v1';
const FAV_STORAGE_KEY = 'taba_favorites_v1';
const MY_ORDERS_STORAGE_KEY = 'taba_my_orders_v1';

export type BackupRestoreScope = 'all' | 'products' | 'orders' | 'settings';

export interface CartEntry {
  productId: string;
  quantity: number;
}

interface PersistedState {
  categories: Category[];
  products: Product[];
  banners: Banner[];
  zones: DeliveryZone[];
  coupons: Coupon[];
  orders: Order[];
  reviews: ProductReview[];
  complaints: ComplaintSuggestion[];
  returnRequests: ReturnRequest[];
  faqs: FaqItem[];
  settings: StoreSettings;
  auditLog: AuditLogEntry[];
  staffUsers: StaffUser[];
  cart: CartEntry[];
  favorites: string[];
  readNotificationIds: string[];
  dismissedNotificationIds: string[];
}

interface TabaContextValue extends PersistedState {
  currentView: 'store' | 'admin';
  setCurrentView: (view: 'store' | 'admin') => void;
  currentStaff: StaffUser | null;
  authReady: boolean;
  authError: string | null;
  isCloudLoading: boolean;
  notifications: AdminNotification[];
  unreadNotificationsCount: number;
  backupSnapshots: BackupSnapshot[];
  loginWithGoogle: () => Promise<{ ok: boolean; error?: string }>;
  loginStaff: (
    username: string,
    password: string
  ) => Promise<{ ok: boolean; error?: string; mustChangePassword?: boolean }>;
  loginDemoRole: (role: StaffRole) => Promise<void>;
  logoutStaff: () => void;
  changeOwnPassword: (newPassword: string) => Promise<void>;
  // Cart & Favorites
  addToCart: (productId: string, qty?: number) => void;
  updateCartQty: (productId: string, qty: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  toggleFavorite: (productId: string) => void;
  clearFavorites: () => void;
  reorderIntoCart: (order: Order) => void;
  // Customer Actions
  validateCouponForCart: (
    code: string,
    totalItemsCount: number
  ) => { valid: boolean; coupon?: Coupon; message: string };
  validateCouponAsync: (
    code: string,
    totalItemsCount: number
  ) => Promise<{ valid: boolean; coupon?: Coupon; message: string }>;
  submitOrder: (payload: {
    customerName: string;
    customerPhone: string;
    zoneId: string;
    addressType?: AddressPlaceType;
    streetName?: string;
    buildingNumber?: string;
    floorNumber?: string;
    apartmentNumber?: string;
    locationUrl?: string;
    detailedAddress: string;
    landmark: string;
    notes: string;
    couponCode?: string;
    idempotencyKey: string;
  }) => Promise<{ ok: boolean; order?: Order; error?: string }>;
  fetchOrderTracking: (orderNumber: string, phone: string) => Promise<Order | null>;
  fetchOrdersByPhone: (phone: string) => Promise<Order[]>;
  trackOrderPrivate: (orderNumber: string, phone: string) => Order | null;
  getOrdersByPhone: (phone: string) => Order[];
  customerEditOrder: (
    orderId: string,
    phone: string,
    updates: {
      detailedAddress: string;
      landmark: string;
      notes: string;
      items: Array<{ productId: string; quantity: number }>;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  customerCancelOrder: (
    orderId: string,
    phone: string,
    reason: string
  ) => Promise<{ ok: boolean; error?: string }>;
  customerRespondSubstitute: (
    orderId: string,
    productId: string,
    decision: 'accepted' | 'rejected'
  ) => void;
  submitProductReview: (payload: {
    productId: string;
    customerName: string;
    rating: number;
    comment: string;
  }) => void;
  submitComplaint: (payload: {
    type: 'شكوى' | 'مقترح';
    customerName: string;
    customerPhone: string;
    orderNumber?: string;
    message: string;
  }) => void;
  submitReturnRequest: (payload: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    returnedItems?: ReturnedProductEntry[];
    requestType: 'استبدال' | 'استرجاع';
    reason: string;
  }) => ReturnRequest;
  fetchReturnTracking: (codeOrOrder: string, phone: string) => Promise<ReturnRequest[]>;
  trackReturnRequests: (codeOrOrder: string, phone: string) => ReturnRequest[];
  // Admin Actions
  updateOrderByStaff: (
    orderId: string,
    updates: {
      newStatus: OrderStatus;
      notes: string;
      reviewedDiscount?: number;
      reviewedTotal?: number;
      priceReviewedByStaff?: boolean;
      customerApprovedTotal?: boolean;
      cancellationReason?: string;
    }
  ) => void;
  updateOrderItemsAndFeeByStaff: (
    orderId: string,
    updates: {
      items: OrderItem[];
      deliveryFee: number;
      notes?: string;
    }
  ) => void;
  proposeSubstituteItem: (
    orderId: string,
    targetProductId: string,
    substituteProductId: string,
    note: string
  ) => void;
  saveProduct: (product: Omit<Product, 'id' | 'createdAt' | 'requestCount'> & { id?: string }) => void;
  deleteProduct: (productId: string) => void;
  addCategory: (name: string, iconKey?: ProductVisualKind) => void;
  renameCategory: (categoryId: string, newName: string) => void;
  updateCategoryDetails: (
    categoryId: string,
    updates: { name?: string; iconKey?: ProductVisualKind }
  ) => void;
  moveCategory: (categoryId: string, direction: 'up' | 'down') => void;
  deleteCategory: (categoryId: string) => void;
  saveBanner: (banner: Banner) => void;
  addBanner: (banner: Omit<Banner, 'id' | 'sortOrder'>) => void;
  deleteBanner: (bannerId: string) => void;
  moveBanner: (bannerId: string, direction: 'up' | 'down') => void;
  renewBannerOfferThreeDays: (bannerId: string) => void;
  renewProductOfferThreeDays: (productId: string) => void;
  applyBulkOffer: (payload: {
    productIds: string[];
    startsAt: string;
    expiresAt: string;
    active: boolean;
  }) => void;
  saveCoupon: (coupon: Coupon) => void;
  deleteCoupon: (couponId: string) => void;
  saveZone: (zone: DeliveryZone) => void;
  deleteZone: (zoneId: string) => void;
  updateSettings: (partial: Partial<StoreSettings>) => void;
  saveFaq: (faq: FaqItem) => void;
  deleteFaq: (faqId: string) => void;
  moderateReview: (reviewId: string, decision: 'approved' | 'rejected') => void;
  updateComplaintStatus: (
    complaintId: string,
    status: ComplaintSuggestion['status'],
    adminReply?: string
  ) => void;
  updateReturnRequestStatus: (
    requestId: string,
    status: ReturnRequestStatus,
    adminNote?: string
  ) => void;
  updateReturnRequestDetails: (
    requestId: string,
    updates: {
      status?: ReturnRequestStatus;
      assignedStaffId?: string;
      assignedStaffName?: string;
      adminNote?: string;
      returnedItems?: ReturnedProductEntry[];
    }
  ) => void;
  createStaffReturnRequest: (payload: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    requestType: 'استبدال' | 'استرجاع';
    reason: string;
    returnedItems: ReturnedProductEntry[];
    assignedStaffId?: string;
    adminNote?: string;
  }) => ReturnRequest;
  restockReturnedItem: (requestId: string, itemIndex: number) => { ok: boolean; message: string };
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (notificationId: string) => void;
  createStaffAccount: (payload: {
    name: string;
    username: string;
    email?: string;
    role: StaffRole;
    password?: string;
    mustChangePassword?: boolean;
    permissions: StaffPermissions;
  }) => Promise<{ ok: boolean; error?: string }>;
  updateStaffAccount: (
    staffId: string,
    updates: {
      name?: string;
      username?: string;
      role?: StaffRole;
      isActive?: boolean;
      permissions?: StaffPermissions;
      password?: string;
      mustChangePassword?: boolean;
    }
  ) => Promise<{ ok: boolean; error?: string }>;
  deleteStaffAccount: (staffId: string) => { ok: boolean; error?: string };
  updateOwnProfile: (payload: {
    name: string;
    username: string;
    newPassword?: string;
  }) => Promise<{ ok: boolean; error?: string }>;
  exportJsonBackup: () => string;
  verifyBackupJson: (jsonString: string) => BackupVerificationReport;
  importJsonBackup: (
    jsonString: string,
    scope?: BackupRestoreScope
  ) => { ok: boolean; error?: string };
  createBackupSnapshot: (label?: string, kind?: 'auto' | 'manual') => BackupSnapshot;
  restoreFromSnapshot: (
    snapshotId: string,
    scope?: BackupRestoreScope
  ) => { ok: boolean; error?: string };
  deleteBackupSnapshot: (snapshotId: string) => void;
  resetDemoWorkspace: () => void;
}

const TabaContext = createContext<TabaContextValue | null>(null);

const OWNER_PERMS: StaffPermissions = {
  manageProducts: true,
  manageOrders: true,
  cancelOrders: true,
  manageOffers: true,
  manageHomepage: true,
  manageDelivery: true,
  manageReviews: true,
  viewReports: true,
  manageStaff: true,
  viewAuditLog: true,
};

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

function mergeSettingsWithDefaults(raw?: Partial<StoreSettings> | null): StoreSettings {
  if (!raw) return INITIAL_SETTINGS;
  return {
    ...INITIAL_SETTINGS,
    ...raw,
    brandLogoUrl: raw.brandLogoUrl || INITIAL_SETTINGS.brandLogoUrl,
    socialLinks: {
      ...INITIAL_SETTINGS.socialLinks,
      ...(raw.socialLinks ?? {}),
    },
    theme: {
      ...INITIAL_SETTINGS.theme,
      ...(raw.theme ?? {}),
    },
    copy: {
      ...INITIAL_SETTINGS.copy,
      ...(raw.copy ?? {}),
    },
    homeSectionOrder:
      raw.homeSectionOrder && raw.homeSectionOrder.length === 3
        ? raw.homeSectionOrder
        : INITIAL_SETTINGS.homeSectionOrder,
  };
}

function loadLocalArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore read error
  }
  return [];
}

function sanitizeImageForFirestore(url?: string): string | undefined {
  if (!url) return undefined;
  return url.length <= 590000 ? url : undefined;
}

function buildTrackingPayload(order: Order) {
  return stripUndefined({
    orderId: order.id,
    orderNumber: order.orderNumber,
    customerName: order.customerName,
    zoneName: order.zoneName,
    addressType: order.addressType,
    detailedAddress: order.detailedAddress,
    landmark: order.landmark || '',
    locationUrl: order.locationUrl,
    notes: order.notes || '',
    couponCode: order.couponCode,
    deliveryFee: order.deliveryFee,
    reviewedDiscount: order.reviewedDiscount,
    reviewedTotal: order.reviewedTotal,
    priceReviewedByStaff: order.priceReviewedByStaff,
    customerApprovedTotal: order.customerApprovedTotal,
    status: order.status,
    cancellationReason: order.cancellationReason,
    items: order.items,
    history: order.history,
    createdAt: order.createdAt,
    updatedAt: serverTimestamp(),
  });
}

function buildReturnTrackingPayload(req: ReturnRequest) {
  return stripUndefined({
    returnId: req.id,
    returnCode: req.returnCode,
    orderNumber: req.orderNumber,
    requestType: req.requestType,
    reason: req.reason,
    status: req.status,
    assignedStaffName: req.assignedStaffName,
    adminNote: req.adminNote,
    returnedItems: req.returnedItems,
    createdAt: req.createdAt,
    updatedAt: req.updatedAt,
  });
}

export const TabaProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [banners, setBanners] = useState<Banner[]>(INITIAL_BANNERS);
  const [zones, setZones] = useState<DeliveryZone[]>(INITIAL_ZONES);
  const [coupons, setCoupons] = useState<Coupon[]>(INITIAL_COUPONS);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reviews, setReviews] = useState<ProductReview[]>(INITIAL_REVIEWS);
  const [complaints, setComplaints] = useState<ComplaintSuggestion[]>([]);
  const [returnRequests, setReturnRequests] = useState<ReturnRequest[]>([]);
  const [faqs, setFaqs] = useState<FaqItem[]>(INITIAL_FAQS);
  const [settings, setSettings] = useState<StoreSettings>(INITIAL_SETTINGS);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [staffUsers, setStaffUsers] = useState<StaffUser[]>([]);
  const [backupSnapshots, setBackupSnapshots] = useState<BackupSnapshot[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);

  const [cart, setCart] = useState<CartEntry[]>(() => loadLocalArray<CartEntry>(CART_STORAGE_KEY));
  const [favorites, setFavorites] = useState<string[]>(() =>
    loadLocalArray<string>(FAV_STORAGE_KEY)
  );
  const [trackedOrdersCache, setTrackedOrdersCache] = useState<Order[]>([]);
  const [trackedReturnsCache, setTrackedReturnsCache] = useState<ReturnRequest[]>([]);
  const [checkedCouponsCache, setCheckedCouponsCache] = useState<Record<string, Coupon>>({});

  const [currentView, setCurrentViewState] = useState<'store' | 'admin'>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.hash === '#/admin' || window.location.pathname === '/admin') {
        return 'admin';
      }
    }
    return 'store';
  });

  const [currentStaff, setCurrentStaff] = useState<StaffUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCloudLoading, setIsCloudLoading] = useState(true);

  useEffect(() => {
    void testConnection();
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // Ignore storage error
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem(FAV_STORAGE_KEY, JSON.stringify(favorites));
    } catch {
      // Ignore storage error
    }
  }, [favorites]);

  useEffect(() => {
    const onHashChange = () => {
      setCurrentViewState(window.location.hash === '#/admin' ? 'admin' : 'store');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const setCurrentView = (view: 'store' | 'admin') => {
    setCurrentViewState(view);
    if (typeof window !== 'undefined') {
      window.location.hash = view === 'admin' ? '#/admin' : '#/';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const writeAuditLog = useCallback(
    async (
      actor: { name: string; role: string; email?: string },
      action: string,
      details: string,
      isSecurityEvent = false
    ) => {
      const id = `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      const entry = stripUndefined({
        id,
        actorName: actor.name,
        actorEmail: actor.email,
        actorRole: actor.role,
        action,
        details,
        timestamp: new Date().toISOString(),
        serverTimestamp: serverTimestamp(),
        isSecurityEvent,
      });
      try {
        await setDoc(doc(db, 'audit_log', id), entry);
      } catch (err) {
        console.error('Audit log write notice:', err);
      }
    },
    []
  );

  // Auto-seed catalog when Owner first enters empty Firestore database
  const ensureCatalogSeeded = useCallback(async (ownerActor: StaffUser) => {
    try {
      const catSnap = await getDocs(query(collection(db, 'categories'), limit(1)));
      const settingsSnap = await getDoc(doc(db, 'settings', 'store'));
      if (!catSnap.empty && settingsSnap.exists()) return;

      const batch = writeBatch(db);
      if (catSnap.empty) {
        for (const cat of INITIAL_CATEGORIES) {
          batch.set(doc(db, 'categories', cat.id), stripUndefined(cat));
        }
        for (const prod of INITIAL_PRODUCTS) {
          const cleanProd = stripUndefined({
            ...prod,
            imageUrl: sanitizeImageForFirestore(prod.imageUrl),
            originalImageUrl: undefined,
          });
          batch.set(doc(db, 'products', prod.id), cleanProd);
        }
        for (const ban of INITIAL_BANNERS) {
          batch.set(
            doc(db, 'banners', ban.id),
            stripUndefined({ ...ban, imageUrl: sanitizeImageForFirestore(ban.imageUrl) })
          );
        }
        for (const zone of INITIAL_ZONES) {
          batch.set(doc(db, 'zones', zone.id), stripUndefined(zone));
        }
        for (const coup of INITIAL_COUPONS) {
          const codeKey = coup.code.toUpperCase();
          batch.set(doc(db, 'coupons', codeKey), stripUndefined({ ...coup, id: codeKey }));
        }
        for (const faq of INITIAL_FAQS) {
          batch.set(doc(db, 'faqs', faq.id), stripUndefined(faq));
        }
      }
      if (!settingsSnap.exists()) {
        batch.set(
          doc(db, 'settings', 'store'),
          stripUndefined({
            ...INITIAL_SETTINGS,
            isTrialMode: false,
            allowTrialQuickLogin: false,
          })
        );
      }
      await batch.commit();
      await writeAuditLog(
        ownerActor,
        'تهيئة قاعدة البيانات السحابية',
        'تم رفع الأقسام والمنتجات والبانرات والمناطق والإعدادات الافتراضية إلى Firestore بنجاح.',
        true
      );
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'initial-seed');
    }
  }, [writeAuditLog]);

  // Listen to Firebase Auth state and resolve staff profile
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (fbUser) => {
      if (!fbUser || !fbUser.email || !fbUser.emailVerified) {
        setCurrentStaff(null);
        setAuthReady(true);
        return;
      }

      const emailLower = fbUser.email.toLowerCase();
      try {
        const staffRef = doc(db, 'staff_users', emailLower);
        const snap = await getDoc(staffRef);
        const nowIso = new Date().toISOString();

        if (emailLower === BOOTSTRAPPED_OWNER_EMAIL) {
          const ownerDoc: StaffUser = snap.exists()
            ? {
                ...(snap.data() as StaffUser),
                email: emailLower,
                role: 'owner',
                isActive: true,
                mustChangePassword: false,
                permissions: OWNER_PERMS,
                lastLoginAt: nowIso,
              }
            : {
                id: emailLower,
                email: emailLower,
                name: fbUser.displayName || 'مالك معرض طابا',
                username: emailLower,
                role: 'owner',
                mustChangePassword: false,
                isActive: true,
                permissions: OWNER_PERMS,
                createdAt: nowIso,
                lastLoginAt: nowIso,
              };
          await setDoc(staffRef, stripUndefined({ ...ownerDoc, passwordHash: undefined }));
          setCurrentStaff(ownerDoc);
          setAuthError(null);
          setAuthReady(true);
          await ensureCatalogSeeded(ownerDoc);
          await writeAuditLog(ownerDoc, 'تسجيل دخول المالك', `دخول موثق بحساب Google (${emailLower})`, true);
          return;
        }

        if (!snap.exists()) {
          setAuthError(
            `الحساب (${emailLower}) غير مسجل ضمن موظفي معرض طابا. يجب على المالك إضافة بريدك من لوحة الإدارة أولاً.`
          );
          setCurrentStaff(null);
          setAuthReady(true);
          await signOut(auth);
          return;
        }

        const staffData = snap.data() as StaffUser;
        if (!staffData.isActive) {
          setAuthError('تم إيقاف هذا الحساب مؤقتًا من قِبل مالك المعرض.');
          setCurrentStaff(null);
          setAuthReady(true);
          await signOut(auth);
          return;
        }

        await updateDoc(staffRef, {
          lastLoginAt: nowIso,
          name: staffData.name || fbUser.displayName || emailLower,
        });
        const resolvedStaff: StaffUser = {
          ...staffData,
          email: emailLower,
          mustChangePassword: false,
          lastLoginAt: nowIso,
        };
        setCurrentStaff(resolvedStaff);
        setAuthError(null);
        setAuthReady(true);
        await writeAuditLog(
          resolvedStaff,
          'تسجيل دخول موظف',
          `دخول موثق بحساب Google (${emailLower})`,
          true
        );
      } catch (error) {
        console.error('Auth staff verification error:', error);
        setAuthError('تعذر التحقق من صلاحية الحساب في قاعدة البيانات.');
        setCurrentStaff(null);
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, [ensureCatalogSeeded, writeAuditLog]);

  // Public Storefront Real-time Subscriptions
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      onSnapshot(
        collection(db, 'categories'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => d.data() as Category)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            setCategories(list);
          }
          setIsCloudLoading(false);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'categories')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'products'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => d.data() as Product)
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            setProducts(list);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'products')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'banners'),
        (snap) => {
          if (!snap.empty) {
            const list = snap.docs
              .map((d) => d.data() as Banner)
              .sort((a, b) => a.sortOrder - b.sortOrder);
            setBanners(list);
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'banners')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'zones'),
        (snap) => {
          if (!snap.empty) {
            setZones(snap.docs.map((d) => d.data() as DeliveryZone));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'zones')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'faqs'),
        (snap) => {
          if (!snap.empty) {
            setFaqs(snap.docs.map((d) => d.data() as FaqItem));
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'faqs')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'store'),
        (snap) => {
          if (snap.exists()) {
            setSettings(mergeSettingsWithDefaults(snap.data() as Partial<StoreSettings>));
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'settings/store')
      )
    );

    return () => {
      unsubs.forEach((u) => u());
    };
  }, []);

  // Reviews listener (approved-only for guests; all for authenticated staff)
  useEffect(() => {
    if (!authReady) return;
    const revQuery = currentStaff
      ? collection(db, 'reviews')
      : query(collection(db, 'reviews'), where('status', '==', 'approved'));

    const unsub = onSnapshot(
      revQuery,
      (snap) => {
        const list = snap.docs
          .map((d) => d.data() as ProductReview)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setReviews(list);
      },
      (err) => handleFirestoreError(err, OperationType.LIST, 'reviews')
    );
    return () => unsub();
  }, [authReady, currentStaff]);

  // Authenticated Staff-Only Real-time Subscriptions
  useEffect(() => {
    if (!authReady || !currentStaff) {
      setOrders([]);
      setComplaints([]);
      setReturnRequests([]);
      setStaffUsers([]);
      setAuditLog([]);
      setBackupSnapshots([]);
      return;
    }

    const unsubs: Array<() => void> = [];
    const emailLower = (currentStaff.email || currentStaff.id).toLowerCase();
    const isOwner = currentStaff.role === 'owner';

    unsubs.push(
      onSnapshot(
        collection(db, 'orders'),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as Order)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setOrders(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'orders')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'complaints'),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as ComplaintSuggestion)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setComplaints(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'complaints')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'return_requests'),
        (snap) => {
          const list = snap.docs
            .map((d) => d.data() as ReturnRequest)
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          setReturnRequests(list);
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'return_requests')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'staff_users'),
        (snap) => {
          setStaffUsers(snap.docs.map((d) => d.data() as StaffUser));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'staff_users')
      )
    );

    unsubs.push(
      onSnapshot(
        collection(db, 'coupons'),
        (snap) => {
          setCoupons(snap.docs.map((d) => d.data() as Coupon));
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'coupons')
      )
    );

    unsubs.push(
      onSnapshot(
        doc(db, 'staff_notification_state', emailLower),
        (snap) => {
          if (snap.exists()) {
            const data = snap.data() as {
              readNotificationIds?: string[];
              dismissedNotificationIds?: string[];
            };
            setReadNotificationIds(data.readNotificationIds ?? []);
            setDismissedNotificationIds(data.dismissedNotificationIds ?? []);
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, `staff_notification_state/${emailLower}`)
      )
    );

    // Automatically apply customer pre-prep actions onto staff orders collection
    unsubs.push(
      onSnapshot(
        collection(db, 'order_customer_actions'),
        async (snap) => {
          for (const actionDoc of snap.docs) {
            const act = actionDoc.data() as {
              id: string;
              orderId: string;
              actionType: 'edit' | 'cancel' | 'substitute_response';
              payload: Record<string, unknown>;
            };
            try {
              const ordRef = doc(db, 'orders', act.orderId);
              const ordSnap = await getDoc(ordRef);
              if (ordSnap.exists()) {
                const ord = ordSnap.data() as Order;
                const trackingKey = `${ord.orderNumber.toUpperCase()}_${ord.customerPhone.replace(/\s+/g, '')}`;
                const trackingRef = doc(db, 'order_tracking', trackingKey);
                const trackingSnap = await getDoc(trackingRef);
                if (trackingSnap.exists()) {
                  const tData = trackingSnap.data() as Partial<Order>;
                  const batch = writeBatch(db);
                  batch.set(
                    ordRef,
                    stripUndefined({
                      ...ord,
                      status: tData.status ?? ord.status,
                      cancellationReason: tData.cancellationReason ?? ord.cancellationReason,
                      detailedAddress: tData.detailedAddress ?? ord.detailedAddress,
                      landmark: tData.landmark ?? ord.landmark,
                      notes: tData.notes ?? ord.notes,
                      items: tData.items ?? ord.items,
                      history: tData.history ?? ord.history,
                      priceReviewedByStaff:
                        act.actionType === 'edit' ? false : ord.priceReviewedByStaff,
                      customerApprovedTotal:
                        act.actionType === 'edit' ? false : ord.customerApprovedTotal,
                    })
                  );
                  batch.delete(actionDoc.ref);
                  await batch.commit();
                } else {
                  await deleteDoc(actionDoc.ref);
                }
              } else {
                await deleteDoc(actionDoc.ref);
              }
            } catch (err) {
              console.error('Error syncing customer order action:', err);
            }
          }
        },
        (err) => handleFirestoreError(err, OperationType.LIST, 'order_customer_actions')
      )
    );

    if (isOwner || currentStaff.permissions.viewAuditLog) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_log'), orderBy('timestamp', 'desc'), limit(200)),
          (snap) => {
            setAuditLog(snap.docs.map((d) => d.data() as AuditLogEntry));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_log')
        )
      );
    }

    if (isOwner || currentStaff.permissions.manageDelivery || currentStaff.permissions.manageHomepage) {
      unsubs.push(
        onSnapshot(
          query(collection(db, 'backup_snapshots'), orderBy('createdAt', 'desc'), limit(10)),
          (snap) => {
            setBackupSnapshots(snap.docs.map((d) => d.data() as BackupSnapshot));
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'backup_snapshots')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, currentStaff]);

  // Periodic automatic snapshot scheduler (runs only when authorized staff has backup rights)
  useEffect(() => {
    if (!currentStaff || !settings.autoBackupEnabled) return;
    const canBackup =
      currentStaff.role === 'owner' ||
      currentStaff.permissions.manageDelivery ||
      currentStaff.permissions.manageHomepage;
    if (!canBackup) return;

    const intervalMs = Math.max(1, settings.autoBackupIntervalHours || 6) * 60 * 60 * 1000;
    const lastTs = settings.lastAutoBackupAt ? new Date(settings.lastAutoBackupAt).getTime() : 0;

    if (!lastTs || Date.now() - lastTs >= intervalMs) {
      const nowIso = new Date().toISOString();
      const payloadJson = JSON.stringify(
        {
          categories,
          products,
          banners,
          zones,
          coupons,
          orders,
          reviews,
          complaints,
          returnRequests,
          faqs,
          settings,
          staffUsers,
        },
        null,
        2
      );
      if (payloadJson.length <= 840000) {
        const snapId = `snap-auto-${Date.now()}`;
        const snap: BackupSnapshot = {
          id: snapId,
          label: `نسخة دورية تلقائية (${new Date(nowIso).toLocaleString('ar-EG', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })})`,
          kind: 'auto',
          createdAt: nowIso,
          createdBy: 'النسخ السحابي التلقائي',
          stats: {
            products: products.length,
            categories: categories.length,
            orders: orders.length,
            returns: returnRequests.length,
            complaints: complaints.length,
            staff: staffUsers.length,
          },
          payloadJson,
        };
        void setDoc(doc(db, 'backup_snapshots', snapId), stripUndefined(snap)).catch(() => {});
        void setDoc(
          doc(db, 'settings', 'store'),
          stripUndefined({ ...settings, lastAutoBackupAt: nowIso })
        ).catch(() => {});
      }
    }
  }, [
    currentStaff,
    settings,
    categories,
    products,
    banners,
    zones,
    coupons,
    orders,
    reviews,
    complaints,
    returnRequests,
    faqs,
    staffUsers,
  ]);

  // ==================== Auth Handlers ====================

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      return { ok: true };
    } catch (err) {
      const msg =
        err instanceof Error && err.message.includes('popup-closed')
          ? 'تم إغلاق نافذة تسجيل الدخول قبل إتمام العملية.'
          : 'تعذر تسجيل الدخول بحساب Google، يرجى المحاولة مرة أخرى.';
      setAuthError(msg);
      return { ok: false, error: msg };
    }
  };

  const loginStaff = async (_username: string, _password: string) => {
    return loginWithGoogle();
  };

  const loginDemoRole = async (_role: StaffRole) => {
    await loginWithGoogle();
  };

  const logoutStaff = () => {
    if (currentStaff) {
      void writeAuditLog(currentStaff, 'تسجيل خروج', 'خروج آمن من لوحة الإدارة', true);
    }
    void signOut(auth);
    setCurrentStaff(null);
  };

  const changeOwnPassword = async (_newPassword: string) => {
    // Handled natively via Google Sign-In
  };

  // ==================== Cart & Favorites ====================

  const addToCart = (productId: string, qty = 1) => {
    const prod = products.find((p) => p.id === productId);
    if (!prod || prod.availability === 'غير متوفر') return;
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      return existing
        ? prev.map((c) => (c.productId === productId ? { ...c, quantity: c.quantity + qty } : c))
        : [...prev, { productId, quantity: qty }];
    });
  };

  const updateCartQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCart((prev) => prev.filter((c) => c.productId !== productId));
      return;
    }
    setCart((prev) => prev.map((c) => (c.productId === productId ? { ...c, quantity: qty } : c)));
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((c) => c.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const toggleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const clearFavorites = () => setFavorites([]);

  const reorderIntoCart = (order: Order) => {
    setCart((prev) => {
      const nextCart = [...prev];
      for (const item of order.items) {
        const prod = products.find((p) => p.id === item.productId);
        if (!prod || prod.availability === 'غير متوفر') continue;
        const existing = nextCart.find((c) => c.productId === item.productId);
        if (existing) {
          existing.quantity += item.quantity;
        } else {
          nextCart.push({ productId: item.productId, quantity: item.quantity });
        }
      }
      return nextCart;
    });
  };

  // ==================== Coupons & Checkout ====================

  const evaluateCoupon = (coupon: Coupon | undefined, totalItemsCount: number) => {
    if (!coupon || !coupon.isActive) {
      return { valid: false, message: 'الكوبون غير صالح أو متوقف حاليًا' };
    }
    if (new Date(coupon.expiresAt).getTime() < Date.now()) {
      return { valid: false, message: 'انتهت صلاحية هذا الكوبون' };
    }
    if (coupon.usedCount >= coupon.maxUses) {
      return { valid: false, message: 'تم استنفاد الحد الأقصى لاستخدام الكوبون' };
    }
    if (totalItemsCount < coupon.minItemsCount) {
      return {
        valid: false,
        message: `يتطلب الكوبون ${coupon.minItemsCount} قطع على الأقل في الطلب`,
      };
    }
    return {
      valid: true,
      coupon,
      message: `تم تسجيل الكوبون (${coupon.code}) وسيتم تطبيقه بعد مراجعة الأسعار`,
    };
  };

  const validateCouponForCart = (code: string, totalItemsCount: number) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return { valid: false, message: 'يرجى إدخال كود الكوبون' };
    const coupon =
      checkedCouponsCache[clean] ?? coupons.find((c) => c.code.toUpperCase() === clean);
    return evaluateCoupon(coupon, totalItemsCount);
  };

  const validateCouponAsync = async (code: string, totalItemsCount: number) => {
    const clean = code.trim().toUpperCase();
    if (!clean || !/^[A-Z0-9_-]+$/.test(clean)) {
      return { valid: false, message: 'يرجى إدخال كود كوبون صحيح' };
    }
    try {
      const snap = await getDoc(doc(db, 'coupons', clean));
      if (!snap.exists()) {
        return { valid: false, message: 'كود الكوبون غير موجود' };
      }
      const coupon = snap.data() as Coupon;
      setCheckedCouponsCache((prev) => ({ ...prev, [clean]: coupon }));
      return evaluateCoupon(coupon, totalItemsCount);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `coupons/${clean}`);
    }
  };

  const submitOrder = async (payload: {
    customerName: string;
    customerPhone: string;
    zoneId: string;
    addressType?: AddressPlaceType;
    streetName?: string;
    buildingNumber?: string;
    floorNumber?: string;
    apartmentNumber?: string;
    locationUrl?: string;
    detailedAddress: string;
    landmark: string;
    notes: string;
    couponCode?: string;
    idempotencyKey: string;
  }) => {
    if (settings.isMaintenanceMode) {
      return { ok: false, error: settings.maintenanceMessage };
    }
    if (!settings.isAcceptingOrders) {
      return { ok: false, error: settings.pauseMessage };
    }
    if (cart.length === 0) {
      return { ok: false, error: 'السلة فارغة' };
    }

    const phoneClean = payload.customerPhone.replace(/\s+/g, '');
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) {
      return { ok: false, error: 'يرجى إدخال رقم هاتف مصري صحيح مكون من 11 رقمًا' };
    }

    const zone = zones.find((z) => z.id === payload.zoneId);
    if (!zone || !zone.isActive) {
      return { ok: false, error: 'منطقة التوصيل المختارة متوقفة حاليًا' };
    }

    const totalQty = cart.reduce((acc, c) => acc + c.quantity, 0);
    if (totalQty < zone.minItemsCount) {
      return {
        ok: false,
        error: `الحد الأدنى للطلب في ${zone.name} هو ${zone.minItemsCount} قطع (${zone.minOrderNote})`,
      };
    }

    const items: OrderItem[] = cart
      .map((entry) => {
        const prod = products.find((p) => p.id === entry.productId);
        if (!prod) return null;
        return {
          productId: prod.id,
          productName: prod.name,
          quantity: entry.quantity,
          internalUnitPrice: prod.internalPrice,
        };
      })
      .filter((x): x is OrderItem => x !== null);

    if (items.length === 0) {
      return { ok: false, error: 'لم يتم العثور على المنتجات المختارة في السلة' };
    }

    let appliedCouponCode: string | undefined;
    if (payload.couponCode && payload.couponCode.trim()) {
      const check = await validateCouponAsync(payload.couponCode, totalQty);
      if (!check.valid) {
        return { ok: false, error: check.message };
      }
      appliedCouponCode = check.coupon?.code;
    }

    const orderNumSuffix = `${String(Date.now()).slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
    const orderNumber = `TABA-${orderNumSuffix}`;
    const orderId = `ord-${Date.now()}-${Math.floor(100 + Math.random() * 899)}`;
    const composedAddress = payload.streetName?.trim()
      ? [
          payload.streetName.trim(),
          payload.buildingNumber?.trim() ? `عمارة/منزل ${payload.buildingNumber.trim()}` : '',
          payload.floorNumber?.trim() ? `الدور ${payload.floorNumber.trim()}` : '',
          payload.apartmentNumber?.trim() ? `شقة/وحدة ${payload.apartmentNumber.trim()}` : '',
          payload.addressType ? `(${payload.addressType})` : '',
        ]
          .filter(Boolean)
          .join(' — ')
      : payload.detailedAddress.trim();

    const nowIso = new Date().toISOString();
    const newOrder: Order = {
      id: orderId,
      orderNumber,
      customerName: payload.customerName.trim(),
      customerPhone: phoneClean,
      zoneId: zone.id,
      zoneName: zone.name,
      addressType: payload.addressType,
      streetName: payload.streetName?.trim() || undefined,
      buildingNumber: payload.buildingNumber?.trim() || undefined,
      floorNumber: payload.floorNumber?.trim() || undefined,
      apartmentNumber: payload.apartmentNumber?.trim() || undefined,
      locationUrl: payload.locationUrl?.trim() || undefined,
      detailedAddress: composedAddress,
      landmark: payload.landmark.trim() || 'غير محدد',
      notes: payload.notes.trim(),
      couponCode: appliedCouponCode,
      deliveryFee: zone.fee,
      reviewedDiscount: 0,
      priceReviewedByStaff: false,
      customerApprovedTotal: false,
      paymentMethod: 'الدفع عند الاستلام',
      status: 'طلب جديد',
      items,
      history: [
        {
          id: `h-${Date.now()}`,
          oldStatus: 'إنشاء الطلب',
          newStatus: 'طلب جديد',
          changedAt: nowIso,
          changedBy: payload.customerName.trim(),
          notes: 'تم إرسال الطلب بانتظار مراجعة الأسعار والتوفر من فريق المعرض',
        },
      ],
      createdAt: nowIso,
      idempotencyKey: payload.idempotencyKey,
    };

    const trackingKey = `${orderNumber}_${phoneClean}`;
    try {
      const phoneHistRef = doc(db, 'phone_order_histories', phoneClean);
      const phoneHistSnap = await getDoc(phoneHistRef);
      const prevNums = phoneHistSnap.exists()
        ? ((phoneHistSnap.data() as { orderNumbers?: string[] }).orderNumbers ?? [])
        : [];
      const nextNums = [orderNumber, ...prevNums.filter((n) => n !== orderNumber)].slice(0, 50);

      const batch = writeBatch(db);
      batch.set(
        doc(db, 'orders', orderId),
        stripUndefined({ ...newOrder, serverCreatedAt: serverTimestamp() })
      );
      batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(newOrder));
      batch.set(phoneHistRef, { orderNumbers: nextNums, updatedAt: serverTimestamp() });
      await batch.commit();

      setCart([]);
      setTrackedOrdersCache((prev) => [newOrder, ...prev.filter((o) => o.id !== newOrder.id)]);
      try {
        const localSaved = loadLocalArray<{ orderNumber: string; phone: string }>(
          MY_ORDERS_STORAGE_KEY
        );
        localStorage.setItem(
          MY_ORDERS_STORAGE_KEY,
          JSON.stringify([{ orderNumber, phone: phoneClean }, ...localSaved].slice(0, 20))
        );
      } catch {
        // Ignore storage errors
      }
      return { ok: true, order: newOrder };
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `orders/${orderId}`);
    }
  };

  // ==================== Order & Return Tracking (Cross-Device) ====================

  const fetchOrderTracking = async (orderNumber: string, phone: string): Promise<Order | null> => {
    const numClean = orderNumber.trim().toUpperCase();
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!numClean || !phoneClean) return null;

    const trackingKey = `${numClean}_${phoneClean}`;
    try {
      const snap = await getDoc(doc(db, 'order_tracking', trackingKey));
      if (!snap.exists()) return null;
      const t = snap.data() as Record<string, unknown>;
      const mapped: Order = {
        id: String(t.orderId),
        orderNumber: String(t.orderNumber),
        customerName: String(t.customerName),
        customerPhone: phoneClean,
        zoneId: '',
        zoneName: String(t.zoneName),
        addressType: t.addressType as AddressPlaceType | undefined,
        detailedAddress: String(t.detailedAddress),
        landmark: String(t.landmark || ''),
        locationUrl: t.locationUrl ? String(t.locationUrl) : undefined,
        notes: String(t.notes || ''),
        couponCode: t.couponCode ? String(t.couponCode) : undefined,
        deliveryFee: Number(t.deliveryFee || 0),
        reviewedDiscount: Number(t.reviewedDiscount || 0),
        reviewedTotal: t.reviewedTotal !== undefined ? Number(t.reviewedTotal) : undefined,
        priceReviewedByStaff: Boolean(t.priceReviewedByStaff),
        customerApprovedTotal: Boolean(t.customerApprovedTotal),
        paymentMethod: 'الدفع عند الاستلام',
        status: t.status as OrderStatus,
        cancellationReason: t.cancellationReason ? String(t.cancellationReason) : undefined,
        items: (t.items as OrderItem[]) || [],
        history: (t.history as Order['history']) || [],
        createdAt: String(t.createdAt),
      };
      setTrackedOrdersCache((prev) => [mapped, ...prev.filter((o) => o.id !== mapped.id)]);
      return mapped;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `order_tracking/${trackingKey}`);
    }
  };

  const fetchOrdersByPhone = async (phone: string): Promise<Order[]> => {
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!/^01[0125][0-9]{8}$/.test(phoneClean)) return [];
    try {
      const histSnap = await getDoc(doc(db, 'phone_order_histories', phoneClean));
      if (!histSnap.exists()) return [];
      const orderNumbers = ((histSnap.data() as { orderNumbers?: string[] }).orderNumbers ?? []).slice(
        0,
        20
      );
      const results = await Promise.all(
        orderNumbers.map((ordNum) => fetchOrderTracking(ordNum, phoneClean))
      );
      return results.filter((x): x is Order => x !== null);
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `phone_order_histories/${phoneClean}`);
    }
  };

  const trackOrderPrivate = (orderNumber: string, phone: string) => {
    const numClean = orderNumber.trim().toUpperCase();
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const pool = [...orders, ...trackedOrdersCache];
    return (
      pool.find(
        (o) =>
          o.orderNumber.toUpperCase() === numClean &&
          o.customerPhone.replace(/[^0-9]/g, '') === phoneClean
      ) ?? null
    );
  };

  const getOrdersByPhone = (phone: string) => {
    const phoneClean = phone.replace(/[^0-9]/g, '');
    if (!phoneClean) return [];
    const map = new Map<string, Order>();
    for (const o of [...orders, ...trackedOrdersCache]) {
      if (o.customerPhone.replace(/[^0-9]/g, '') === phoneClean) {
        map.set(o.id, o);
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  };

  const customerEditOrder = async (
    orderId: string,
    phone: string,
    updates: {
      detailedAddress: string;
      landmark: string;
      notes: string;
      items: Array<{ productId: string; quantity: number }>;
    }
  ) => {
    if (!settings.allowCustomerOrderEdit) {
      return { ok: false, error: 'خاصية تعديل الطلبات غير مفعلة حاليًا من إدارة المعرض' };
    }
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const order = [...orders, ...trackedOrdersCache].find(
      (o) => o.id === orderId && o.customerPhone.replace(/[^0-9]/g, '') === phoneClean
    );
    if (!order) return { ok: false, error: 'لم يتم العثور على الطلب' };
    if (order.status !== 'طلب جديد' && order.status !== 'تم التأكيد') {
      return { ok: false, error: 'لا يمكن تعديل الطلب بعد بدء مرحلة التجهيز' };
    }
    const validUpdates = updates.items.filter((i) => i.quantity > 0);
    if (validUpdates.length === 0) {
      return { ok: false, error: 'يجب الإبقاء على منتج واحد على الأقل، أو إلغاء الطلب بالكامل.' };
    }

    const nextItems: OrderItem[] = order.items
      .map((oldItem) => {
        const updated = validUpdates.find((u) => u.productId === oldItem.productId);
        return updated ? { ...oldItem, quantity: updated.quantity } : null;
      })
      .filter((x): x is OrderItem => x !== null);

    const updatedOrder: Order = {
      ...order,
      detailedAddress: updates.detailedAddress.trim() || order.detailedAddress,
      landmark: updates.landmark.trim() || order.landmark,
      notes: updates.notes.trim(),
      items: nextItems,
      history: [
        ...order.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: order.status,
          newStatus: order.status,
          changedAt: new Date().toISOString(),
          changedBy: order.customerName,
          notes: 'تعديل بيانات أو كميات الطلب من قبل العميل قبل بدء التجهيز',
        },
      ],
    };

    const trackingKey = `${order.orderNumber.toUpperCase()}_${phoneClean}`;
    const actionId = `act-${Date.now()}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
      batch.set(doc(db, 'order_customer_actions', actionId), {
        id: actionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: phoneClean,
        actionType: 'edit',
        payload: { modified: true },
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setTrackedOrdersCache((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `order_tracking/${trackingKey}`);
    }
  };

  const customerCancelOrder = async (orderId: string, phone: string, reason: string) => {
    if (!settings.allowCustomerOrderCancel) {
      return { ok: false, error: 'خاصية إلغاء الطلبات غير مفعلة حاليًا، يرجى التواصل عبر واتساب' };
    }
    const phoneClean = phone.replace(/[^0-9]/g, '');
    const order = [...orders, ...trackedOrdersCache].find(
      (o) => o.id === orderId && o.customerPhone.replace(/[^0-9]/g, '') === phoneClean
    );
    if (!order) return { ok: false, error: 'لم يتم العثور على الطلب' };
    if (order.status !== 'طلب جديد' && order.status !== 'تم التأكيد') {
      return { ok: false, error: 'لا يمكن إلغاء الطلب بعد بدء مرحلة التجهيز' };
    }
    const cleanReason = reason.trim() || 'إلغاء من قبل العميل';
    const updatedOrder: Order = {
      ...order,
      status: 'ملغي',
      cancellationReason: cleanReason,
      history: [
        ...order.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: order.status,
          newStatus: 'ملغي',
          changedAt: new Date().toISOString(),
          changedBy: order.customerName,
          notes: `سبب الإلغاء: ${cleanReason}`,
        },
      ],
    };

    const trackingKey = `${order.orderNumber.toUpperCase()}_${phoneClean}`;
    const actionId = `act-${Date.now()}`;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
      batch.set(doc(db, 'order_customer_actions', actionId), {
        id: actionId,
        orderId: order.id,
        orderNumber: order.orderNumber,
        customerPhone: phoneClean,
        actionType: 'cancel',
        payload: { reason: cleanReason },
        createdAt: serverTimestamp(),
      });
      await batch.commit();
      setTrackedOrdersCache((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `order_tracking/${trackingKey}`);
    }
  };

  const customerRespondSubstitute = (
    orderId: string,
    productId: string,
    decision: 'accepted' | 'rejected'
  ) => {
    const order = [...orders, ...trackedOrdersCache].find((o) => o.id === orderId);
    if (!order) return;
    const targetItem = order.items.find((it) => it.productId === productId);
    const subName = targetItem?.substitute?.productName ?? '';
    const updatedOrder: Order = {
      ...order,
      items: order.items.map((it) =>
        it.productId === productId && it.substitute
          ? { ...it, substitute: { ...it.substitute, status: decision } }
          : it
      ),
      history: [
        ...order.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: order.status,
          newStatus: order.status,
          changedAt: new Date().toISOString(),
          changedBy: order.customerName,
          notes:
            decision === 'accepted'
              ? `وافق العميل على المنتج البديل: ${subName}`
              : `رفض العميل المنتج البديل المقترح: ${subName}`,
        },
      ],
    };

    const phoneClean = order.customerPhone.replace(/[^0-9]/g, '');
    const trackingKey = `${order.orderNumber.toUpperCase()}_${phoneClean}`;
    const actionId = `act-${Date.now()}`;
    void (async () => {
      try {
        const batch = writeBatch(db);
        batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
        batch.set(doc(db, 'order_customer_actions', actionId), {
          id: actionId,
          orderId: order.id,
          orderNumber: order.orderNumber,
          customerPhone: phoneClean,
          actionType: 'substitute_response',
          payload: { productId, decision },
          createdAt: serverTimestamp(),
        });
        await batch.commit();
        setTrackedOrdersCache((prev) => prev.map((o) => (o.id === order.id ? updatedOrder : o)));
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `order_tracking/${trackingKey}`);
      }
    })();
  };

  // ==================== Reviews, Complaints & Returns ====================

  const submitProductReview = (payload: {
    productId: string;
    customerName: string;
    rating: number;
    comment: string;
  }) => {
    const prod = products.find((p) => p.id === payload.productId);
    if (!prod) return;
    const reviewId = `rev-${Date.now()}`;
    const review = stripUndefined({
      id: reviewId,
      productId: prod.id,
      productName: prod.name,
      customerName: payload.customerName.trim(),
      rating: payload.rating,
      comment: payload.comment.trim(),
      status: 'pending' as const,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    });
    void setDoc(doc(db, 'reviews', reviewId), review).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `reviews/${reviewId}`)
    );
  };

  const submitComplaint = (payload: {
    type: 'شكوى' | 'مقترح';
    customerName: string;
    customerPhone: string;
    orderNumber?: string;
    message: string;
  }) => {
    const id = `comp-${Date.now()}`;
    const entry = stripUndefined({
      id,
      type: payload.type,
      customerName: payload.customerName.trim(),
      customerPhone: payload.customerPhone.trim(),
      orderNumber: payload.orderNumber?.trim() || undefined,
      message: payload.message.trim(),
      status: 'جديد' as const,
      createdAt: new Date().toISOString(),
      serverCreatedAt: serverTimestamp(),
    });
    void setDoc(doc(db, 'complaints', id), entry).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `complaints/${id}`)
    );
  };

  const submitReturnRequest = (payload: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    productName: string;
    returnedItems?: ReturnedProductEntry[];
    requestType: 'استبدال' | 'استرجاع';
    reason: string;
  }) => {
    const cleanItems: ReturnedProductEntry[] =
      payload.returnedItems && payload.returnedItems.length > 0
        ? payload.returnedItems
        : [
            {
              productName: payload.productName.trim(),
              quantity: 1,
              condition: 'سليم بغلافه',
              restocked: false,
            },
          ];
    const summaryProductName =
      payload.productName.trim() ||
      cleanItems.map((it) => `${it.productName} (×${it.quantity})`).join('، ');

    const codeNum = `${String(Date.now()).slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
    const phoneClean = payload.customerPhone.replace(/[^0-9]/g, '');
    const id = `ret-${Date.now()}`;
    const entry: ReturnRequest = {
      id,
      returnCode: `RET-${codeNum}`,
      orderNumber: payload.orderNumber.trim().toUpperCase(),
      customerName: payload.customerName.trim(),
      customerPhone: phoneClean,
      productName: summaryProductName,
      returnedItems: cleanItems,
      requestType: payload.requestType,
      reason: payload.reason.trim(),
      status: 'جديد',
      createdAt: new Date().toISOString(),
    };

    const trackingKey = `${entry.returnCode}_${phoneClean}`;
    void (async () => {
      try {
        const batch = writeBatch(db);
        batch.set(
          doc(db, 'return_requests', id),
          stripUndefined({ ...entry, serverCreatedAt: serverTimestamp() })
        );
        batch.set(doc(db, 'return_tracking', trackingKey), buildReturnTrackingPayload(entry));
        await batch.commit();
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `return_requests/${id}`);
      }
    })();

    setTrackedReturnsCache((prev) => [entry, ...prev]);
    return entry;
  };

  const fetchReturnTracking = async (codeOrOrder: string, phone: string): Promise<ReturnRequest[]> => {
    const q = codeOrOrder.trim().toUpperCase();
    const ph = phone.replace(/[^0-9]/g, '');
    if (!q || !ph) return [];
    const key = `${q}_${ph}`;
    try {
      const snap = await getDoc(doc(db, 'return_tracking', key));
      if (!snap.exists()) return [];
      const data = snap.data() as Record<string, unknown>;
      const mapped: ReturnRequest = {
        id: String(data.returnId),
        returnCode: String(data.returnCode),
        orderNumber: String(data.orderNumber),
        customerName: '',
        customerPhone: ph,
        productName: '',
        returnedItems: (data.returnedItems as ReturnedProductEntry[]) || [],
        requestType: data.requestType as 'استبدال' | 'استرجاع',
        reason: String(data.reason),
        status: data.status as ReturnRequestStatus,
        assignedStaffName: data.assignedStaffName ? String(data.assignedStaffName) : undefined,
        adminNote: data.adminNote ? String(data.adminNote) : undefined,
        createdAt: String(data.createdAt),
        updatedAt: data.updatedAt ? String(data.updatedAt) : undefined,
      };
      setTrackedReturnsCache((prev) => [mapped, ...prev.filter((r) => r.id !== mapped.id)]);
      return [mapped];
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `return_tracking/${key}`);
    }
  };

  const trackReturnRequests = (codeOrOrder: string, phone: string) => {
    const q = codeOrOrder.trim().toUpperCase();
    const ph = phone.replace(/[^0-9]/g, '');
    if (!ph) return [];
    const pool = [...returnRequests, ...trackedReturnsCache];
    const seen = new Map<string, ReturnRequest>();
    for (const r of pool) {
      const rPhone = r.customerPhone.replace(/[^0-9]/g, '');
      if (rPhone !== ph) continue;
      if (!q || r.returnCode.toUpperCase() === q || r.orderNumber.toUpperCase() === q) {
        seen.set(r.id, r);
      }
    }
    return Array.from(seen.values());
  };

  // ==================== Admin Actions (Cloud Synced) ====================

  const updateOrderByStaff = (
    orderId: string,
    updates: {
      newStatus: OrderStatus;
      notes: string;
      reviewedDiscount?: number;
      reviewedTotal?: number;
      priceReviewedByStaff?: boolean;
      customerApprovedTotal?: boolean;
      cancellationReason?: string;
    }
  ) => {
    const actor = currentStaff;
    const target = orders.find((o) => o.id === orderId);
    if (!actor || !target) return;

    const updatedOrder: Order = {
      ...target,
      status: updates.newStatus,
      reviewedDiscount: updates.reviewedDiscount ?? target.reviewedDiscount,
      reviewedTotal: updates.reviewedTotal ?? target.reviewedTotal,
      priceReviewedByStaff: updates.priceReviewedByStaff ?? target.priceReviewedByStaff,
      customerApprovedTotal: updates.customerApprovedTotal ?? target.customerApprovedTotal,
      cancellationReason: updates.cancellationReason ?? target.cancellationReason,
      history: [
        ...target.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: target.status,
          newStatus: updates.newStatus,
          changedAt: new Date().toISOString(),
          changedBy: actor.name,
          notes: updates.notes.trim() || 'تحديث حالة الطلب من لوحة الإدارة',
        },
      ],
    };

    const trackingKey = `${target.orderNumber.toUpperCase()}_${target.customerPhone.replace(/[^0-9]/g, '')}`;
    void (async () => {
      try {
        const ordRef = doc(db, 'orders', orderId);
        const existingSnap = await getDoc(ordRef);
        const existingServerCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        const batch = writeBatch(db);
        batch.set(
          ordRef,
          stripUndefined({ ...updatedOrder, serverCreatedAt: existingServerCreatedAt })
        );
        batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
        await batch.commit();
        await writeAuditLog(
          actor,
          'تحديث طلب',
          `طلب ${target.orderNumber}: من (${target.status}) إلى (${updates.newStatus})`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    })();
  };

  const updateOrderItemsAndFeeByStaff = (
    orderId: string,
    updates: {
      items: OrderItem[];
      deliveryFee: number;
      notes?: string;
    }
  ) => {
    const actor = currentStaff;
    const target = orders.find((o) => o.id === orderId);
    if (!actor || !target) return;

    const cleanItems = updates.items.filter((i) => i.quantity > 0);
    const internalSub = cleanItems.reduce(
      (sum, it) => sum + it.internalUnitPrice * it.quantity,
      0
    );
    const nextReviewedTotal = Math.max(
      0,
      internalSub - target.reviewedDiscount + updates.deliveryFee
    );
    const updatedOrder: Order = {
      ...target,
      items: cleanItems,
      deliveryFee: updates.deliveryFee,
      reviewedTotal: nextReviewedTotal,
      priceReviewedByStaff: true,
      history: [
        ...target.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: target.status,
          newStatus: target.status,
          changedAt: new Date().toISOString(),
          changedBy: actor.name,
          notes:
            updates.notes?.trim() ||
            `تعديل بنود/أسعار الطلب أو رسوم التوصيل (${updates.deliveryFee} ج.م)`,
        },
      ],
    };

    const trackingKey = `${target.orderNumber.toUpperCase()}_${target.customerPhone.replace(/[^0-9]/g, '')}`;
    void (async () => {
      try {
        const ordRef = doc(db, 'orders', orderId);
        const existingSnap = await getDoc(ordRef);
        const existingServerCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        const batch = writeBatch(db);
        batch.set(
          ordRef,
          stripUndefined({ ...updatedOrder, serverCreatedAt: existingServerCreatedAt })
        );
        batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
        await batch.commit();
        await writeAuditLog(
          actor,
          'تعديل بنود وأسعار طلب',
          `تعديل أصناف أو أسعار الطلب ${target.orderNumber}`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    })();
  };

  const proposeSubstituteItem = (
    orderId: string,
    targetProductId: string,
    substituteProductId: string,
    note: string
  ) => {
    const actor = currentStaff;
    const target = orders.find((o) => o.id === orderId);
    const subProd = products.find((p) => p.id === substituteProductId);
    if (!actor || !target || !subProd) return;

    const updatedOrder: Order = {
      ...target,
      items: target.items.map((it) =>
        it.productId === targetProductId
          ? {
              ...it,
              substitute: {
                productId: subProd.id,
                productName: subProd.name,
                note: note.trim() || 'منتج بديل مقترح بانتظار موافقة العميل',
                status: 'pending',
              },
            }
          : it
      ),
      history: [
        ...target.history,
        {
          id: `h-${Date.now()}`,
          oldStatus: target.status,
          newStatus: target.status,
          changedAt: new Date().toISOString(),
          changedBy: actor.name,
          notes: `اقتراح منتج بديل: ${subProd.name} (بانتظار موافقة العميل)`,
        },
      ],
    };

    const trackingKey = `${target.orderNumber.toUpperCase()}_${target.customerPhone.replace(/[^0-9]/g, '')}`;
    void (async () => {
      try {
        const ordRef = doc(db, 'orders', orderId);
        const existingSnap = await getDoc(ordRef);
        const existingServerCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        const batch = writeBatch(db);
        batch.set(
          ordRef,
          stripUndefined({ ...updatedOrder, serverCreatedAt: existingServerCreatedAt })
        );
        batch.set(doc(db, 'order_tracking', trackingKey), buildTrackingPayload(updatedOrder));
        await batch.commit();
        await writeAuditLog(
          actor,
          'اقتراح بديل في طلب',
          `اقترح بديلاً (${subProd.name}) على الطلب ${target.orderNumber}`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
      }
    })();
  };

  const saveProduct = (
    product: Omit<Product, 'id' | 'createdAt' | 'requestCount'> & { id?: string }
  ) => {
    const actor = currentStaff;
    if (!actor) return;
    const existing = product.id ? products.find((p) => p.id === product.id) : undefined;
    const id = existing?.id ?? `prod-${Date.now()}`;
    const offerStart =
      product.isOffer && !product.offerStartsAt ? new Date().toISOString() : product.offerStartsAt;
    const offerExpiry =
      product.isOffer && !product.offerExpiresAt
        ? new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
        : product.offerExpiresAt;

    const fullProd: Product = stripUndefined({
      ...product,
      id,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      requestCount: existing?.requestCount ?? 0,
      offerStartsAt: offerStart,
      offerExpiresAt: offerExpiry,
      imageUrl: sanitizeImageForFirestore(product.imageUrl),
      originalImageUrl: undefined,
    });

    void setDoc(doc(db, 'products', id), fullProd)
      .then(() =>
        writeAuditLog(
          actor,
          existing ? 'تعديل منتج' : 'إضافة منتج',
          `${existing ? 'تحديث' : 'إنشاء'} المنتج: ${product.name}`
        )
      )
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `products/${id}`));
  };

  const deleteProduct = (productId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    const target = products.find((p) => p.id === productId);
    void deleteDoc(doc(db, 'products', productId))
      .then(() => writeAuditLog(actor, 'حذف منتج', `حذف المنتج: ${target?.name ?? productId}`))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `products/${productId}`));
  };

  const addCategory = (name: string, iconKey: ProductVisualKind = 'personalcare') => {
    const actor = currentStaff;
    const clean = name.trim();
    if (!actor || !clean) return;
    const id = `cat-${Date.now()}`;
    const cat: Category = { id, name: clean, sortOrder: categories.length + 1, iconKey };
    void setDoc(doc(db, 'categories', id), stripUndefined(cat))
      .then(() => writeAuditLog(actor, 'إضافة قسم', `أضاف قسم جديد: ${clean}`))
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `categories/${id}`));
  };

  const renameCategory = (categoryId: string, newName: string) => {
    const actor = currentStaff;
    const clean = newName.trim();
    const target = categories.find((c) => c.id === categoryId);
    if (!actor || !clean || !target) return;
    void setDoc(doc(db, 'categories', categoryId), stripUndefined({ ...target, name: clean }))
      .then(() => writeAuditLog(actor, 'تعديل اسم قسم', `تغيير اسم القسم إلى: ${clean}`))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `categories/${categoryId}`));
  };

  const updateCategoryDetails = (
    categoryId: string,
    updates: { name?: string; iconKey?: ProductVisualKind }
  ) => {
    const actor = currentStaff;
    const target = categories.find((c) => c.id === categoryId);
    if (!actor || !target) return;
    const nextCat: Category = {
      ...target,
      name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : target.name,
      iconKey: updates.iconKey ?? target.iconKey,
    };
    void setDoc(doc(db, 'categories', categoryId), stripUndefined(nextCat))
      .then(() => writeAuditLog(actor, 'تحديث القسم', `تحديث بيانات أو أيقونة القسم (${categoryId})`))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `categories/${categoryId}`));
  };

  const moveCategory = (categoryId: string, direction: 'up' | 'down') => {
    const actor = currentStaff;
    if (!actor) return;
    const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((c) => c.id === categoryId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const tmp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = tmp;

    const batch = writeBatch(db);
    sorted.forEach((c, i) => {
      batch.set(doc(db, 'categories', c.id), stripUndefined({ ...c, sortOrder: i + 1 }));
    });
    void batch
      .commit()
      .then(() => writeAuditLog(actor, 'ترتيب الأقسام', `إعادة ترتيب قسم ${tmp.name}`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'categories'));
  };

  const deleteCategory = (categoryId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    const target = categories.find((c) => c.id === categoryId);
    void deleteDoc(doc(db, 'categories', categoryId))
      .then(() => writeAuditLog(actor, 'حذف قسم', `حذف القسم: ${target?.name ?? categoryId}`))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `categories/${categoryId}`));
  };

  const saveBanner = (banner: Banner) => {
    const actor = currentStaff;
    if (!actor) return;
    const clean = stripUndefined({
      ...banner,
      imageUrl: sanitizeImageForFirestore(banner.imageUrl),
    });
    void setDoc(doc(db, 'banners', banner.id), clean)
      .then(() => writeAuditLog(actor, 'تعديل بانر', `حدّث البانر: ${banner.title}`))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `banners/${banner.id}`));
  };

  const addBanner = (banner: Omit<Banner, 'id' | 'sortOrder'>) => {
    const actor = currentStaff;
    if (!actor) return;
    const id = `ban-${Date.now()}`;
    const clean: Banner = stripUndefined({
      ...banner,
      id,
      sortOrder: banners.length + 1,
      imageUrl: sanitizeImageForFirestore(banner.imageUrl),
    });
    void setDoc(doc(db, 'banners', id), clean)
      .then(() => writeAuditLog(actor, 'إضافة بانر', `أضاف بانر جديد: ${banner.title}`))
      .catch((err) => handleFirestoreError(err, OperationType.CREATE, `banners/${id}`));
  };

  const deleteBanner = (bannerId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    const target = banners.find((b) => b.id === bannerId);
    void deleteDoc(doc(db, 'banners', bannerId))
      .then(() => writeAuditLog(actor, 'حذف بانر', `حذف البانر: ${target?.title ?? bannerId}`))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `banners/${bannerId}`));
  };

  const moveBanner = (bannerId: string, direction: 'up' | 'down') => {
    const actor = currentStaff;
    if (!actor) return;
    const sorted = [...banners].sort((a, b) => a.sortOrder - b.sortOrder);
    const idx = sorted.findIndex((b) => b.id === bannerId);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (idx < 0 || swapIdx < 0 || swapIdx >= sorted.length) return;
    const temp = sorted[idx];
    sorted[idx] = sorted[swapIdx];
    sorted[swapIdx] = temp;

    const batch = writeBatch(db);
    sorted.forEach((b, i) => {
      batch.set(doc(db, 'banners', b.id), stripUndefined({ ...b, sortOrder: i + 1 }));
    });
    void batch
      .commit()
      .then(() => writeAuditLog(actor, 'إعادة ترتيب البانرات', `تغيير ترتيب البانر ${temp.title}`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'banners'));
  };

  const renewBannerOfferThreeDays = (bannerId: string) => {
    const actor = currentStaff;
    const target = banners.find((b) => b.id === bannerId);
    if (!actor || !target) return;
    const nowIso = new Date().toISOString();
    const nextExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const nextBanner: Banner = stripUndefined({
      ...target,
      isOfferBanner: true,
      isActive: true,
      offerStartsAt: nowIso,
      offerExpiresAt: nextExpiry,
    });
    void setDoc(doc(db, 'banners', bannerId), nextBanner)
      .then(() => writeAuditLog(actor, 'تجديد عرض البانر', 'تجديد مدة عرض البانر لـ 3 أيام إضافية'))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `banners/${bannerId}`));
  };

  const renewProductOfferThreeDays = (productId: string) => {
    const actor = currentStaff;
    const target = products.find((p) => p.id === productId);
    if (!actor || !target) return;
    const nowIso = new Date().toISOString();
    const nextExpiry = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const nextProd: Product = stripUndefined({
      ...target,
      isOffer: true,
      offerStartsAt: nowIso,
      offerExpiresAt: nextExpiry,
      originalImageUrl: undefined,
    });
    void setDoc(doc(db, 'products', productId), nextProd)
      .then(() => writeAuditLog(actor, 'تجديد عرض منتج', 'تفعيل وتجديد عرض 3 أيام على المنتج'))
      .catch((err) => handleFirestoreError(err, OperationType.UPDATE, `products/${productId}`));
  };

  const applyBulkOffer = (payload: {
    productIds: string[];
    startsAt: string;
    expiresAt: string;
    active: boolean;
  }) => {
    const actor = currentStaff;
    if (!actor || payload.productIds.length === 0) return;
    const idSet = new Set(payload.productIds);
    const batch = writeBatch(db);
    products
      .filter((p) => idSet.has(p.id))
      .forEach((p) => {
        batch.set(
          doc(db, 'products', p.id),
          stripUndefined({
            ...p,
            isOffer: payload.active,
            offerStartsAt: payload.active ? payload.startsAt : p.offerStartsAt,
            offerExpiresAt: payload.active ? payload.expiresAt : p.offerExpiresAt,
            originalImageUrl: undefined,
          })
        );
      });
    void batch
      .commit()
      .then(() =>
        writeAuditLog(
          actor,
          'إدارة عروض جماعية',
          `${payload.active ? 'تفعيل عرض على' : 'إيقاف عرض'} (${payload.productIds.length}) منتجات`
        )
      )
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'products'));
  };

  const saveCoupon = (coupon: Coupon) => {
    const actor = currentStaff;
    if (!actor) return;
    const codeKey = coupon.code.trim().toUpperCase();
    const clean: Coupon = stripUndefined({ ...coupon, id: codeKey, code: codeKey });
    void setDoc(doc(db, 'coupons', codeKey), clean)
      .then(() => writeAuditLog(actor, 'إدارة الكوبونات', `حفظ الكوبون: ${codeKey}`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `coupons/${codeKey}`));
  };

  const deleteCoupon = (couponId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    const target = coupons.find((c) => c.id === couponId || c.code === couponId);
    const docId = target?.code.toUpperCase() || couponId;
    void deleteDoc(doc(db, 'coupons', docId))
      .then(() => writeAuditLog(actor, 'حذف كوبون', `تم حذف كوبون خصم (${docId})`))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `coupons/${docId}`));
  };

  const saveZone = (zone: DeliveryZone) => {
    const actor = currentStaff;
    if (!actor) return;
    void setDoc(doc(db, 'zones', zone.id), stripUndefined(zone))
      .then(() => writeAuditLog(actor, 'إعدادات مناطق التوصيل', `حفظ منطقة: ${zone.name}`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `zones/${zone.id}`));
  };

  const deleteZone = (zoneId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    void deleteDoc(doc(db, 'zones', zoneId))
      .then(() => writeAuditLog(actor, 'حذف منطقة توصيل', 'تم حذف منطقة التوصيل'))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `zones/${zoneId}`));
  };

  const updateSettings = (partial: Partial<StoreSettings>) => {
    const actor = currentStaff;
    if (!actor) return;
    const nextSettings: StoreSettings = stripUndefined({
      ...settings,
      ...partial,
      brandLogoUrl:
        partial.brandLogoUrl !== undefined
          ? sanitizeImageForFirestore(partial.brandLogoUrl) || INITIAL_SETTINGS.brandLogoUrl
          : settings.brandLogoUrl,
      socialLinks: partial.socialLinks
        ? { ...settings.socialLinks, ...partial.socialLinks }
        : settings.socialLinks,
      theme: partial.theme ? { ...settings.theme, ...partial.theme } : settings.theme,
      copy: partial.copy ? { ...settings.copy, ...partial.copy } : settings.copy,
    });
    setSettings(nextSettings);
    void setDoc(doc(db, 'settings', 'store'), nextSettings)
      .then(() =>
        writeAuditLog(
          actor,
          'تحديث إعدادات المعرض',
          'تعديل الإعدادات العامة أو وضع الصيانة أو الشكل والنصوص'
        )
      )
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, 'settings/store'));
  };

  const saveFaq = (faq: FaqItem) => {
    const actor = currentStaff;
    if (!actor) return;
    void setDoc(doc(db, 'faqs', faq.id), stripUndefined(faq))
      .then(() => writeAuditLog(actor, 'إدارة الأسئلة الشائعة', `حفظ سؤال: ${faq.question}`))
      .catch((err) => handleFirestoreError(err, OperationType.WRITE, `faqs/${faq.id}`));
  };

  const deleteFaq = (faqId: string) => {
    const actor = currentStaff;
    if (!actor) return;
    void deleteDoc(doc(db, 'faqs', faqId))
      .then(() => writeAuditLog(actor, 'حذف سؤال شائع', 'تم حذف سؤال من مركز المساعدة'))
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `faqs/${faqId}`));
  };

  const moderateReview = (reviewId: string, decision: 'approved' | 'rejected') => {
    const actor = currentStaff;
    const target = reviews.find((r) => r.id === reviewId);
    if (!actor || !target) return;
    void (async () => {
      try {
        const revRef = doc(db, 'reviews', reviewId);
        const existingSnap = await getDoc(revRef);
        const serverCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        await setDoc(revRef, stripUndefined({ ...target, status: decision, serverCreatedAt }));
        await writeAuditLog(
          actor,
          'مراجعة تقييم عميل',
          `تم ${decision === 'approved' ? 'اعتماد ونشر' : 'رفض'} تقييم العميل`
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `reviews/${reviewId}`);
      }
    })();
  };

  const updateComplaintStatus = (
    complaintId: string,
    status: ComplaintSuggestion['status'],
    adminReply?: string
  ) => {
    const actor = currentStaff;
    const target = complaints.find((c) => c.id === complaintId);
    if (!actor || !target) return;
    void (async () => {
      try {
        const compRef = doc(db, 'complaints', complaintId);
        const existingSnap = await getDoc(compRef);
        const serverCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        await setDoc(
          compRef,
          stripUndefined({
            ...target,
            status,
            adminReply: adminReply ?? target.adminReply,
            serverCreatedAt,
          })
        );
        await writeAuditLog(actor, 'متابعة الشكاوى والمقترحات', `تحديث الحالة إلى: ${status}`);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `complaints/${complaintId}`);
      }
    })();
  };

  const updateReturnRequestDetails = (
    requestId: string,
    updates: {
      status?: ReturnRequestStatus;
      assignedStaffId?: string;
      assignedStaffName?: string;
      adminNote?: string;
      returnedItems?: ReturnedProductEntry[];
    }
  ) => {
    const actor = currentStaff;
    const target = returnRequests.find((r) => r.id === requestId);
    if (!actor || !target) return;
    const summaryProductName = updates.returnedItems
      ? updates.returnedItems.map((it) => `${it.productName} (×${it.quantity})`).join('، ')
      : target.productName;
    const nextReq: ReturnRequest = {
      ...target,
      status: updates.status ?? target.status,
      assignedStaffId:
        updates.assignedStaffId !== undefined ? updates.assignedStaffId : target.assignedStaffId,
      assignedStaffName:
        updates.assignedStaffName !== undefined
          ? updates.assignedStaffName
          : target.assignedStaffName,
      adminNote: updates.adminNote !== undefined ? updates.adminNote : target.adminNote,
      returnedItems: updates.returnedItems ?? target.returnedItems,
      productName: summaryProductName || target.productName,
      updatedAt: new Date().toISOString(),
    };

    const trackingKey = `${target.returnCode}_${target.customerPhone.replace(/[^0-9]/g, '')}`;
    void (async () => {
      try {
        const retRef = doc(db, 'return_requests', requestId);
        const existingSnap = await getDoc(retRef);
        const serverCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        const batch = writeBatch(db);
        batch.set(retRef, stripUndefined({ ...nextReq, serverCreatedAt }));
        batch.set(doc(db, 'return_tracking', trackingKey), buildReturnTrackingPayload(nextReq));
        await batch.commit();
        await writeAuditLog(
          actor,
          'تحديث ملف مرتجع / استبدال',
          `تحديث طلب ${target.returnCode} (${nextReq.status}${
            updates.assignedStaffName ? ` · المسؤول: ${updates.assignedStaffName}` : ''
          })`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `return_requests/${requestId}`);
      }
    })();
  };

  const updateReturnRequestStatus = (
    requestId: string,
    status: ReturnRequestStatus,
    adminNote?: string
  ) => {
    updateReturnRequestDetails(requestId, { status, adminNote });
  };

  const createStaffReturnRequest = (payload: {
    orderNumber: string;
    customerName: string;
    customerPhone: string;
    requestType: 'استبدال' | 'استرجاع';
    reason: string;
    returnedItems: ReturnedProductEntry[];
    assignedStaffId?: string;
    adminNote?: string;
  }) => {
    const actor = currentStaff;
    const assignedUser = payload.assignedStaffId
      ? staffUsers.find((u) => u.id === payload.assignedStaffId)
      : actor ?? undefined;
    const codeNum = `${String(Date.now()).slice(-4)}${Math.floor(10 + Math.random() * 89)}`;
    const phoneClean = payload.customerPhone.replace(/[^0-9]/g, '');
    const summaryName = payload.returnedItems
      .map((it) => `${it.productName} (×${it.quantity})`)
      .join('، ');
    const id = `ret-${Date.now()}`;
    const nowIso = new Date().toISOString();
    const entry: ReturnRequest = {
      id,
      returnCode: `RET-${codeNum}`,
      orderNumber: payload.orderNumber.trim().toUpperCase(),
      customerName: payload.customerName.trim(),
      customerPhone: phoneClean,
      productName: summaryName,
      returnedItems: payload.returnedItems,
      requestType: payload.requestType,
      reason: payload.reason.trim(),
      status: 'قيد المراجعة',
      assignedStaffId: assignedUser?.id,
      assignedStaffName: assignedUser?.name,
      adminNote: payload.adminNote?.trim() || undefined,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const trackingKey = `${entry.returnCode}_${phoneClean}`;
    void (async () => {
      try {
        const batch = writeBatch(db);
        batch.set(
          doc(db, 'return_requests', id),
          stripUndefined({ ...entry, serverCreatedAt: serverTimestamp() })
        );
        batch.set(doc(db, 'return_tracking', trackingKey), buildReturnTrackingPayload(entry));
        await batch.commit();
        if (actor) {
          await writeAuditLog(
            actor,
            'تسجيل طلب مرتجع من الإدارة',
            `تسجيل ${entry.returnCode} لطلب ${entry.orderNumber} (${entry.requestType})`
          );
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, `return_requests/${id}`);
      }
    })();

    return entry;
  };

  const restockReturnedItem = (requestId: string, itemIndex: number) => {
    const actor = currentStaff;
    if (!actor) return { ok: false, message: 'يرجى تسجيل الدخول أولاً' };
    const req = returnRequests.find((r) => r.id === requestId);
    const item = req?.returnedItems[itemIndex];
    if (!req || !item) return { ok: false, message: 'لم يتم العثور على الصنف المرتجع' };
    if (item.restocked) return { ok: false, message: 'تمت إعادة هذه الكمية للمخزون مسبقًا' };

    const matchedProduct =
      (item.productId && products.find((p) => p.id === item.productId)) ||
      products.find((p) => p.name.trim() === item.productName.trim());

    if (!matchedProduct) {
      return {
        ok: false,
        message: 'لم يتم ربط الصنف بمنتج في الكتالوج، يرجى اختياره من القائمة لإرجاع رصيده.',
      };
    }

    const nextQty = matchedProduct.stockQty + item.quantity;
    const nextAvail =
      nextQty <= 0
        ? ('غير متوفر' as const)
        : nextQty <= matchedProduct.lowStockThreshold
        ? ('كمية محدودة' as const)
        : ('متوفر' as const);

    const nextProd: Product = stripUndefined({
      ...matchedProduct,
      stockQty: nextQty,
      availability: nextAvail,
      originalImageUrl: undefined,
    });
    const nextReq: ReturnRequest = {
      ...req,
      returnedItems: req.returnedItems.map((it, idx) =>
        idx === itemIndex ? { ...it, productId: matchedProduct.id, restocked: true } : it
      ),
      updatedAt: new Date().toISOString(),
    };
    const trackingKey = `${req.returnCode}_${req.customerPhone.replace(/[^0-9]/g, '')}`;

    void (async () => {
      try {
        const retRef = doc(db, 'return_requests', requestId);
        const existingSnap = await getDoc(retRef);
        const serverCreatedAt = existingSnap.exists()
          ? existingSnap.data().serverCreatedAt ?? serverTimestamp()
          : serverTimestamp();
        const batch = writeBatch(db);
        batch.set(doc(db, 'products', matchedProduct.id), nextProd);
        batch.set(retRef, stripUndefined({ ...nextReq, serverCreatedAt }));
        batch.set(doc(db, 'return_tracking', trackingKey), buildReturnTrackingPayload(nextReq));
        await batch.commit();
        await writeAuditLog(
          actor,
          'إعادة منتج مرتجع للمخزون',
          `إضافة (${item.quantity}) من ${matchedProduct.name} للمخزون من المرتجع ${req.returnCode}`
        );
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `return_requests/${requestId}`);
      }
    })();

    return {
      ok: true,
      message: `تمت إضافة ${item.quantity} قطعة إلى رصيد «${matchedProduct.name}» بنجاح.`,
    };
  };

  // ==================== Notifications State ====================

  const persistNotificationState = (nextRead: string[], nextDismissed: string[]) => {
    if (!currentStaff) return;
    const emailLower = (currentStaff.email || currentStaff.id).toLowerCase();
    void setDoc(doc(db, 'staff_notification_state', emailLower), {
      readNotificationIds: nextRead.slice(-500),
      dismissedNotificationIds: nextDismissed.slice(-500),
      updatedAt: serverTimestamp(),
    }).catch((err) =>
      handleFirestoreError(err, OperationType.WRITE, `staff_notification_state/${emailLower}`)
    );
  };

  const markNotificationRead = (notificationId: string) => {
    if (readNotificationIds.includes(notificationId)) return;
    const nextRead = [...readNotificationIds, notificationId];
    setReadNotificationIds(nextRead);
    persistNotificationState(nextRead, dismissedNotificationIds);
  };

  const dismissNotification = (notificationId: string) => {
    if (dismissedNotificationIds.includes(notificationId)) return;
    const nextDismissed = [...dismissedNotificationIds, notificationId];
    setDismissedNotificationIds(nextDismissed);
    persistNotificationState(readNotificationIds, nextDismissed);
  };

  // ==================== Staff RBAC Management (Owner Only) ====================

  const createStaffAccount = async (payload: {
    name: string;
    username: string;
    email?: string;
    role: StaffRole;
    password?: string;
    mustChangePassword?: boolean;
    permissions: StaffPermissions;
  }) => {
    const actor = currentStaff;
    if (!actor || actor.role !== 'owner') {
      return { ok: false, error: 'إنشاء حسابات الموظفين صلاحية حصرية للمالك فقط' };
    }
    const rawEmail = (payload.email || payload.username).trim().toLowerCase();
    if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(rawEmail)) {
      return { ok: false, error: 'يرجى إدخال بريد إلكتروني صحيح (Google Email) للموظف' };
    }
    if (staffUsers.some((u) => (u.email || u.id).toLowerCase() === rawEmail)) {
      return { ok: false, error: 'هذا البريد مسجل بالفعل في طاقم المعرض' };
    }
    const targetRole: StaffRole = payload.role === 'owner' ? 'manager' : payload.role;
    const newStaff: StaffUser = {
      id: rawEmail,
      email: rawEmail,
      name: payload.name.trim(),
      username: rawEmail,
      role: targetRole,
      mustChangePassword: false,
      isActive: true,
      permissions: { ...payload.permissions, manageStaff: false },
      createdAt: new Date().toISOString(),
    };
    const firestorePayload = stripUndefined({
      id: newStaff.id,
      email: newStaff.email,
      name: newStaff.name,
      username: newStaff.username,
      role: newStaff.role,
      isActive: newStaff.isActive,
      permissions: newStaff.permissions,
      createdAt: newStaff.createdAt,
    });
    try {
      await setDoc(doc(db, 'staff_users', rawEmail), firestorePayload);
      await writeAuditLog(
        actor,
        'إضافة موظف / مدير',
        `إضافة (${newStaff.name} - ${rawEmail}) بدور (${targetRole})`,
        true
      );
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `staff_users/${rawEmail}`);
    }
  };

  const updateStaffAccount = async (
    staffId: string,
    updates: {
      name?: string;
      username?: string;
      role?: StaffRole;
      isActive?: boolean;
      permissions?: StaffPermissions;
      password?: string;
      mustChangePassword?: boolean;
    }
  ) => {
    const actor = currentStaff;
    if (!actor || actor.role !== 'owner') {
      return { ok: false, error: 'تعديل حسابات الموظفين صلاحية حصرية للمالك فقط' };
    }
    const targetUser = staffUsers.find((u) => u.id === staffId);
    if (!targetUser || targetUser.role === 'owner') {
      return { ok: false, error: 'لا يمكن تعديل هذا الحساب من هنا' };
    }
    const emailKey = (targetUser.email || targetUser.id).toLowerCase();
    const safeRole: StaffRole =
      updates.role && updates.role !== 'owner' ? updates.role : targetUser.role;
    const nextPayload = stripUndefined({
      id: emailKey,
      email: emailKey,
      name: updates.name !== undefined && updates.name.trim() ? updates.name.trim() : targetUser.name,
      username: targetUser.username || emailKey,
      role: safeRole,
      isActive: updates.isActive ?? targetUser.isActive,
      permissions: updates.permissions
        ? { ...updates.permissions, manageStaff: false }
        : targetUser.permissions,
      createdAt: targetUser.createdAt,
      lastLoginAt: targetUser.lastLoginAt,
    });
    try {
      await setDoc(doc(db, 'staff_users', emailKey), nextPayload);
      await writeAuditLog(
        actor,
        'تحديث بيانات وصلاحيات موظف',
        `تحديث حساب (${nextPayload.name}) بواسطة المالك`,
        true
      );
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_users/${emailKey}`);
    }
  };

  const deleteStaffAccount = (staffId: string) => {
    const actor = currentStaff;
    if (!actor || actor.role !== 'owner') {
      return { ok: false, error: 'حذف حسابات الموظفين صلاحية حصرية للمالك فقط' };
    }
    const target = staffUsers.find((u) => u.id === staffId);
    if (!target) return { ok: false, error: 'الحساب غير موجود' };
    const emailKey = (target.email || target.id).toLowerCase();
    if (target.role === 'owner' || emailKey === BOOTSTRAPPED_OWNER_EMAIL) {
      return { ok: false, error: 'لا يمكن حذف حساب المالك الرئيسي' };
    }
    void deleteDoc(doc(db, 'staff_users', emailKey))
      .then(() =>
        writeAuditLog(
          actor,
          'حذف حساب موظف',
          `حذف المالك حساب (${target.name} - ${emailKey}) نهائيًا`,
          true
        )
      )
      .catch((err) => handleFirestoreError(err, OperationType.DELETE, `staff_users/${emailKey}`));
    return { ok: true };
  };

  const updateOwnProfile = async (payload: { name: string; username: string }) => {
    const actor = currentStaff;
    if (!actor) return { ok: false, error: 'غير مسجل الدخول' };
    const emailKey = (actor.email || actor.id).toLowerCase();
    const cleanName = payload.name.trim() || actor.name;
    try {
      await updateDoc(doc(db, 'staff_users', emailKey), { name: cleanName });
      setCurrentStaff((prev) => (prev ? { ...prev, name: cleanName } : prev));
      await writeAuditLog(actor, 'تحديث الاسم الشخصي للمالك', `تحديث الاسم إلى (${cleanName})`, true);
      return { ok: true };
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `staff_users/${emailKey}`);
    }
  };

  // ==================== Backup Verification, Snapshots & Restore ====================

  const exportJsonBackup = () => {
    return JSON.stringify(
      {
        categories,
        products,
        banners,
        zones,
        coupons,
        orders,
        reviews,
        complaints,
        returnRequests,
        faqs,
        settings,
        staffUsers,
      },
      null,
      2
    );
  };

  const verifyBackupJson = (jsonString: string): BackupVerificationReport => {
    const checkedAt = new Date().toISOString();
    const errors: string[] = [];
    const warnings: string[] = [];
    const emptySummary = {
      products: 0,
      categories: 0,
      orders: 0,
      returns: 0,
      complaints: 0,
      coupons: 0,
      zones: 0,
      staff: 0,
      hasSettings: false,
    };

    try {
      const parsed = JSON.parse(jsonString) as Partial<PersistedState>;
      if (!parsed || typeof parsed !== 'object') {
        return {
          valid: false,
          errors: ['محتوى الملف ليس كائن JSON صالحًا.'],
          warnings: [],
          summary: emptySummary,
          checkedAt,
        };
      }
      if (!Array.isArray(parsed.categories)) {
        errors.push('بيانات الأقسام (categories) مفقودة أو غير صالحة.');
      }
      if (!Array.isArray(parsed.products)) {
        errors.push('بيانات المنتجات (products) مفقودة أو غير صالحة.');
      }
      if (!Array.isArray(parsed.orders)) {
        warnings.push('سجل الطلبات غير موجود وسيتم الإبقاء على الطلبات الحالية.');
      }
      if (!parsed.settings || typeof parsed.settings !== 'object') {
        warnings.push('إعدادات المتجر غير موجودة في النسخة وسيتم الإبقاء على الإعدادات الحالية.');
      }

      return {
        valid: errors.length === 0,
        errors,
        warnings,
        summary: {
          products: Array.isArray(parsed.products) ? parsed.products.length : 0,
          categories: Array.isArray(parsed.categories) ? parsed.categories.length : 0,
          orders: Array.isArray(parsed.orders) ? parsed.orders.length : 0,
          returns: Array.isArray(parsed.returnRequests) ? parsed.returnRequests.length : 0,
          complaints: Array.isArray(parsed.complaints) ? parsed.complaints.length : 0,
          coupons: Array.isArray(parsed.coupons) ? parsed.coupons.length : 0,
          zones: Array.isArray(parsed.zones) ? parsed.zones.length : 0,
          staff: Array.isArray(parsed.staffUsers) ? parsed.staffUsers.length : 0,
          hasSettings: Boolean(parsed.settings),
        },
        checkedAt,
      };
    } catch {
      return {
        valid: false,
        errors: ['تعذر قراءة ملف JSON — الملف تالف أو صيغته غير صحيحة.'],
        warnings: [],
        summary: emptySummary,
        checkedAt,
      };
    }
  };

  const importJsonBackup = (jsonString: string, scope: BackupRestoreScope = 'all') => {
    const actor = currentStaff;
    if (!actor) return { ok: false, error: 'يجب تسجيل الدخول بصلاحية الإدارة أولاً' };
    const check = verifyBackupJson(jsonString);
    if (!check.valid) {
      return { ok: false, error: check.errors[0] || 'صيغة ملف النسخة الاحتياطية غير صالحة' };
    }
    try {
      const parsed = JSON.parse(jsonString) as Partial<PersistedState>;
      void (async () => {
        try {
          const batch = writeBatch(db);
          if (scope === 'all' || scope === 'products') {
            for (const c of parsed.categories ?? []) {
              batch.set(doc(db, 'categories', c.id), stripUndefined(c));
            }
            for (const p of parsed.products ?? []) {
              batch.set(
                doc(db, 'products', p.id),
                stripUndefined({
                  ...p,
                  imageUrl: sanitizeImageForFirestore(p.imageUrl),
                  originalImageUrl: undefined,
                })
              );
            }
          }
          if (scope === 'all' || scope === 'settings') {
            if (parsed.settings) {
              batch.set(
                doc(db, 'settings', 'store'),
                stripUndefined(mergeSettingsWithDefaults(parsed.settings))
              );
            }
            for (const b of parsed.banners ?? []) {
              batch.set(
                doc(db, 'banners', b.id),
                stripUndefined({ ...b, imageUrl: sanitizeImageForFirestore(b.imageUrl) })
              );
            }
            for (const z of parsed.zones ?? []) {
              batch.set(doc(db, 'zones', z.id), stripUndefined(z));
            }
            for (const f of parsed.faqs ?? []) {
              batch.set(doc(db, 'faqs', f.id), stripUndefined(f));
            }
          }
          if (scope === 'all' || scope === 'orders') {
            for (const o of parsed.orders ?? []) {
              batch.set(
                doc(db, 'orders', o.id),
                stripUndefined({ ...o, serverCreatedAt: serverTimestamp() })
              );
              const tKey = `${o.orderNumber.toUpperCase()}_${o.customerPhone.replace(/[^0-9]/g, '')}`;
              batch.set(doc(db, 'order_tracking', tKey), buildTrackingPayload(o));
            }
            for (const r of parsed.returnRequests ?? []) {
              batch.set(
                doc(db, 'return_requests', r.id),
                stripUndefined({ ...r, serverCreatedAt: serverTimestamp() })
              );
              const rtKey = `${r.returnCode}_${r.customerPhone.replace(/[^0-9]/g, '')}`;
              batch.set(doc(db, 'return_tracking', rtKey), buildReturnTrackingPayload(r));
            }
          }
          await batch.commit();
          await writeAuditLog(
            actor,
            'استعادة نسخة احتياطية سحابية',
            `تم تنفيذ استعادة (${scope}) إلى قاعدة البيانات بنجاح.`,
            true
          );
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'backup-restore');
        }
      })();
      return { ok: true };
    } catch {
      return { ok: false, error: 'تعذر معالجة ملف النسخة الاحتياطية' };
    }
  };

  const createBackupSnapshot = (label?: string, kind: 'auto' | 'manual' = 'manual') => {
    const nowIso = new Date().toISOString();
    const snapId = `snap-${kind}-${Date.now()}`;
    const snap: BackupSnapshot = {
      id: snapId,
      label:
        label?.trim() ||
        `${kind === 'auto' ? 'نسخة دورية' : 'نسخة يدوية'} — ${new Date(nowIso).toLocaleString(
          'ar-EG'
        )}`,
      kind,
      createdAt: nowIso,
      createdBy: currentStaff?.name ?? 'الإدارة',
      stats: {
        products: products.length,
        categories: categories.length,
        orders: orders.length,
        returns: returnRequests.length,
        complaints: complaints.length,
        staff: staffUsers.length,
      },
      payloadJson: exportJsonBackup(),
    };
    void setDoc(doc(db, 'backup_snapshots', snapId), stripUndefined(snap)).catch((err) =>
      handleFirestoreError(err, OperationType.CREATE, `backup_snapshots/${snapId}`)
    );
    if (currentStaff) {
      void writeAuditLog(
        currentStaff,
        'إنشاء نسخة احتياطية سحابية',
        `تم حفظ لقطة احتياطية (${snap.label})`
      );
    }
    return snap;
  };

  const restoreFromSnapshot = (snapshotId: string, scope: BackupRestoreScope = 'all') => {
    const target = backupSnapshots.find((s) => s.id === snapshotId);
    if (!target) return { ok: false, error: 'لم يتم العثور على النسخة المحفوظة' };
    return importJsonBackup(target.payloadJson, scope);
  };

  const deleteBackupSnapshot = (snapshotId: string) => {
    void deleteDoc(doc(db, 'backup_snapshots', snapshotId)).catch((err) =>
      handleFirestoreError(err, OperationType.DELETE, `backup_snapshots/${snapshotId}`)
    );
  };

  // ==================== Notifications Engine ====================

  const notifications = useMemo<AdminNotification[]>(() => {
    if (!currentStaff) return [];
    const list: AdminNotification[] = [];
    const now = Date.now();
    const delayMs = Math.max(15, settings.delayedOrderThresholdMinutes || 60) * 60 * 1000;

    for (const ord of orders) {
      if (ord.status === 'طلب جديد') {
        list.push({
          id: `notif-new-order-${ord.id}`,
          category: 'new_order',
          severity: 'high',
          title: `طلب جديد: ${ord.orderNumber}`,
          message: `العميل ${ord.customerName} (${ord.zoneName}) — ${ord.items.length} أصناف بانتظار المراجعة.`,
          createdAt: ord.createdAt,
          targetSection: 'orders',
          targetEntityId: ord.id,
          requiredPermissions: ['manageOrders'],
        });
      }
      const isClosed = ord.status === 'تم التسليم' || ord.status === 'ملغي';
      const ageMs = now - new Date(ord.createdAt).getTime();
      if (!isClosed && ageMs > delayMs) {
        const mins = Math.round(ageMs / 60000);
        list.push({
          id: `notif-delay-order-${ord.id}`,
          category: 'delayed_order',
          severity: 'high',
          title: `طلب تأخر عن موعده: ${ord.orderNumber}`,
          message: `مرّ ${mins} دقيقة على الطلب وحالته ما زالت «${ord.status}» — يرجى المتابعة.`,
          createdAt: ord.createdAt,
          targetSection: 'orders',
          targetEntityId: ord.id,
          requiredPermissions: ['manageOrders'],
        });
      }
    }

    for (const comp of complaints) {
      if (comp.status === 'جديد') {
        list.push({
          id: `notif-comp-${comp.id}`,
          category: 'new_complaint',
          severity: comp.type === 'شكوى' ? 'high' : 'medium',
          title: `${comp.type === 'شكوى' ? 'شكوى جديدة' : 'مقترح جديد'} من ${comp.customerName}`,
          message: comp.message,
          createdAt: comp.createdAt,
          targetSection: 'delivery',
          targetEntityId: comp.id,
          requiredPermissions: ['manageDelivery', 'manageReviews', 'manageOrders'],
        });
      }
    }

    for (const ret of returnRequests) {
      if (ret.status === 'جديد') {
        list.push({
          id: `notif-ret-${ret.id}`,
          category: 'new_return',
          severity: 'high',
          title: `طلب ${ret.requestType} جديد (${ret.returnCode})`,
          message: `طلب ${ret.orderNumber} — ${ret.productName} (${ret.customerName})`,
          createdAt: ret.createdAt,
          targetSection: 'returns',
          targetEntityId: ret.id,
          requiredPermissions: ['manageOrders', 'manageDelivery'],
        });
      }
    }

    for (const prod of products) {
      if (prod.stockQty <= prod.lowStockThreshold || prod.availability !== 'متوفر') {
        list.push({
          id: `notif-stock-${prod.id}-${prod.stockQty}`,
          category: 'low_stock',
          severity: prod.stockQty <= 0 || prod.availability === 'غير متوفر' ? 'high' : 'medium',
          title:
            prod.stockQty <= 0 || prod.availability === 'غير متوفر'
              ? `نفد من المخزون: ${prod.name}`
              : `منتج أوشك على النفاد: ${prod.name}`,
          message: `الكمية المتبقية: ${prod.stockQty} (الحد الأدنى للتنبيه: ${prod.lowStockThreshold})`,
          createdAt: prod.createdAt,
          targetSection: 'products',
          targetEntityId: prod.id,
          requiredPermissions: ['manageProducts'],
        });
      }
    }

    for (const prod of products) {
      if (prod.isOffer && prod.offerExpiresAt && new Date(prod.offerExpiresAt).getTime() <= now) {
        list.push({
          id: `notif-offer-exp-prod-${prod.id}-${prod.offerExpiresAt}`,
          category: 'expired_offer',
          severity: 'medium',
          title: `انتهى عرض المنتج: ${prod.name}`,
          message: 'انتهت مدة العرض المحددة (3 أيام) ويمكنك تجديده أو إيقافه من قسم العروض.',
          createdAt: prod.offerExpiresAt,
          targetSection: 'offers',
          targetEntityId: prod.id,
          requiredPermissions: ['manageOffers'],
        });
      }
    }

    for (const ban of banners) {
      if (
        ban.isOfferBanner &&
        ban.isActive &&
        ban.offerExpiresAt &&
        new Date(ban.offerExpiresAt).getTime() <= now
      ) {
        list.push({
          id: `notif-offer-exp-ban-${ban.id}-${ban.offerExpiresAt}`,
          category: 'expired_offer',
          severity: 'medium',
          title: `انتهى عرض البانر: ${ban.title}`,
          message: 'انتهت مدة بانر العرض، يرجى تجديده لـ 3 أيام أو إيقافه.',
          createdAt: ban.offerExpiresAt,
          targetSection: 'homepage',
          targetEntityId: ban.id,
          requiredPermissions: ['manageOffers', 'manageHomepage'],
        });
      }
    }

    const dismissedSet = new Set(dismissedNotificationIds);
    return list
      .filter((n) => {
        if (dismissedSet.has(n.id)) return false;
        if (currentStaff.role === 'owner') return true;
        return n.requiredPermissions.some((perm) => currentStaff.permissions[perm]);
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [
    currentStaff,
    orders,
    complaints,
    returnRequests,
    products,
    banners,
    settings.delayedOrderThresholdMinutes,
    dismissedNotificationIds,
  ]);

  const unreadNotificationsCount = useMemo(() => {
    const readSet = new Set(readNotificationIds);
    return notifications.filter((n) => !readSet.has(n.id)).length;
  }, [notifications, readNotificationIds]);

  const markAllNotificationsRead = () => {
    const merged = Array.from(new Set([...readNotificationIds, ...notifications.map((n) => n.id)]));
    setReadNotificationIds(merged);
    persistNotificationState(merged, dismissedNotificationIds);
  };

  const resetDemoWorkspace = () => {
    if (!currentStaff || currentStaff.role !== 'owner') return;
    void ensureCatalogSeeded(currentStaff);
  };

  return (
    <TabaContext.Provider
      value={{
        categories,
        products,
        banners,
        zones,
        coupons,
        orders,
        reviews,
        complaints,
        returnRequests,
        faqs,
        settings,
        auditLog,
        staffUsers,
        cart,
        favorites,
        readNotificationIds,
        dismissedNotificationIds,
        currentView,
        setCurrentView,
        currentStaff,
        authReady,
        authError,
        isCloudLoading,
        notifications,
        unreadNotificationsCount,
        backupSnapshots,
        loginWithGoogle,
        loginStaff,
        loginDemoRole,
        logoutStaff,
        changeOwnPassword,
        addToCart,
        updateCartQty,
        removeFromCart,
        clearCart,
        toggleFavorite,
        clearFavorites,
        reorderIntoCart,
        validateCouponForCart,
        validateCouponAsync,
        submitOrder,
        fetchOrderTracking,
        fetchOrdersByPhone,
        trackOrderPrivate,
        getOrdersByPhone,
        customerEditOrder,
        customerCancelOrder,
        customerRespondSubstitute,
        submitProductReview,
        submitComplaint,
        submitReturnRequest,
        fetchReturnTracking,
        trackReturnRequests,
        updateOrderByStaff,
        updateOrderItemsAndFeeByStaff,
        proposeSubstituteItem,
        saveProduct,
        deleteProduct,
        addCategory,
        renameCategory,
        updateCategoryDetails,
        moveCategory,
        deleteCategory,
        saveBanner,
        addBanner,
        deleteBanner,
        moveBanner,
        renewBannerOfferThreeDays,
        renewProductOfferThreeDays,
        applyBulkOffer,
        saveCoupon,
        deleteCoupon,
        saveZone,
        deleteZone,
        updateSettings,
        saveFaq,
        deleteFaq,
        moderateReview,
        updateComplaintStatus,
        updateReturnRequestStatus,
        updateReturnRequestDetails,
        createStaffReturnRequest,
        restockReturnedItem,
        markNotificationRead,
        markAllNotificationsRead,
        dismissNotification,
        createStaffAccount,
        updateStaffAccount,
        deleteStaffAccount,
        updateOwnProfile,
        exportJsonBackup,
        verifyBackupJson,
        importJsonBackup,
        createBackupSnapshot,
        restoreFromSnapshot,
        deleteBackupSnapshot,
        resetDemoWorkspace,
      }}
    >
      {children}
    </TabaContext.Provider>
  );
};

export function useTaba() {
  const ctx = useContext(TabaContext);
  if (!ctx) throw new Error('useTaba must be used inside TabaProvider');
  return ctx;
}
