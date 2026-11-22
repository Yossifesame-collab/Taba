export type AvailabilityStatus = 'متوفر' | 'كمية محدودة' | 'غير متوفر';

export type OrderStatus =
  | 'طلب جديد'
  | 'تم التأكيد'
  | 'جاري التجهيز'
  | 'خرج للتوصيل'
  | 'تم التسليم'
  | 'ملغي';

export type StaffRole = 'owner' | 'manager' | 'employee';

export interface StaffPermissions {
  manageProducts: boolean;
  manageOrders: boolean;
  cancelOrders: boolean;
  manageOffers: boolean;
  manageHomepage: boolean;
  manageDelivery: boolean;
  manageReviews: boolean;
  viewReports: boolean;
  manageStaff: boolean;
  viewAuditLog: boolean;
}

export interface StaffUser {
  id: string;
  email?: string;
  name: string;
  username: string;
  role: StaffRole;
  passwordHash?: string;
  mustChangePassword: boolean;
  isActive: boolean;
  permissions: StaffPermissions;
  createdAt: string;
  lastLoginAt?: string;
}

export interface Category {
  id: string;
  name: string;
  sortOrder: number;
  iconKey?: ProductVisualKind;
}

export type ProductVisualKind =
  | 'tissue'
  | 'detergent'
  | 'plastic'
  | 'kitchenware'
  | 'personalcare';

export interface Product {
  id: string;
  name: string;
  shortDescription: string;
  categoryId: string;
  availability: AvailabilityStatus;
  stockQty: number;
  lowStockThreshold: number;
  internalPrice: number; // Strictly hidden from storefront unless enabled by admin
  isNew: boolean;
  isOffer: boolean;
  offerStartsAt?: string;
  offerExpiresAt?: string; // 3-day offer expiry ISO timestamp
  isFeaturedPick: boolean; // ترشيحات طابا
  requestCount: number; // الأكثر طلبًا
  isVisible: boolean;
  visualKind: ProductVisualKind;
  imageUrl?: string; // Compressed WebP DataURL or asset path
  originalImageUrl?: string; // Optional retained original image when requested
  createdAt: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  badgeText?: string;
  ctaText: string;
  targetCategoryId?: string;
  sortOrder: number;
  slideDurationSec: number; // Independent display duration (e.g. 4-5 sec)
  isOfferBanner: boolean;
  offerStartsAt?: string;
  offerExpiresAt?: string; // Independent 3-day offer expiry
  isActive: boolean;
  themeTone: 'blue' | 'navy' | 'crimson' | 'slate';
  imageUrl?: string;
}

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  minOrderNote: string;
  minItemsCount: number;
  isActive: boolean;
  deliveryHours: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  discountType: 'percent' | 'fixed';
  discountValue: number;
  minItemsCount: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface SubstituteProposal {
  productId: string;
  productName: string;
  note: string;
  status: 'pending' | 'accepted' | 'rejected';
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  internalUnitPrice: number; // Visible only inside /admin unless store pricing enabled
  substitute?: SubstituteProposal;
}

export interface OrderHistoryEntry {
  id: string;
  oldStatus: OrderStatus | 'إنشاء الطلب';
  newStatus: OrderStatus;
  changedAt: string;
  changedBy: string;
  notes: string;
}

export type AddressPlaceType = 'شقة' | 'منزل عائلة' | 'محل / شركة';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  zoneId: string;
  zoneName: string;
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
  deliveryFee: number;
  reviewedDiscount: number;
  reviewedTotal?: number;
  priceReviewedByStaff: boolean;
  customerApprovedTotal: boolean;
  paymentMethod: 'الدفع عند الاستلام';
  status: OrderStatus;
  cancellationReason?: string;
  items: OrderItem[];
  history: OrderHistoryEntry[];
  createdAt: string;
  idempotencyKey?: string;
}

