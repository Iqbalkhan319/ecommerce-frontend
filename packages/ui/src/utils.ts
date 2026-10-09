export type ClassValue = string | number | null | undefined | false | ClassValue[];

// Small class-name joiner. A dependency is not warranted for this, and keeping it local
// means the design system has no runtime dependencies at all.
export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) out.push(nested);
    } else {
      out.push(String(value));
    }
  }
  return out.join(' ');
}

// Taka is the default: `narrowSymbol` renders BDT as ৳ with Latin digits, where the
// plain `symbol` display falls back to the "BDT" code. Whole amounts print without
// decimals, which is how prices are written locally, but a fractional amount still
// shows both places so a total is never silently rounded on screen.
export function formatMoney(amount: string | number, currency = 'BDT', locale = 'en-BD'): string {
  const value = typeof amount === 'string' ? Number.parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return '—';
  const fractional = Math.abs(value % 1) > 0.0001;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: fractional ? 2 : 0,
    maximumFractionDigits: fractional ? 2 : 0,
  }).format(value);
}

export function formatDate(value: string | Date | null | undefined, locale = 'en-GB'): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(date);
}

export function formatDateTime(value: string | Date | null | undefined, locale = 'en-GB'): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function formatRelative(value: string | Date, locale = 'en-GB'): string {
  const date = value instanceof Date ? value : new Date(value);
  const seconds = Math.round((date.getTime() - Date.now()) / 1000);
  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['year', 31536000],
    ['month', 2592000],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  const formatter = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return formatter.format(Math.round(seconds / size), unit);
  }
  return formatter.format(Math.round(seconds), 'second');
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}
