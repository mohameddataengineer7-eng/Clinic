const KUWAIT_COUNTRY_CODE = '965';

function normalizeDigits(value: string): string {
  return value.replace(/[٠-٩]/g, (digit) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(digit))).replace(/\D/g, '');
}

export function normalizeWhatsAppPhone(value: string, countryCode = ''): string {
  let digits = normalizeDigits(value);
  const explicitCountryCode = normalizeDigits(countryCode);

  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('+')) digits = digits.slice(1);

  if (digits.startsWith(KUWAIT_COUNTRY_CODE) && digits.length === 11) {
    return digits;
  }

  if (explicitCountryCode) {
    const localDigits = digits.replace(/^0+/, '');
    return `${explicitCountryCode}${localDigits}`;
  }

  const localDigits = digits.replace(/^0+/, '');
  if (localDigits.length === 8) {
    return `${KUWAIT_COUNTRY_CODE}${localDigits}`;
  }

  return digits;
}

export function isValidWhatsAppPhone(value: string): boolean {
  return /^\d{8,15}$/.test(value);
}

export function canShareInvoiceFile(file: globalThis.File): boolean {
  const shareNavigator = navigator as globalThis.Navigator & {
    canShare?: (data?: globalThis.ShareData) => boolean;
  };

  return typeof navigator.share === 'function'
    && typeof shareNavigator.canShare === 'function'
    && shareNavigator.canShare({ files: [file] });
}

export function buildWhatsAppUrl(phone: string, message: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}
