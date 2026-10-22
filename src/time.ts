/**
 * Human-facing dates use the machine's local calendar day, and stored timestamps keep
 * the local offset (2026-10-21T23:18:00.713-04:00), so a late-evening run is not dated tomorrow.
 */
function pad(value: number, width = 2): string {
  return String(Math.trunc(Math.abs(value))).padStart(width, '0');
}

export function localTimestamp(when: Date = new Date()): string {
  const offset = -when.getTimezoneOffset();
  const sign = offset >= 0 ? '+' : '-';
  return (
    `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}` +
    `T${pad(when.getHours())}:${pad(when.getMinutes())}:${pad(when.getSeconds())}.${pad(when.getMilliseconds(), 3)}` +
    `${sign}${pad(offset / 60)}:${pad(offset % 60)}`
  );
}

export function localDate(when: Date = new Date()): string {
  return localTimestamp(when).slice(0, 10);
}

/** The local day of a stored timestamp, whether it was written with Z or with an offset. */
export function localDateOf(timestamp: string | undefined): string | undefined {
  if (!timestamp) return undefined;
  const when = new Date(timestamp);
  return Number.isNaN(when.getTime()) ? undefined : localDate(when);
}
