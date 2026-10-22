// Sequential, organized currency definitions for enterprise decision modeling.
// Prioritizes regional and most-utilized currencies first, followed by major global currencies,
// and then all other ISO 4217 currencies sorted alphabetically.

export interface CurrencyMetadata {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  category: "primary" | "major" | "other";
}

export interface CurrencyGroup {
  id: "primary" | "major" | "other";
  labelAr: string;
  labelEn: string;
  items: CurrencyMetadata[];
}

export const PRIMARY_CURRENCIES = [
  "IQD", // دينار عراقي - Iraqi Dinar (Home base)
  "USD", // دولار أمريكي - US Dollar
  "EUR", // يورو - Euro
  "GBP", // جنيه إسترليني - British Pound
  "SAR", // ريال سعودي - Saudi Riyal
  "AED", // درهم إماراتي - UAE Dirham
  "KWD", // دينار كويتي - Kuwaiti Dinar
  "QAR", // ريال قطري - Qatari Riyal
  "BHD", // دينار بحريني - Bahraini Dinar
  "OMR", // ريال عماني - Omani Rial
  "JOD", // دينار أردني - Jordanian Dinar
  "EGP", // جنيه مصري - Egyptian Pound
  "TRY", // ليرة تركية - Turkish Lira
];

export const MAJOR_GLOBAL_CURRENCIES = [
  "CAD", // دولار كندي - Canadian Dollar
  "CHF", // فرنك سويسري - Swiss Franc
  "CNY", // يوان صيني - Chinese Yuan
  "JPY", // ين ياباني - Japanese Yen
  "AUD", // دولار أسترالي - Australian Dollar
  "INR", // روبية هندية - Indian Rupee
  "SGD", // دولار سنغافوري - Singapore Dollar
  "SEK", // كرونة سويدية - Swedish Krona
  "NOK", // كرونة نرويجية - Norwegian Krone
  "NZD", // دولار نيوزيلندي - New Zealand Dollar
  "KRW", // وون كوري - South Korean Won
  "BRL", // ريال برازيلي - Brazilian Real
  "MXN", // بيزو مكسيكي - Mexican Peso
  "MYR", // رينغيت ماليزي - Malaysian Ringgit
  "IDR", // روبية إندونيسية - Indonesian Rupiah
  "ZAR", // راند جنوب أفريقي - South African Rand
];

export const CURRENCY_FLAGS: Record<string, string> = {
  IQD: "🇮🇶",
  USD: "🇺🇸",
  EUR: "🇪🇺",
  GBP: "🇬🇧",
  SAR: "🇸🇦",
  AED: "🇦🇪",
  KWD: "🇰🇼",
  QAR: "🇶🇦",
  BHD: "🇧🇭",
  OMR: "🇴🇲",
  JOD: "🇯🇴",
  EGP: "🇪🇬",
  TRY: "🇹🇷",
  CAD: "🇨🇦",
  CHF: "🇨🇭",
  CNY: "🇨🇳",
  JPY: "🇯🇵",
  AUD: "🇦🇺",
  INR: "🇮🇳",
  SGD: "🇸🇬",
  SEK: "🇸🇪",
  NOK: "🇳🇴",
  NZD: "🇳🇿",
  KRW: "🇰🇷",
  BRL: "🇧🇷",
  MXN: "🇲🇽",
  MYR: "🇲🇾",
  IDR: "🇮🇩",
  ZAR: "🇿🇦",
  DZD: "🇩🇿",
  MAD: "🇲🇦",
  TND: "🇹🇳",
  LYD: "🇱🇾",
  SDG: "🇸🇩",
  LBP: "🇱🇧",
  SYP: "🇸🇾",
  YER: "🇾🇪",
  RUB: "🇷🇺",
  HKD: "🇭🇰",
  THB: "🇹🇭",
  PHP: "🇵🇭",
  PKR: "🇵🇰",
  BDT: "🇧🇩",
  VND: "🇻🇳",
};

export const CURRENCY_SYMBOLS: Record<string, string> = {
  IQD: "د.ع",
  USD: "$",
  EUR: "€",
  GBP: "£",
  SAR: "ر.س",
  AED: "د.إ",
  KWD: "د.ك",
  QAR: "ر.ق",
  BHD: "د.ب",
  OMR: "ر.ع",
  JOD: "د.أ",
  EGP: "ج.م",
  TRY: "₺",
  CAD: "CA$",
  CHF: "CHF",
  CNY: "¥",
  JPY: "¥",
  AUD: "A$",
  INR: "₹",
  SGD: "S$",
  SEK: "kr",
  NOK: "kr",
  NZD: "NZ$",
  KRW: "₩",
  BRL: "R$",
  MXN: "Mex$",
  MYR: "RM",
  IDR: "Rp",
  ZAR: "R",
};

