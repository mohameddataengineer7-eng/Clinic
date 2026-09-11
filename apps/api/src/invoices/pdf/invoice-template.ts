import { CLINIC_LOGO_BASE64 } from './clinic-logo';
import { Decimal } from '@prisma/client/runtime/library';

// ─────────────────────────────────────────────────────────────────────────
// SCOPE NOTE: this file is a drop-in replacement for the invoice template
// ONLY. The exported interface (InvoicePdfData), the locale type, and the
// renderInvoiceHtml/buildWhatsAppShareUrl function signatures are UNCHANGED
// on purpose, so nothing else in the app (controller, service, frontend
// callers) needs to change. Swap this file in place of the old one.
// ─────────────────────────────────────────────────────────────────────────

// Loose shape matching InvoicesService.findOne()'s include (invoiceItems + service.code,
// patient, visit + diagnosis, payments). Kept local (rather than importing Prisma's
// generated types) so this template has no dependency beyond the plain data it's handed.
export interface InvoicePdfData {
  invoiceNumber: string;
  status: 'DRAFT' | 'ISSUED' | 'VOID';
  subtotal: number | string | Decimal;
  total: number | string | Decimal;
  paid: number | string | Decimal;
  remaining: number | string | Decimal;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  issuedAt?: string | Date | null;
  createdAt: string | Date;
  replacedByInvoiceId?: string | null;
  patient: {
    fullNameAr: string;
    civilId: string | null;
    phone?: string | null;
  };
  visit?: {
    type: 'CHECKUP' | 'FOLLOW_UP' | 'OTHER';
    diagnosis?: string | null;
  } | null;
  invoiceItems: Array<{
    serviceNameSnapshot: string;
    unitPriceSnapshot: number | string | Decimal;
    quantity: number;
    lineTotal: number | string | Decimal;
    service?: { code: string | null } | null;
  }>;
  additionalCharges?: Array<{
    chargeType: 'PERCENTAGE' | 'FIXED';
    chargeValue: number | string | Decimal;
    calculatedAmount: number | string | Decimal;
    description?: string | null;
  }>;
  payments: Array<{
    amount: number | string | Decimal;
    method: 'CASH' | 'VISA' | 'KNET' | 'OTHER';
    paymentDate: string | Date;
    status?: 'RECORDED' | 'REVERSED';
  }>;
}

// Locale still only controls the DYNAMIC labels/values (section headers,
// table headers, statuses, direction) exactly like before — that behavior
// is unchanged. What's new (per the redesign brief) is that the clinic's
// FIXED identity block (clinic name, doctor, address/phone) now always
// prints bilingually (Arabic + English together), regardless of locale,
// to match the reference design. See FIXED_BILINGUAL below.
export type InvoiceLocale = 'ar' | 'en';

// ── Fixed clinic identity — always bilingual, regardless of locale ──
const FIXED_BILINGUAL = {
  clinicNameAr: 'مركز العيادات التخصصية',
  clinicNameEn: 'Specialized Clinics Center',
  doctorNameAr: 'د. نداء بوخضور',
  doctorNameEn: 'Dr. Nada Bokhdour',
  doctorTitleAr: 'استشاري أمراض النساء والولادة والعقم',
  doctorTitleEn: 'Consultant Obstetrics, Gynecology & Infertility',
  addressLine1Ar: 'حولي - قطعة 4 - شارع المعتصم',
  addressLine1En: 'Hawally - Block 4 - Al-Moatasem Street',
  addressLine2Ar: 'الدور السادس',
  addressLine2En: '6th Floor',
  phoneAr: 'هاتف: 22650700 داخلي 607',
  phoneEn: 'Tel: 22650700 Ext. 607',
  mobileAr: 'موبايل وواتساب: 60008977',
  mobileEn: 'Mobile & WhatsApp: 60008977',
};

