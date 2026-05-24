/** Shown when departure must be now or later; same local minute as now counts as valid. */
export const DEPARTURE_NOW_OR_FUTURE_MESSAGE =
  "Please ensure your date and time is now or in the future.";

/** Choose-time tab: under the date field. */
export const DEPARTURE_DATE_ONLY_HINT =
  "Past dates cannot be selected. Choose today or a future day.";

/** Local calendar instant from YYYY-MM-DD + HH:mm; null if malformed. */
export function parseLocalDepartureMs(
  date: string,
  time: string,
): number | null {
  const dm = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  const tm = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!dm || !tm) return null;
  const y = Number(dm[1]);
  const mo = Number(dm[2]);
  const d = Number(dm[3]);
  const h = Number(tm[1]);
  const mi = Number(tm[2]);
  if (![y, mo, d, h, mi].every((n) => Number.isFinite(n))) return null;
  const ms = new Date(y, mo - 1, d, h, mi, 0, 0).getTime();
  return Number.isNaN(ms) ? null : ms;
}

/** Start of the given instant's minute in local time (ms). */
function startOfLocalMinuteMs(d: Date): number {
  return new Date(
    d.getFullYear(),
    d.getMonth(),
    d.getDate(),
    d.getHours(),
    d.getMinutes(),
    0,
    0,
  ).getTime();
}

/**
 * True when the chosen YYYY-MM-DD + HH:mm is before the
 * current local minute. Same calendar minute as "now" counts as valid so
 * "Now" / current picker values are not rejected mid-minute.
 */
export function isChosenDepartureInPast(date: string, time: string): boolean {
  const ms = parseLocalDepartureMs(date, time);
  if (ms === null) return true;
  return ms < startOfLocalMinuteMs(new Date());
}
