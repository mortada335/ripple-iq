const FALLBACK_CURRENCIES = ["AED", "AUD", "BHD", "CAD", "CHF", "CNY", "EGP", "EUR", "GBP", "INR", "IQD", "JOD", "JPY", "KWD", "QAR", "SAR", "TRY", "USD"];

export function getCurrencyCodes(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: "currency") => string[] };
    return intl.supportedValuesOf ? intl.supportedValuesOf("currency") : FALLBACK_CURRENCIES;
  } catch {
    return FALLBACK_CURRENCIES;
  }
}

export function getCurrencyLabel(code: string, locale = "en") {
  try {
    return `${code} — ${new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code}`;
  } catch {
    return code;
  }
}

export function formatCurrency(amount: number, currency: string, locale = "en") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    currencyDisplay: "code",
    maximumFractionDigits: 2,
  }).format(amount);
}