// ── UI copy per locale (dynamic labels only — unchanged behavior) ──
const T = {
  ar: {
    invoiceTitle: 'فاتورة',
    invoiceNo: 'رقم الفاتورة',
    date: 'التاريخ',
    patientInfoTitle: 'بيانات المريضة',
    patientName: 'اسم المريضة',
    visitType: 'نوع الزيارة',
    civilId: 'الرقم المدني',
    diagnosis: 'التشخيص',
    mobileNumber: 'رقم الموبايل',
    doctor: 'الطبيبة',
    service: 'الخدمة',
    code: 'الكود',
    qty: 'الكمية',
    unitPrice: 'سعر الوحدة (د.ك)',
    total: 'الإجمالي (د.ك)',
    subtotal: 'المجموع الفرعي',
    additionalCharges: 'رسوم إضافية',
    paid: 'المدفوع',
    remaining: 'المتبقي',
    paymentStatus: 'حالة الدفع',
    paymentMethod: 'طريقة الدفع',
    thanks: 'شكرًا لاختياركم عيادتنا',
    replacementNote: 'تم استبدال هذه الفاتورة. راجع الفاتورة البديلة للتفاصيل الحالية.',
    visitTypeLabels: { CHECKUP: 'كشف', FOLLOW_UP: 'متابعة', OTHER: 'أخرى' },
    paymentStatusLabels: { UNPAID: 'غير مدفوعة', PARTIALLY_PAID: 'مدفوعة جزئيًا', PAID: 'مدفوعة بالكامل' },
    paymentMethodLabels: { CASH: 'نقدًا', VISA: 'فيزا', KNET: 'كي نت', OTHER: 'أخرى' },
    chargeDefault: 'رسوم إضافية',
    dash: '—',
  },
  en: {
    invoiceTitle: 'INVOICE',
    invoiceNo: 'Invoice No.',
    date: 'Date',
    patientInfoTitle: 'Patient Information',
    patientName: 'Patient Name',
    visitType: 'Visit Type',
    civilId: 'Civil ID',
    diagnosis: 'Diagnosis',
    mobileNumber: 'Mobile',
    doctor: 'Doctor',
    service: 'Service',
    code: 'Code',
    qty: 'QTY',
    unitPrice: 'Unit Price (KD)',
    total: 'Total (KD)',
    subtotal: 'Subtotal',
    additionalCharges: 'Additional Charges',
    paid: 'Paid',
    remaining: 'Remaining',
    paymentStatus: 'Payment Status',
    paymentMethod: 'Payment Method',
    thanks: 'Thank you for choosing our clinic',
    replacementNote: 'This invoice has been replaced. See replacement invoice for current details.',
    visitTypeLabels: { CHECKUP: 'Checkup', FOLLOW_UP: 'Follow-up', OTHER: 'Other' },
    paymentStatusLabels: { UNPAID: 'Unpaid', PARTIALLY_PAID: 'Partially Paid', PAID: 'Paid in Full' },
    paymentMethodLabels: { CASH: 'Cash', VISA: 'Visa', KNET: 'KNET', OTHER: 'Other' },
    chargeDefault: 'Additional Charge',
    dash: '—',
  },
} as const;

function formatMoney(value: number | string | Decimal): string {
  return new Decimal(String(value)).toDecimalPlaces(2).toFixed(2);
}

