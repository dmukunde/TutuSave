// Single-currency-per-user model: every amount in the database is a plain
// numeric value with no currency of its own — the user's profiles.currency
// governs how ALL of it is displayed. This is deliberate, not an oversight:
// adding multi-currency accounts later means adding an `accounts` table with
// its own currency column (transactions would carry an account_id and defer
// to it), and exchange rates later means adding an `exchange_rates` table.
// Neither requires touching transactions, budgets, or savings_goals as they
// exist today — amounts stay currency-agnostic numbers at rest.

export const SUPPORTED_CURRENCIES = [
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "RWF", name: "Rwandan Franc" },
  { code: "ZAR", name: "South African Rand" },
  { code: "NGN", name: "Nigerian Naira" },
] as const;

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export function isSupportedCurrency(value: string): value is CurrencyCode {
  return SUPPORTED_CURRENCIES.some((c) => c.code === value);
}

// currency=null means the user hasn't chosen one yet — never silently
// treat that as USD. Fall back to a plain grouped number instead.
export function formatMoney(amount: number, currency: string | null) {
  if (!currency) {
    return new Intl.NumberFormat("en-US").format(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
