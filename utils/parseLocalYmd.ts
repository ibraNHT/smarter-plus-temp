/** Parse `YYYY-MM-DD` from `<input type="date">` as a local calendar day (avoids UTC weekday shifts). */
export function parseLocalYmd(ymd: string): Date {
  const [y, mo, d] = ymd.split('-').map(Number);
  if (!y || !mo || !d) return new Date();
  return new Date(y, mo - 1, d);
}

export function toLocalYmd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
