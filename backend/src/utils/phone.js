/**
 * Phone Number Normalization to E.164 format
 */

export function normalizePhone(rawPhone, defaultCountryCode = '91') {
  if (rawPhone === null || rawPhone === undefined) {
    return { isValid: false, phone: null, error: 'Phone number is empty' };
  }

  let str = String(rawPhone).trim();
  if (!str) return { isValid: false, phone: null, error: 'Phone number is empty' };

  // Remove leading/trailing quotes and BOM
  str = str.replace(/^\uFEFF/, '').replace(/^["']|["']$/g, '').trim();

  // If number came from Excel as scientific notation (e.g. 9.87654E+09) or float (9876543210.0)
  if (/^\d+\.0+$/.test(str)) {
    str = str.replace(/\.0+$/, '');
  } else if (/[eE]\+?/.test(str)) {
    const num = Number(str);
    if (!isNaN(num)) {
      try {
        str = BigInt(Math.round(num)).toString();
      } catch (_) {}
    }
  }

  // Remove spaces, dashes, parentheses, non-digit chars except leading plus
  let cleaned = str.replace(/[\s\-\(\)\.]/g, '');

  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  } else if (cleaned.startsWith('00')) {
    cleaned = cleaned.substring(2);
  } else if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
    if (!cleaned.startsWith(defaultCountryCode)) {
      cleaned = defaultCountryCode + cleaned;
    }
  } else if (cleaned.length === 10) {
    // 10 digits standard mobile number, prepend default country code
    cleaned = defaultCountryCode + cleaned;
  }

  // Remove any remaining non-digits
  cleaned = cleaned.replace(/\D/g, '');

  // E.164 numbers are between 8 and 15 digits
  if (cleaned.length < 8 || cleaned.length > 15) {
    return {
      isValid: false,
      phone: null,
      error: `Invalid phone length (${cleaned.length} digits). E.164 standard requires 8-15 digits.`
    };
  }

  return {
    isValid: true,
    phone: `+${cleaned}`,
    countryCode: defaultCountryCode
  };
}

export default {
  normalizePhone
};
