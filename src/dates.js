// Resume date ranges, kept free of Vite and JSON imports so the tests can load them in Node.
export const isCurrent = (date) => /\bpresent\b/i.test(date);

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
// End of a date range as a month count: "Jan 2025 – Apr 2025" is Apr 2025, a bare
// "2025" is its December, and "Feb 2026 – Present" ends now.
export function endMonth(date) {
  if (isCurrent(date)) return Infinity;
  const parts = [...date.toLowerCase().matchAll(/(?:([a-z]{3})[a-z]*\s+)?(\d{4})/g)];
  if (!parts.length) return 0;
  const [, mon, year] = parts[parts.length - 1];
  return Number(year) * 12 + (mon && MONTHS.includes(mon) ? MONTHS.indexOf(mon) : 11);
}
