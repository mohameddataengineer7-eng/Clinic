import { CLINIC_LOGO_BASE64 } from './clinic-logo';
import { Decimal } from '@prisma/client/runtime/library';

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

// Fixed clinic identity — single-doctor clinic, this never changes per invoice.
const DOCTOR_NAME_AR = 'د. نداء بوخضور';
const DOCTOR_TITLE_AR = 'استشاري أمراض النساء والولادة والعقم';

const CLINIC_NAME_AR = 'مركز العيادات التخصصية';
const CLINIC_NAME_EN = 'Specialized Clinics Center';

const CLINIC_ADDRESS_AR = 'حولي - قطعه 4 - شارع المعتصم- مركز العيادات التخصصية - الدور السادس';
const CLINIC_ADDRESS_EN = "Hawally - Block 4 - Al-Mu'tasim Street - Specialized Clinics Center - 6th Floor";
const CLINIC_PHONE_AR = 'تلفون: 22650700 داخلي 607';
const CLINIC_PHONE_EN = 'Tel.: 22650700 Ext. 607';
const CLINIC_MOBILE_AR = 'موبايل وواتساب: 60008977';
const CLINIC_MOBILE_EN = 'Mobile & WhatsApp: 60008977';

const VISIT_TYPE_LABELS_EN: Record<'CHECKUP' | 'FOLLOW_UP' | 'OTHER', string> = {
  CHECKUP: 'Checkup',
  FOLLOW_UP: 'Follow-up',
  OTHER: 'Other',
};

const PAYMENT_STATUS_LABELS_EN: Record<InvoicePdfData['paymentStatus'], string> = {
  UNPAID: 'UNPAID',
  PARTIALLY_PAID: 'PARTIALLY PAID',
  PAID: 'PAID',
};

const PAYMENT_METHOD_LABELS_EN: Record<InvoicePdfData['payments'][number]['method'], string> = {
  CASH: 'CASH',
  VISA: 'VISA',
  KNET: 'KNET',
  OTHER: 'OTHER',
};

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