function formatDate(value: string | Date): string {
  const d = new Date(value);
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Inline SVG icons (stroke-based, no external font needed in headless Chromium) ──
const ICON_PATHS: Record<string, string> = {
  document:
    '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>',
  calendar:
    '<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  clipboard:
    '<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/>',
  card: '<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  heart:
    '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>',
  phone:
    '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
  stethoscope: '<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
  wallet:
    '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
  mapPin: '<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',
  checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
  message:
    '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
};

function icon(name: keyof typeof ICON_PATHS, size = 14, strokeWidth = 1.8): string {
  return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

// Decorative maternal-care motif used in the footer band. This is a second,
// purely decorative image (NOT the clinic's official logo, which is still
// CLINIC_LOGO_BASE64 imported above and used in the header as before).
const MATERNAL_ICON_BASE64 =
  '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';

export function renderInvoiceHtml(invoice: InvoicePdfData, locale: InvoiceLocale = 'ar'): string {
  const t = T[locale];
  const isRtl = locale === 'ar';
  const dir = isRtl ? 'rtl' : 'ltr';

  const itemsRows = invoice.invoiceItems
    .map(
      (item) => `
        <tr>
          <td class="col-service">${escapeHtml(item.serviceNameSnapshot)}</td>
          <td class="col-code">${item.service?.code ? escapeHtml(item.service.code) : t.dash}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-price">${formatMoney(item.unitPriceSnapshot)}</td>
          <td class="col-total">${formatMoney(item.lineTotal)}</td>
        </tr>`,
    )
    .join('');

  const chargesRows = (invoice.additionalCharges || [])
    .map((charge) => {
      const chargeLabel = charge.description ? escapeHtml(charge.description) : t.chargeDefault;
      const priceDisplay =
        charge.chargeType === 'PERCENTAGE' ? formatMoney(charge.chargeValue) + '%' : formatMoney(charge.chargeValue);
      return `
        <tr class="charge-row">
          <td class="col-service">${chargeLabel}</td>
          <td class="col-code">${t.dash}</td>
          <td class="col-qty">1</td>
          <td class="col-price">${priceDisplay}</td>
          <td class="col-total">${formatMoney(charge.calculatedAmount)}</td>
        </tr>`;
    })
    .join('');

  const totalAdditionalCharges = (invoice.additionalCharges || []).reduce(
    (sum, c) => sum + Number(c.calculatedAmount),
    0,
  );

  const lastPayment = invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null;

  const voidWatermark = invoice.status === 'VOID' ? `<div class="watermark">VOID</div>` : '';

  const replacementNote = invoice.replacedByInvoiceId
    ? `<div class="replacement-note">${t.replacementNote}</div>`
    : '';

  const visitTypeLabel = invoice.visit ? t.visitTypeLabels[invoice.visit.type] : t.dash;
  const diagnosis = invoice.visit?.diagnosis ? escapeHtml(invoice.visit.diagnosis) : t.dash;

  return `
<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
<meta charset="UTF-8" />
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  html, body {
    font-family: ${isRtl ? "'Noto Naskh Arabic', 'Noto Sans Arabic', Arial, sans-serif" : "Arial, 'Noto Sans Arabic', sans-serif"};
    color: #1F2430;
    margin: 0;
    padding: 0;
    background: #FFFFFF;
  }
  .ico { display: inline-block; vertical-align: middle; flex-shrink: 0; }
  .page {
    position: relative;
    padding: 10px 20px 0;
    border: 1px solid #111844;
    margin: 3px;
    overflow: hidden;
  }
  .watermark {
    position: fixed; top: 40%; left: 0; right: 0; text-align: center;
    font-size: 96px; font-weight: bold; color: #C4362B; opacity: 0.15;
    transform: rotate(-25deg); z-index: 10;
  }

  /* ── Header ── */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 6px;
    border-bottom: 2px solid #111844;
    margin-bottom: 8px;
  }
  .brand-row { display: flex; align-items: center; gap: 8px; }
  .brand-row .logo { width: 42px; height: 42px; flex-shrink: 0; }
  .brand-name-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 15px; font-weight: bold; color: #111844;
  }
  .brand-name-en { font-size: 11px; color: #4B5694; margin-top: 1px; }
  .doctor-block { margin-top: 4px; }
  .doctor-block .name-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 12px; font-weight: bold; color: #1F2430;
  }
  .doctor-block .name-en { font-size: 10px; font-weight: bold; color: #1F2430; }
  .doctor-block .title-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 9px; color: #4B5694; margin-top: 1px;
  }
  .doctor-block .title-en { font-size: 8.5px; color: #4B5694; }

  .header-right { text-align: ${isRtl ? 'left' : 'right'}; font-size: 8.5px; color: #374151; }
  .header-right .line { display: flex; align-items: center; gap: 4px; justify-content: ${isRtl ? 'flex-start' : 'flex-end'}; margin-bottom: 2px; }
  .header-right .ico { color: #111844; }
  .header-right .ar { font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif; }

  /* ── Invoice title row ── */
  .invoice-title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
  .invoice-title-block .invoice-title {
    font-size: 24px; font-weight: bold; color: #111844; letter-spacing: 1px; margin: 0;
  }
  .invoice-title-block .underline { width: 46px; height: 3px; background: #C4362B; margin-top: 2px; }
  .meta-pills { display: flex; gap: 8px; }
  .meta-pill {
    border: 1px solid #111844; border-radius: 20px; padding: 5px 12px;
    display: flex; align-items: center; gap: 6px; background: #F6F8FC;
  }
  .meta-pill .ico { color: #111844; }
  .meta-pill .label { font-size: 8px; color: #8991A6; display: block; }
  .meta-pill .value { font-size: 11px; font-weight: bold; color: #111844; }

  /* ── Patient section ── */
  .patient-section {
    display: flex; border: 1px solid #111844; border-radius: 10px; overflow: hidden; margin-bottom: 8px;
  }
  .patient-tab {
    background: #111844; color: #FFFFFF; width: 108px; flex-shrink: 0;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    padding: 10px 6px; text-align: center; gap: 6px;
  }
  .patient-tab .badge {
    width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid #FFFFFF;
    display: flex; align-items: center; justify-content: center;
  }
  .patient-tab .label { font-size: 10.5px; font-weight: bold; }
  .patient-tab .underline { width: 26px; height: 2px; background: #C4362B; }
  .patient-fields {
    flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 8px 14px;
    padding: 10px 14px;
  }
  .patient-fields .field { display: flex; align-items: flex-start; gap: 6px; }
  .patient-fields .field .badge {
    width: 22px; height: 22px; border-radius: 50%; background: #EAF0FB; color: #111844;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px;
  }
  .patient-fields .field .label { font-size: 8.5px; color: #8991A6; }
  .patient-fields .field .value { font-size: 11px; font-weight: bold; color: #1F2430; }

  /* ── Items table ── */
  table.items { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  table.items th {
    background: #111844; color: #FFFFFF; padding: 6px 8px; font-size: 10px;
    text-align: ${isRtl ? 'right' : 'left'};
  }
  table.items th:first-child { border-radius: ${isRtl ? '0 8px 0 0' : '8px 0 0 0'}; }
  table.items th:last-child { border-radius: ${isRtl ? '8px 0 0 0' : '0 8px 0 0'}; }
  table.items td { padding: 5px 8px; font-size: 10.5px; border-bottom: 1px solid #E5E7EF; }
  table.items tr:nth-child(even) td { background: #F6F7FA; }
  table.items tr.charge-row td { background: #FFF3E0; font-style: italic; }
  .col-qty, .col-price, .col-total, .col-code { text-align: center; }
  table.items th.col-qty, table.items th.col-price, table.items th.col-total, table.items th.col-code { text-align: center; }

  .replacement-note {
    text-align: center; font-size: 10px; color: #C4362B; font-weight: bold;
    margin-bottom: 8px; padding: 5px; border: 1px solid #C4362B; border-radius: 4px; background: #FEF2F2;
  }

  /* ── Bottom row: totals + status ── */
  .bottom-row { display: flex; gap: 10px; margin-bottom: 8px; page-break-inside: avoid; }
  .totals-box {
    flex: 1.3; border: 1px solid #111844; border-radius: 10px; padding: 8px 12px;
    display: flex; align-items: stretch; gap: 10px;
  }
  .totals-box .icon-rail {
    width: 30px; display: flex; align-items: flex-start; justify-content: center; padding-top: 4px;
  }
  .totals-box .icon-rail .badge {
    width: 26px; height: 26px; border-radius: 50%; background: #EAF0FB; color: #111844;
    display: flex; align-items: center; justify-content: center;
  }
  .totals-box .rows { flex: 1; }
  .totals-box .row { display: flex; justify-content: space-between; padding: 2px 0; font-size: 10.5px; color: #1F2430; }
  .totals-box .row.total-row { font-size: 11.5px; border-top: 1px solid #E5E7EF; margin-top: 2px; padding-top: 4px; }
  .totals-box .row .value { font-weight: bold; }
  .totals-box .row.remaining { font-size: 12px; }
  .totals-box .row.remaining .value { color: #C4362B; font-weight: bold; }

  .side-boxes { flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .status-box {
    flex: 1; border: 1px solid #111844; border-radius: 10px; padding: 6px 10px;
    display: flex; align-items: center; gap: 8px;
  }
  .status-box .badge {
    width: 24px; height: 24px; border-radius: 50%; background: #EAF0FB; color: #111844;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .status-box .label { font-size: 8.5px; color: #8991A6; }
  .status-box .value { font-size: 11.5px; font-weight: bold; color: #111844; }

  .thanks {
    display: flex; align-items: center; gap: 8px; justify-content: center;
    font-style: italic; font-size: 10.5px; color: #4B5694; margin-bottom: 6px;
  }
  .thanks .dash { flex: 1; max-width: 90px; height: 1px; background: #C7CCE0; }

  /* ── Decorative footer band ── */
  .footer-band {
    position: relative;
    margin: 0 -20px;
    padding: 10px 20px 8px;
    background: linear-gradient(135deg, #16225E 0%, #223B8F 55%, #3E6FD8 100%);
    color: #FFFFFF;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-radius: 22px 22px 0 0;
    page-break-inside: avoid;
  }
  .footer-band .maternal-icon { width: 40px; height: 40px; border-radius: 50%; background: #FFFFFF; padding: 3px; flex-shrink: 0; }
  .footer-band .footer-text { font-size: 8px; line-height: 1.5; text-align: ${isRtl ? 'right' : 'left'}; }
  .footer-band .footer-text .clinic-ar { font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif; font-size: 11px; font-weight: bold; }
  .footer-band .footer-text .clinic-en { font-size: 10px; font-weight: bold; }
  .footer-band .footer-contact { font-size: 8px; line-height: 1.6; text-align: ${isRtl ? 'left' : 'right'}; }
  .footer-band .footer-contact .ar { font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif; }
</style>
</head>
<body>
  ${voidWatermark}
  <div class="page">

    <div class="header">
      <div>
        <div class="brand-row">
          <img class="logo" src="data:image/png;base64,${CLINIC_LOGO_BASE64}" alt="${FIXED_BILINGUAL.clinicNameEn}" />
          <div>
            <div class="brand-name-ar">${FIXED_BILINGUAL.clinicNameAr}</div>
            <div class="brand-name-en">${FIXED_BILINGUAL.clinicNameEn}</div>
          </div>
        </div>
        <div class="doctor-block">
          <div class="name-ar">${FIXED_BILINGUAL.doctorNameAr}</div>
          <div class="name-en">${FIXED_BILINGUAL.doctorNameEn}</div>
          <div class="title-ar">${FIXED_BILINGUAL.doctorTitleAr}</div>
          <div class="title-en">${FIXED_BILINGUAL.doctorTitleEn}</div>
        </div>
      </div>
      <div class="header-right">
        <div class="line"><span class="ico">${icon('mapPin', 11)}</span><span class="ar">${FIXED_BILINGUAL.addressLine1Ar} — ${FIXED_BILINGUAL.addressLine2Ar}</span></div>
        <div class="line"><span>${FIXED_BILINGUAL.addressLine1En} — ${FIXED_BILINGUAL.addressLine2En}</span></div>
        <div class="line"><span class="ico">${icon('phone', 11)}</span><span class="ar">${FIXED_BILINGUAL.phoneAr}</span></div>
        <div class="line"><span>${FIXED_BILINGUAL.phoneEn}</span></div>
        <div class="line"><span class="ico">${icon('message', 11)}</span><span class="ar">${FIXED_BILINGUAL.mobileAr}</span></div>
        <div class="line"><span>${FIXED_BILINGUAL.mobileEn}</span></div>
      </div>
    </div>

    <div class="invoice-title-row">
      <div class="invoice-title-block">
        <div class="invoice-title">${t.invoiceTitle}</div>
        <div class="underline"></div>
      </div>
      <div class="meta-pills">
        <div class="meta-pill">
          <span class="ico">${icon('document', 15)}</span>
          <div><span class="label">${t.invoiceNo}</span><span class="value">${escapeHtml(invoice.invoiceNumber)}</span></div>
        </div>
        <div class="meta-pill">
          <span class="ico">${icon('calendar', 15)}</span>
          <div><span class="label">${t.date}</span><span class="value">${formatDate(invoice.issuedAt || invoice.createdAt)}</span></div>
        </div>
      </div>
    </div>

    <div class="patient-section">
      <div class="patient-tab">
        <div class="badge">${icon('user', 16)}</div>
        <div class="label">${t.patientInfoTitle}</div>
        <div class="underline"></div>
      </div>
      <div class="patient-fields">
        <div class="field">
          <span class="badge">${icon('user', 12)}</span>
          <div><div class="label">${t.patientName}</div><div class="value">${escapeHtml(invoice.patient.fullNameAr)}</div></div>
        </div>
        <div class="field">
          <span class="badge">${icon('clipboard', 12)}</span>
          <div><div class="label">${t.visitType}</div><div class="value">${visitTypeLabel}</div></div>
        </div>
        <div class="field">
          <span class="badge">${icon('card', 12)}</span>
          <div><div class="label">${t.civilId}</div><div class="value">${invoice.patient.civilId ? escapeHtml(invoice.patient.civilId) : t.dash}</div></div>
        </div>
        <div class="field">
          <span class="badge">${icon('heart', 12)}</span>
          <div><div class="label">${t.diagnosis}</div><div class="value">${diagnosis}</div></div>
        </div>
        <div class="field">
          <span class="badge">${icon('phone', 12)}</span>
          <div><div class="label">${t.mobileNumber}</div><div class="value">${invoice.patient.phone ? escapeHtml(invoice.patient.phone) : t.dash}</div></div>
        </div>
        <div class="field">
          <span class="badge">${icon('stethoscope', 12)}</span>
          <div><div class="label">${t.doctor}</div><div class="value">${FIXED_BILINGUAL.doctorNameAr}</div></div>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="col-service">${t.service}</th>
          <th class="col-code">${t.code}</th>
          <th class="col-qty">${t.qty}</th>
          <th class="col-price">${t.unitPrice}</th>
          <th class="col-total">${t.total}</th>
        </tr>
      </thead>
      <tbody>
        ${itemsRows}
        ${chargesRows}
      </tbody>
    </table>

    ${replacementNote}

    <div class="bottom-row">
      <div class="totals-box">
        <div class="icon-rail"><div class="badge">${icon('wallet', 15)}</div></div>
        <div class="rows">
          <div class="row"><span>${t.subtotal}</span><span class="value">${formatMoney(invoice.subtotal)} KD</span></div>
          <div class="row"><span>${t.additionalCharges}</span><span class="value">${formatMoney(totalAdditionalCharges)} KD</span></div>
          <div class="row total-row"><span>${t.total}</span><span class="value">${formatMoney(invoice.total)} KD</span></div>
          <div class="row"><span>${t.paid}</span><span class="value">${formatMoney(invoice.paid)} KD</span></div>
          <div class="row remaining"><span>${t.remaining}</span><span class="value">${formatMoney(invoice.remaining)} KD</span></div>
        </div>
      </div>
      <div class="side-boxes">
        <div class="status-box">
          <span class="badge">${icon('checkCircle', 13)}</span>
          <div><div class="label">${t.paymentStatus}</div><div class="value">${t.paymentStatusLabels[invoice.paymentStatus]}</div></div>
        </div>
        <div class="status-box">
          <span class="badge">${icon('card', 13)}</span>
          <div><div class="label">${t.paymentMethod}</div><div class="value">${lastPayment ? t.paymentMethodLabels[lastPayment.method] : t.dash}</div></div>
        </div>
      </div>
    </div>

    <div class="thanks"><span class="dash"></span><span>${t.thanks}</span><span class="dash"></span></div>

    <div class="footer-band">
      <img class="maternal-icon" src="data:image/png;base64,${MATERNAL_ICON_BASE64}" alt="" />
      <div class="footer-text">
        <div class="clinic-ar">${FIXED_BILINGUAL.clinicNameAr}</div>
        <div class="clinic-en">${FIXED_BILINGUAL.clinicNameEn}</div>
      </div>
      <div class="footer-contact">
        <div class="ar">${FIXED_BILINGUAL.addressLine1Ar} - ${FIXED_BILINGUAL.addressLine2Ar}</div>
        <div>${FIXED_BILINGUAL.addressLine1En} - ${FIXED_BILINGUAL.addressLine2En}</div>
        <div class="ar">${FIXED_BILINGUAL.phoneAr} · ${FIXED_BILINGUAL.mobileAr}</div>
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── WhatsApp share link (frontend opens this in a new tab / window.open) ──
// Unchanged from before — only pre-fills a message; WhatsApp does not allow
// attaching a file via a wa.me link, so the user still attaches the
// downloaded PDF manually inside the chat that opens.
export function buildWhatsAppShareUrl(
  patientPhone: string,
  invoiceNumber: string,
  locale: InvoiceLocale = 'ar',
): string {
  const digitsOnly = patientPhone.replace(/[^\d]/g, '');
  const message =
    locale === 'ar'
      ? `مرفق فاتورتكم رقم ${invoiceNumber} من مركز العيادات التخصصية.`
      : `Attached is your invoice No. ${invoiceNumber} from Specialized Clinics Center.`;
  return `https://wa.me/${digitsOnly}?text=${encodeURIComponent(message)}`;
}
