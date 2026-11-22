import { Order } from '../types/taba';

export const TABA_WHATSAPP_LOCAL = '01032771185';
export const TABA_WHATSAPP_INTL = '201032771185';

export function formatEgyptWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (!digits) return TABA_WHATSAPP_INTL;
  if (digits.startsWith('20')) return digits;
  if (digits.startsWith('0')) return `20${digits.slice(1)}`;
  return `20${digits}`;
}

export function buildProductInquiryWhatsAppUrl(
  productName: string,
  categoryName?: string,
  storePhone: string = TABA_WHATSAPP_LOCAL
): string {
  const text = [
    'السلام عليكم، أستفسر عن سعر وتوفر المنتج التالي من معرض طابا:',
    `المنتج: ${productName}`,
    categoryName ? `القسم: ${categoryName}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const targetIntl = formatEgyptWhatsAppNumber(storePhone);
  return `https://wa.me/${targetIntl}?text=${encodeURIComponent(text)}`;
}

export function buildGeneralWhatsAppUrl(
  customMessage?: string,
  storePhone: string = TABA_WHATSAPP_LOCAL
): string {
  const text = customMessage ?? 'السلام عليكم، أود التواصل مع معرض طابا بخصوص طلب.';
  const targetIntl = formatEgyptWhatsAppNumber(storePhone);
  return `https://wa.me/${targetIntl}?text=${encodeURIComponent(text)}`;
}

export function buildOrderTotalInquiryWhatsAppUrl(
  order: Order,
  storePhone: string = TABA_WHATSAPP_LOCAL
): string {
  const itemsSummary = order.items
    .map((item) => `- ${item.productName} × ${item.quantity}`)
    .join('\n');

  const lines = [
    'السلام عليكم، أود الاستفسار عن السعر الإجمالي (التوتال) وتأكيد طلبي من معرض طابا:',
    `كود الاستفسار / رقم الطلب: ${order.orderNumber}`,
    `الاسم: ${order.customerName}`,
    `رقم الهاتف: ${order.customerPhone}`,
    `منطقة التوصيل: ${order.zoneName}`,
    `العنوان: ${order.detailedAddress}`,
    order.couponCode ? `كوبون الخصم المسجل: ${order.couponCode}` : '',
    '',
    'الأصناف المطلوبة:',
    itemsSummary,
    '',
    'برجاء مراجعة التوفر وإبلاغي بالسعر التوتال النهائي وموعد التوصيل.',
  ].filter((line) => line !== undefined);

  const targetIntl = formatEgyptWhatsAppNumber(storePhone);
  return `https://wa.me/${targetIntl}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildStaffOrderUpdateWhatsAppUrl(order: Order): string {
  const customerWa = formatEgyptWhatsAppNumber(order.customerPhone);
  const itemsSummary = order.items
    .map((item) => `- ${item.productName} × ${item.quantity}`)
    .join('\n');

  const lines = [
    `مرحبًا ${order.customerName}، معك فريق معرض طابا بخصوص طلبك رقم ${order.orderNumber}`,
    `الحالة الحالية للطلب: ${order.status}`,
    `رقم العميل المسجل: ${order.customerPhone}`,
    '',
    'المنتجات:',
    itemsSummary,
    '',
    order.reviewedTotal !== undefined
      ? `الإجمالي النهائي بعد مراجعة الأسعار والتوصيل${
          order.reviewedDiscount > 0 ? ` وخصم (${order.reviewedDiscount} ج.م)` : ''
        }: ${order.reviewedTotal} ج.م`
      : 'جاري مراجعة الأسعار النهائية والتوصيل وسنوافيك بالإجمالي لتأكيد الطلب.',
    '',
    'يرجى الرد بالموافقة لإتمام التجهيز والشحن. شكرًا لاختيارك معرض طابا.',
  ];

  return `https://wa.me/${customerWa}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildQuickWhatsAppProductOrderUrl(
  productName: string,
  quantity: number,
  categoryName?: string,
  storePhone: string = TABA_WHATSAPP_LOCAL
): string {
  const lines = [
    'السلام عليكم، أرغب في عمل *طلب سريع* من معرض طابا:',
    `المنتج: ${productName}`,
    categoryName ? `القسم: ${categoryName}` : '',
    `الكمية المطلوبة: ${quantity}`,
    '',
    'برجاء تأكيد التوفر والسعر الإجمالي والتوصيل.',
  ].filter(Boolean);

  const targetIntl = formatEgyptWhatsAppNumber(storePhone);
  return `https://wa.me/${targetIntl}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export function buildQuickWhatsAppCartOrderUrl(
  items: Array<{ productName: string; quantity: number }>,
  zoneName?: string,
  storePhone: string = TABA_WHATSAPP_LOCAL
): string {
  const summary = items.map((i) => `- ${i.productName} × ${i.quantity}`).join('\n');
  const lines = [
    'السلام عليكم، أرغب في *طلب سريع عبر واتساب* للأصناف التالية من معرض طابا:',
    '',
    summary,
    '',
    zoneName ? `منطقة التوصيل المفضلة: ${zoneName}` : '',
    'برجاء مراجعة السعر التوتال وتأكيد موعد التوصيل.',
  ].filter((l) => l !== '');

  const targetIntl = formatEgyptWhatsAppNumber(storePhone);
  return `https://wa.me/${targetIntl}?text=${encodeURIComponent(lines.join('\n'))}`;
}