export function renderInvoiceHtml(invoice: InvoicePdfData, language: 'ar' | 'en' = 'en'): string {
  const isArabic = language === 'ar';
  const labels = isArabic
    ? {
        invoice: 'فاتورة',
        invoiceNo: 'رقم الفاتورة',
        date: 'التاريخ',
        patientInfo: 'بيانات المريض',
        patientName: 'اسم المريض',
        visitType: 'نوع الزيارة',
        civilId: 'الرقم المدني',
        diagnosis: 'التشخيص',
        mobile: 'رقم الهاتف',
        doctor: 'الطبيب',
        service: 'الخدمة',
        code: 'الرمز',
        qty: 'الكمية',
        unitPrice: 'سعر الوحدة (د.ك)',
        total: 'الإجمالي (د.ك)',
        subtotal: 'المجموع الفرعي',
        paid: 'المدفوع',
        remaining: 'المتبقي',
        paymentStatus: 'حالة الدفع',
        paymentMethod: 'طريقة الدفع',
        additional: 'رسوم إضافية',
        fixed: 'رسوم ثابتة',
        percentage: 'رسوم إضافية',
        visitTypes: { CHECKUP: 'فحص', FOLLOW_UP: 'متابعة', OTHER: 'أخرى' },
        paymentStatuses: { UNPAID: 'غير مدفوع', PARTIALLY_PAID: 'مدفوع جزئياً', PAID: 'مدفوع بالكامل' },
        paymentMethods: { CASH: 'نقدي', VISA: 'فيزا', KNET: 'كي نت', OTHER: 'أخرى' },
      }
    : {
        invoice: 'INVOICE',
        invoiceNo: 'Invoice No.',
        date: 'Date',
        patientInfo: 'PATIENT INFORMATION',
        patientName: 'Patient Name',
        visitType: 'Visit Type',
        civilId: 'Civil ID',
        diagnosis: 'Diagnosis',
        mobile: 'Mobile Number',
        doctor: 'Doctor',
        service: 'SERVICE',
        code: 'CODE',
        qty: 'QTY',
        unitPrice: 'UNIT PRICE (KD)',
        total: 'TOTAL (KD)',
        subtotal: 'Subtotal',
        paid: 'Paid',
        remaining: 'Remaining',
        paymentStatus: 'PAYMENT STATUS',
        paymentMethod: 'PAYMENT METHOD',
        additional: 'Additional Charge',
        fixed: 'Fixed Charge',
        percentage: 'Additional Charge',
        visitTypes: VISIT_TYPE_LABELS_EN,
        paymentStatuses: PAYMENT_STATUS_LABELS_EN,
        paymentMethods: PAYMENT_METHOD_LABELS_EN,
      };
  const itemsRows = invoice.invoiceItems
    .map(
      (item) => `
        <tr>
          <td class="col-service">${escapeHtml(item.serviceNameSnapshot)}</td>
          <td class="col-code">${item.service?.code ? escapeHtml(item.service.code) : '&mdash;'}</td>
          <td class="col-qty">${item.quantity}</td>
          <td class="col-price">${formatMoney(item.unitPriceSnapshot)}</td>
          <td class="col-total">${formatMoney(item.lineTotal)}</td>
        </tr>`,
    )
    .join('');

  // Generate additional charges rows if they exist
  const chargesRows = (invoice.additionalCharges || [])
    .map(
      (charge) => {
        const chargeLabel = charge.description ? escapeHtml(charge.description) : (charge.chargeType === 'PERCENTAGE' ? labels.percentage : labels.fixed);
        const priceDisplay = charge.chargeType === 'PERCENTAGE' ? formatMoney(charge.chargeValue) + '%' : formatMoney(charge.chargeValue);
        return `
        <tr class="charge-row">
          <td class="col-service">${chargeLabel}</td>
          <td class="col-code">&mdash;</td>
          <td class="col-qty">1</td>
          <td class="col-price">${priceDisplay}</td>
          <td class="col-total">${formatMoney(charge.calculatedAmount)}</td>
        </tr>`;
      }
    )
    .join('');

  // Generate additional charges totals rows
  const chargesTotalsRows = (invoice.additionalCharges || [])
    .map(
      (charge) => {
        const chargeLabel = charge.description || (charge.chargeType === 'PERCENTAGE' ? 'Additional Charge' : 'Fixed Charge');
        const valueDisplay = charge.chargeType === 'PERCENTAGE' ? formatMoney(charge.chargeValue) + '%' : formatMoney(charge.chargeValue);
        return `<div class="row"><span>${chargeLabel} (${valueDisplay})</span><span class="value">${formatMoney(charge.calculatedAmount)} KD</span></div>`;
      }
    )
    .join('');

  const lastPayment = invoice.payments.length > 0 ? invoice.payments[invoice.payments.length - 1] : null;

  const voidWatermark =
    invoice.status === 'VOID'
      ? `<div class="watermark">VOID</div>`
      : '';

  const replacementNote = invoice.replacedByInvoiceId
    ? `<div class="replacement-note">This invoice has been replaced. See replacement invoice for current details.</div>`
    : '';

  const visitTypeLabel = invoice.visit ? labels.visitTypes[invoice.visit.type] : '&mdash;';
  const diagnosis = invoice.visit?.diagnosis ? escapeHtml(invoice.visit.diagnosis) : '&mdash;';

  return `
<!DOCTYPE html>
<html lang="${language}" dir="${isArabic ? 'rtl' : 'ltr'}">
<head>
<meta charset="UTF-8" />
<style>
  @font-face {
    font-family: 'Noto Naskh Arabic';
    src: local('Noto Naskh Arabic');
  }
  * { box-sizing: border-box; }
  @page { size: A4; margin: 0; }
  body {
    font-family: 'Arial', 'Noto Sans Arabic', 'Noto Naskh Arabic', sans-serif;
    color: #1F2430;
    margin: 0;
    padding: 0;
    background: #FFFFFF;
    position: relative;
  }
  .page {
    display: flex;
    flex-direction: column;
    width: 210mm;
    min-height: 297mm;
    padding: 12mm 14mm 0;
    background: #FFFFFF;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .watermark {
    position: fixed;
    top: 40%;
    left: 0;
    right: 0;
    text-align: center;
    font-size: 96px;
    font-weight: bold;
    color: #C4362B;
    opacity: 0.15;
    transform: rotate(-25deg);
    z-index: 10;
  }
  .top-bar {
    display: none;
  }
  .header {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: 8px;
    background: #102F63;
    margin-bottom: 8px;
    color: #FFFFFF;
  }
  .header-contact {
    margin-inline-start: auto;
    padding-inline-start: 12px;
    border-inline-start: 1px solid rgba(255,255,255,.35);
    text-align: right;
    font-size: 7px;
    line-height: 1.45;
    color: #FFFFFF;
    direction: ltr;
  }
  .header-contact .line-ar {
    direction: rtl;
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
  }
  .header .logo {
    width: 58px;
    height: 58px;
    flex-shrink: 0;
  }
  .header .clinic-name-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 18px;
    font-weight: bold;
    color: #FFFFFF;
    direction: rtl;
  }
  .header .clinic-name-en {
    font-size: 17px;
    font-weight: bold;
    color: #FFFFFF;
  }
  .doctor-block {
    text-align: right;
    margin: 2px 0 8px;
    padding: 0 4px;
  }
  .doctor-block .doctor-name {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 13px;
    font-weight: bold;
    color: #1F2430;
    direction: rtl;
  }
  .doctor-block .doctor-title {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    font-size: 10px;
    color: #4B5694;
    direction: rtl;
    margin-top: 2px;
  }
  .invoice-title {
    text-align: center;
    font-size: 20px;
    font-weight: bold;
    color: #111844;
    letter-spacing: 2px;
    margin: 8px 0 10px;
  }
  .invoice-title::after {
    content: '';
    display: block;
    width: 34px;
    border-bottom: 3px solid #C4362B;
    margin: 4px auto 0;
  }
  .invoice-title .arrow {
    color: #4B5694;
    font-weight: normal;
    padding: 0 10px;
  }
  .meta-box {
    display: flex;
    border: 1px solid #111844;
    border-radius: 8px;
    margin-bottom: 7px;
    background: #F4F8FD;
    overflow: hidden;
  }
  .meta-box .cell {
    flex: 1;
    padding: 6px 10px;
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .meta-box .cell:first-child {
    border-right: 1px solid #E5E7EF;
  }
  .meta-box .cell .icon {
    color: #111844;
    font-size: 16px;
    display: inline-flex;
    flex: 0 0 16px;
    width: 16px;
    height: 16px;
  }
  .meta-box .cell .icon svg {
    display: block;
    width: 16px;
    height: 16px;
  }
  .meta-box .cell .label {
    font-size: 8px;
    color: #8991A6;
    display: block;
  }
  .meta-box .cell .value {
    font-size: 11px;
    font-weight: bold;
    color: #111844;
  }
  .patient-box {
    display: flex;
    border: 1px solid #B9C7DE;
    border-radius: 8px;
    padding: 0;
    margin-bottom: 7px;
    background: #F8FBFF;
    overflow: hidden;
  }
  .patient-title {
    display: flex;
    align-items: center;
    width: 106px;
    flex: 0 0 106px;
    padding: 8px;
    background: #17447F;
    color: #FFFFFF;
    text-align: center;
    font-size: 11px;
    font-weight: bold;
    letter-spacing: 0.5px;
    line-height: 1.3;
  }
  .patient-details {
    flex: 1;
    padding: 7px 11px;
  }
  .patient-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 5px 16px;
  }
  .patient-grid .field .label {
    font-size: 8px;
    color: #8991A6;
    margin-bottom: 2px;
  }
  .patient-grid .field .value {
    font-size: 11px;
    font-weight: bold;
    color: #1F2430;
  }
  .patient-grid .field .value.ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    text-align: right;
  }
  table.items {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 7px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  table.items th {
    background: #111844;
    color: #FFFFFF;
    padding: 4px 6px;
    font-size: 9px;
    text-align: left;
  }
  table.items td {
    padding: 4px 6px;
    font-size: 10px;
    border-bottom: 1px solid #E5E7EF;
  }
  table.items tr:nth-child(even) td { background: #F6F7FA; }
  table.items tr.charge-row td { background: #FFF3E0; font-style: italic; }
  .col-qty, .col-price, .col-total, .col-code { text-align: center; }
  table.items th.col-qty, table.items th.col-price, table.items th.col-total, table.items th.col-code {
    text-align: center;
  }
  .replacement-note {
    text-align: center;
    font-size: 9px;
    color: #C4362B;
    font-weight: bold;
    margin-bottom: 6px;
    padding: 5px;
    border: 1px solid #C4362B;
    border-radius: 4px;
    background: #FEF2F2;
  }
  .bottom-row {
    display: flex;
    gap: 10px;
    margin-bottom: 7px;
  }
  .totals-box {
    flex: 1;
    border: 1px solid #111844;
    border-radius: 8px;
    padding: 7px 11px;
    background: #F8FBFF;
  }
  .totals-box .row {
    display: flex;
    justify-content: space-between;
    padding: 2px 0;
    font-size: 10px;
    color: #1F2430;
  }
  .totals-box .row.remaining .value { color: #C4362B; font-weight: bold; }
  .totals-box .row .value { font-weight: bold; }
  .status-row {
    display: flex;
    gap: 6px;
  }
  .status-box {
    flex: 1;
    border: 1px solid #111844;
    border-radius: 8px;
    padding: 6px 8px;
    text-align: center;
  }
  .status-box .label {
    font-size: 8px;
    color: #8991A6;
    margin-bottom: 3px;
    letter-spacing: 0.5px;
  }
  .status-box .value {
    font-size: 11px;
    font-weight: bold;
    color: #111844;
  }
  .thanks {
    text-align: center;
    font-style: italic;
    font-size: 10px;
    color: #4B5694;
    margin-bottom: 6px;
  }
  .footer-box {
    margin-top: auto;
    border: 0;
    border-radius: 8px 8px 0 0;
    padding: 8px 11px 7px;
    background: #17447F;
    text-align: center;
    font-size: 8px;
    color: #FFFFFF;
  }
  .footer-box .clinic-name-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    font-size: 14px;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 2px;
  }
  .footer-box .clinic-name-en {
    font-size: 13px;
    font-weight: bold;
    color: #FFFFFF;
    margin-bottom: 5px;
  }
  .footer-box .line-ar {
    font-family: 'Noto Naskh Arabic', 'Noto Sans Arabic', sans-serif;
    direction: rtl;
    margin-bottom: 1px;
  }
  .footer-box .line-en {
    margin-bottom: 4px;
  }
  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .page { margin: 0 auto; }
  }
</style>
</head>
<body>
  ${voidWatermark}
  <div class="page">
    <div class="top-bar"></div>

    <div class="header">
      <img class="logo" src="data:image/png;base64,${CLINIC_LOGO_BASE64}" alt="Specialized Clinics Center" />
      <div>
        <div class="clinic-name-ar">${CLINIC_NAME_AR}</div>
        <div class="clinic-name-en">${CLINIC_NAME_EN}</div>
      </div>
      <div class="header-contact">
        <div class="line-ar">${CLINIC_ADDRESS_AR}</div>
        <div>${CLINIC_ADDRESS_EN}</div>
        <div class="line-ar">${CLINIC_PHONE_AR}</div>
        <div>${CLINIC_PHONE_EN}</div>
      </div>
    </div>

    <div class="doctor-block">
      <div class="doctor-name">${DOCTOR_NAME_AR}</div>
      <div class="doctor-title">${DOCTOR_TITLE_AR}</div>
    </div>

    <div class="invoice-title"><span class="arrow">&#8594;</span>${labels.invoice}<span class="arrow">&#8592;</span></div>

    <div class="meta-box">
      <div class="cell">
        <span class="icon" aria-hidden="true"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg></span>
        <div>
          <span class="label">${labels.invoiceNo}</span>
          <span class="value">${escapeHtml(invoice.invoiceNumber)}</span>
        </div>
      </div>
      <div class="cell">
        <span class="icon" aria-hidden="true"><svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/></svg></span>
        <div>
          <span class="label">${labels.date}</span>
          <span class="value">${formatDate(invoice.issuedAt || invoice.createdAt)}</span>
        </div>
      </div>
    </div>

    <div class="patient-box">
      <div class="patient-title">${labels.patientInfo}</div>
      <div class="patient-details">
        <div class="patient-grid">
          <div class="field">
            <div class="label">${labels.patientName}</div>
            <div class="value ar">${escapeHtml(invoice.patient.fullNameAr)}</div>
          </div>
          <div class="field">
            <div class="label">${labels.visitType}</div>
            <div class="value">${visitTypeLabel}</div>
          </div>
          <div class="field">
            <div class="label">${labels.civilId}</div>
            <div class="value">${invoice.patient.civilId ? escapeHtml(invoice.patient.civilId) : '&mdash;'}</div>
          </div>
          <div class="field">
            <div class="label">${labels.diagnosis}</div>
            <div class="value ar">${diagnosis}</div>
          </div>
          <div class="field">
            <div class="label">${labels.mobile}</div>
            <div class="value">${invoice.patient.phone ? escapeHtml(invoice.patient.phone) : '&mdash;'}</div>
          </div>
          <div class="field">
            <div class="label">${labels.doctor}</div>
            <div class="value ar">${DOCTOR_NAME_AR}</div>
          </div>
        </div>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th class="col-service">${labels.service}</th>
          <th class="col-code">${labels.code}</th>
          <th class="col-qty">${labels.qty}</th>
          <th class="col-price">${labels.unitPrice}</th>
          <th class="col-total">${labels.total}</th>
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
        <div class="row"><span>${labels.subtotal}</span><span class="value">${formatMoney(invoice.subtotal)} KD</span></div>
        ${chargesTotalsRows}
        <div class="row" style="border-top: 1px solid #E5E7EF; padding-top: 8px; margin-top: 4px;"><span>${labels.total}</span><span class="value">${formatMoney(invoice.total)} KD</span></div>
        <div class="row"><span>${labels.paid}</span><span class="value">${formatMoney(invoice.paid)} KD</span></div>
        <div class="row remaining"><span>${labels.remaining}</span><span class="value">${formatMoney(invoice.remaining)} KD</span></div>
      </div>
      <div class="status-row" style="flex: 1; display: flex; flex-direction: column; gap: 12px;">
        <div class="status-box">
          <div class="label">${labels.paymentStatus}</div>
          <div class="value">${labels.paymentStatuses[invoice.paymentStatus]}</div>
        </div>
        <div class="status-box">
          <div class="label">${labels.paymentMethod}</div>
          <div class="value">${lastPayment ? labels.paymentMethods[lastPayment.method] : '&mdash;'}</div>
        </div>
      </div>
    </div>

    <div class="thanks">&#9829; Thank you for choosing our clinic &#9829;</div>

    <div class="footer-box">
      <div class="clinic-name-ar">${CLINIC_NAME_AR}</div>
      <div class="clinic-name-en">${CLINIC_NAME_EN}</div>
      <div class="line-ar">${CLINIC_ADDRESS_AR}</div>
      <div class="line-en">${CLINIC_ADDRESS_EN}</div>
      <div class="line-ar">${CLINIC_PHONE_AR}</div>
      <div class="line-en">${CLINIC_PHONE_EN}</div>
      <div class="line-ar">${CLINIC_MOBILE_AR}</div>
      <div class="line-en">${CLINIC_MOBILE_EN}</div>
    </div>
  </div>
</body>
</html>`;
}