export interface ProductReview {
  id: string;
  productId: string;
  productName: string;
  customerName: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface ComplaintSuggestion {
  id: string;
  type: 'شكوى' | 'مقترح';
  customerName: string;
  customerPhone: string;
  orderNumber?: string;
  message: string;
  status: 'جديد' | 'قيد المراجعة' | 'تم الحل';
  adminReply?: string;
  createdAt: string;
}

export type ReturnedItemCondition = 'سليم بغلافه' | 'تالف / عيب صناعة' | 'مفتوح';

export interface ReturnedProductEntry {
  productId?: string;
  productName: string;
  quantity: number;
  condition: ReturnedItemCondition;
  restocked?: boolean;
}

export type ReturnRequestStatus =
  | 'جديد'
  | 'قيد المراجعة'
  | 'بانتظار استلام المنتج'
  | 'تمت الموافقة'
  | 'تم الاستبدال / الاسترجاع'
  | 'مرفوض';

export interface ReturnRequest {
  id: string;
  returnCode: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  returnedItems: ReturnedProductEntry[];
  requestType: 'استبدال' | 'استرجاع';
  reason: string;
  status: ReturnRequestStatus;
  assignedStaffId?: string;
  assignedStaffName?: string;
  adminNote?: string;
  createdAt: string;
  updatedAt?: string;
}

export type NotificationCategory =
  | 'new_order'
  | 'delayed_order'
  | 'new_complaint'
  | 'new_return'
  | 'low_stock'
  | 'expired_offer'
  | 'system_backup';

export interface AdminNotification {
  id: string;
  category: NotificationCategory;
  severity: 'high' | 'medium' | 'info';
  title: string;
  message: string;
  createdAt: string;
  targetSection: string;
  targetEntityId?: string;
  requiredPermissions: (keyof StaffPermissions)[];
}

export interface BackupSnapshot {
  id: string;
  label: string;
  kind: 'auto' | 'manual';
  createdAt: string;
  createdBy: string;
  stats: {
    products: number;
    categories: number;
    orders: number;
    returns: number;
    complaints: number;
    staff: number;
  };
  payloadJson: string;
}

export interface BackupVerificationReport {
  valid: boolean;
  errors: string[];
  warnings: string[];
  summary: {
    products: number;
    categories: number;
    orders: number;
    returns: number;
    complaints: number;
    coupons: number;
    zones: number;
    staff: number;
    hasSettings: boolean;
  };
  checkedAt: string;
}

export interface AuditLogEntry {
  id: string;
  actorName: string;
  actorRole: string;
  action: string;
  details: string;
  timestamp: string;
  isSecurityEvent?: boolean;
}

export interface SocialLinks {
  websiteUrl: string;
  facebookUrl: string;
  messengerUrl: string;
  instagramUrl: string;
  tiktokUrl: string;
  googleMapsUrl: string;
}

export type SiteThemePreset = 'royal-blue' | 'deep-navy' | 'ocean-blue' | 'crimson-blue';

export interface SiteThemeConfig {
  colorPreset: SiteThemePreset;
  cardRadius: 'soft' | 'rounded' | 'sharp';
  desktopColumns: 3 | 4 | 5;
  headerStyle: 'curved-arch' | 'compact-bar';
  showTopNoticeBar: boolean;
  topNoticeText: string;
  showHeaderSocials: boolean;
  showSearchBar: boolean;
  showBanners: boolean;
  showCategoriesStrip: boolean;
  showSpecialOffersTile: boolean;
  showNewestSection: boolean;
  showMostRequestedSection: boolean;
  showFeaturedSection: boolean;
  showDeliverySection: boolean;
  showSupportHub: boolean;
  showFavoritesButton: boolean;
  showCartButton: boolean;
  showDarkModeToggle: boolean;
  showAdminLinkToCustomers: boolean;
  showPricesOnStore: boolean;
}

export interface StorefrontCopyConfig {
  headerMotto: string;
  footerMotto: string;
  copyrightText: string;
  searchPlaceholder: string;
  allCategoryLabel: string;
  specialOffersTileLabel: string;
  categoriesSectionTitle: string;
  newestSectionTitle: string;
  mostRequestedSectionTitle: string;
  featuredSectionTitle: string;
  deliverySectionTitle: string;
  supportSectionTitle: string;
  cartNoticeText: string;
  orderSuccessTitle: string;
  orderSuccessSubtitle: string;
  orderWhatsappCtaText: string;
}

export interface StoreSettings {
  isAcceptingOrders: boolean;
  pauseMessage: string;
  isMaintenanceMode: boolean;
  maintenanceTitle: string;
  maintenanceMessage: string;
  maintenanceExpectedReturn: string;
  maintenanceAllowTracking: boolean;
  maintenanceAllowWhatsApp: boolean;
  delayedOrderThresholdMinutes: number;
  autoBackupEnabled: boolean;
  autoBackupIntervalHours: number;
  lastAutoBackupAt?: string;
  dailyOrderHours: string;
  holidaysNote: string;
  whatsappNumber: string;
  storeTagline: string;
  storeLocation: string;
  brandLogoUrl: string;
  aboutUsText: string;
  homeSectionOrder: ('newest' | 'mostRequested' | 'featured')[];
  isTrialMode: boolean;
  allowTrialQuickLogin: boolean;
  allowCustomerOrderEdit: boolean;
  allowCustomerOrderCancel: boolean;
  allowProductReviews: boolean;
  splashEnabled: boolean;
  splashTitle: string;
  splashSubtitle: string;
  splashButtonText: string;
  socialLinks: SocialLinks;
  theme: SiteThemeConfig;
  copy: StorefrontCopyConfig;
  returnPolicyText: string;
  privacyPolicyText: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}
