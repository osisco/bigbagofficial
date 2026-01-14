// Country normalization utility
// Handles conversion between country codes and names for consistency

// Common country code to name mapping (subset for top countries)
const COUNTRY_CODE_TO_NAME = {
  'US': 'UNITED STATES',
  'AF': 'AFGHANISTAN',
  'AL': 'ALBANIA',
  'DZ': 'ALGERIA',
  'AR': 'ARGENTINA',
  'AU': 'AUSTRALIA',
  'AT': 'AUSTRIA',
  'BH': 'BAHRAIN',
  'BD': 'BANGLADESH',
  'BE': 'BELGIUM',
  'BR': 'BRAZIL',
  'CA': 'CANADA',
  'CN': 'CHINA',
  'CO': 'COLOMBIA',
  'EG': 'EGYPT',
  'FR': 'FRANCE',
  'DE': 'GERMANY',
  'GB': 'UNITED KINGDOM',
  'IN': 'INDIA',
  'ID': 'INDONESIA',
  'IR': 'IRAN',
  'IQ': 'IRAQ',
  'IE': 'IRELAND',
  'IT': 'ITALY',
  'JO': 'JORDAN',
  'JP': 'JAPAN',
  'KE': 'KENYA',
  'KW': 'KUWAIT',
  'LB': 'LEBANON',
  'MY': 'MALAYSIA',
  'MX': 'MEXICO',
  'MA': 'MOROCCO',
  'NL': 'NETHERLANDS',
  'NZ': 'NEW ZEALAND',
  'NG': 'NIGERIA',
  'OM': 'OMAN',
  'PK': 'PAKISTAN',
  'PH': 'PHILIPPINES',
  'QA': 'QATAR',
  'SA': 'SAUDI ARABIA',
  'SG': 'SINGAPORE',
  'ZA': 'SOUTH AFRICA',
  'KR': 'SOUTH KOREA',
  'ES': 'SPAIN',
  'SE': 'SWEDEN',
  'CH': 'SWITZERLAND',
  'TH': 'THAILAND',
  'TR': 'TURKEY',
  'AE': 'UNITED ARAB EMIRATES',
  'VN': 'VIETNAM',
};

// Reverse mapping: name to code
const COUNTRY_NAME_TO_CODE = {};
Object.entries(COUNTRY_CODE_TO_NAME).forEach(([code, name]) => {
  COUNTRY_NAME_TO_CODE[name] = code;
  COUNTRY_NAME_TO_CODE[name.toUpperCase()] = code;
});

/**
 * Normalize country to uppercase code format
 * Handles both country codes (US, AF) and country names (United States, Afghanistan)
 * @param {string} country - Country code or name
 * @returns {string} - Uppercase country code (e.g., "US", "AF")
 */
export function normalizeCountryToCode(country) {
  if (!country) return null;
  
  const trimmed = country.trim().toUpperCase();
  
  // If it's already a 2-letter code, return it
  if (trimmed.length === 2 && COUNTRY_CODE_TO_NAME[trimmed]) {
    return trimmed;
  }
  
  // If it's a country name, convert to code
  if (COUNTRY_NAME_TO_CODE[trimmed]) {
    return COUNTRY_NAME_TO_CODE[trimmed];
  }
  
  // If it's a known code, return it
  if (COUNTRY_CODE_TO_NAME[trimmed]) {
    return trimmed;
  }
  
  // Fallback: return uppercase (might be a name we don't have in mapping)
  return trimmed;
}

/**
 * Normalize country to uppercase name format
 * Handles both country codes (US, AF) and country names (United States, Afghanistan)
 * @param {string} country - Country code or name
 * @returns {string} - Uppercase country name (e.g., "UNITED STATES", "AFGHANISTAN")
 */
export function normalizeCountryToName(country) {
  if (!country) return null;
  
  const trimmed = country.trim().toUpperCase();
  
  // If it's a 2-letter code, convert to name
  if (trimmed.length === 2 && COUNTRY_CODE_TO_NAME[trimmed]) {
    return COUNTRY_CODE_TO_NAME[trimmed];
  }
  
  // If it's already a name, return it
  if (COUNTRY_NAME_TO_CODE[trimmed]) {
    return trimmed;
  }
  
  // Fallback: return uppercase
  return trimmed;
}

/**
 * Get country code from name or return code if already a code
 * @param {string} country - Country code or name
 * @returns {string} - Country code (e.g., "US", "AF")
 */
export function getCountryCode(country) {
  return normalizeCountryToCode(country);
}

/**
 * Get country name from code or return name if already a name
 * @param {string} country - Country code or name
 * @returns {string} - Country name (e.g., "UNITED STATES", "AFGHANISTAN")
 */
export function getCountryName(country) {
  return normalizeCountryToName(country);
}
