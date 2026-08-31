/** 'YYYY-MM-DD' in the browser's local timezone (not UTC) — used wherever
 * "today" needs to match what the user's own calendar shows, since the
 * backend's server clock and the user's local clock can be a day apart. */
export function toLocalDateString(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