/**
 * Returns raw supported ISO currency codes from the browser environment or fallback.
 */
function getAllRawCurrencyCodes(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => string[] };
    if (intl.supportedValuesOf) {
      return intl.supportedValuesOf("currency");
    }
  } catch {
    // ignore
  }
  return [...PRIMARY_CURRENCIES, ...MAJOR_GLOBAL_CURRENCIES];
}

/**
 * Returns currency codes ordered logically:
 * 1. Regional and primary (IQD, USD, EUR, SAR, AED, etc.)
 * 2. Major global currencies (CAD, CHF, CNY, JPY, etc.)
 * 3. All other ISO 4217 currencies sorted alphabetically by their localized name.
 */
export function getCurrencyCodes(locale = "ar"): string[] {
  const allRaw = getAllRawCurrencyCodes();
  const prioritizedSet = new Set([...PRIMARY_CURRENCIES, ...MAJOR_GLOBAL_CURRENCIES]);

  // Remaining currencies
  const remaining = allRaw.filter((code) => !prioritizedSet.has(code));

  // Sort remaining alphabetically by display name in the active locale
  try {
    const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
    remaining.sort((a, b) => {
      const nameA = displayNames.of(a) || a;
      const nameB = displayNames.of(b) || b;
      return nameA.localeCompare(nameB, locale);
    });
  } catch {
    remaining.sort();
  }

  return [...PRIMARY_CURRENCIES, ...MAJOR_GLOBAL_CURRENCIES, ...remaining];
}

/**
 * Returns formatted label for a currency code (e.g. "IQD — دينار عراقي (د.ع)").
 */
export function getCurrencyLabel(code: string, locale = "ar"): string {
  try {
    const name = new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
    const symbol = CURRENCY_SYMBOLS[code];
    if (symbol) {
      return `${code} — ${name} (${symbol})`;
    }
    return `${code} — ${name}`;
  } catch {
    return code;
  }
}

/**
 * Formats a numeric value according to the specified currency and locale.
 */
export function formatCurrency(amount: number, currency: string, locale = "ar"): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
      currencyDisplay: "code",
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${amount.toLocaleString(locale)} ${currency}`;
  }
}

/**
 * Returns grouped and structured currency metadata for custom or optgroup selects.
 */
export function getCurrencyGroups(locale = "ar"): CurrencyGroup[] {
  const displayNames = new Intl.DisplayNames([locale], { type: "currency" });
  const allCodes = getAllRawCurrencyCodes();
  const prioritizedSet = new Set([...PRIMARY_CURRENCIES, ...MAJOR_GLOBAL_CURRENCIES]);

  const mapToMeta = (code: string, category: "primary" | "major" | "other"): CurrencyMetadata => {
    let name = code;
    try {
      name = displayNames.of(code) || code;
    } catch {
      // fallback
    }
    return {
      code,
      name,
      symbol: CURRENCY_SYMBOLS[code] || code,
      flag: CURRENCY_FLAGS[code] || "🌐",
      category,
    };
  };

  const primaryItems = PRIMARY_CURRENCIES.map((code) => mapToMeta(code, "primary"));
  const majorItems = MAJOR_GLOBAL_CURRENCIES.map((code) => mapToMeta(code, "major"));

  const otherCodes = allCodes.filter((code) => !prioritizedSet.has(code));
  const otherItems = otherCodes.map((code) => mapToMeta(code, "other"));

  // Sort other items by localized name
  otherItems.sort((a, b) => a.name.localeCompare(b.name, locale));

  return [
    {
      id: "primary",
      labelAr: "العملات الأكثر استخداماً والإقليمية",
      labelEn: "Primary & Regional Currencies",
      items: primaryItems,
    },
    {
      id: "major",
      labelAr: "العملات العالمية الكبرى",
      labelEn: "Major Global Currencies",
      items: majorItems,
    },
    {
      id: "other",
      labelAr: "باقي العملات العالمية (أبجدياً)",
      labelEn: "Other Global Currencies (Alphabetical)",
      items: otherItems,
    },
  ];
}
