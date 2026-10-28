export const DAY_NAMES = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
]

const cleanTime = (t) => (typeof t === "string" && /^\d{2}:\d{2}/.test(t) ? t.slice(0, 5) : null)
const readDay = (row) => row.dayOfWeek ?? row.day_of_week ?? row.day

export function to12h(time) {
  const [h, m] = time.split(":").map(Number)
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`
}

// One entry per day, Monday first. An empty list means "hours not given".
// ASSUMED day numbers: Monday = 1 ... Sunday = 7, or Sunday = 0 ... Saturday = 6.
export function normalizeHours(raw) {
  const rows = Array.isArray(raw) ? raw : []
  if (rows.length === 0) return []
  const zeroBased = rows.some((r) => readDay(r) === 0)
  const byDay = new Map()
  for (const row of rows) {
    const d = readDay(row)
    let i = -1
    if (typeof d === "number") i = zeroBased ? (d + 6) % 7 : d - 1
    else if (typeof d === "string" && d.trim().length >= 3) {
      i = DAY_NAMES.findIndex((n) => n.toLowerCase().startsWith(d.trim().toLowerCase().slice(0, 3)))
    }
    if (i < 0 || i > 6) continue
    const open = cleanTime(row.openTime ?? row.open_time ?? row.open)
    const close = cleanTime(row.closeTime ?? row.close_time ?? row.close)
    const flagged = Boolean(row.isClosed ?? row.is_closed ?? row.closed)
    byDay.set(i, { day: i, open, close, closed: flagged || !open || !close })
  }
  return DAY_NAMES.map((_, i) => byDay.get(i) ?? { day: i, open: null, close: null, closed: true })
}

// Opening hours are in Lagos time (PRD 6.4), whatever time zone the visitor is in.
const lagosFormat = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Africa/Lagos",
  weekday: "long",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

export function lagosNow(now = new Date()) {
  const parts = Object.fromEntries(lagosFormat.formatToParts(now).map((p) => [p.type, p.value]))
  return {
    day: DAY_NAMES.indexOf(parts.weekday),
    minutes: Number(parts.hour) * 60 + Number(parts.minute),
  }
}

const toMinutes = (t) => {
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

export function openStatus(hours, now = new Date()) {
  if (!hours || hours.length === 0) return { state: "unknown", label: "" }
  const { day, minutes } = lagosNow(now)
  const today = hours[day]
  if (!today || today.closed) return { state: "closed", label: "Closed today" }
  const open = toMinutes(today.open)
  const close = toMinutes(today.close)
  if (minutes >= open && minutes < close) {
    return { state: "open", label: `Open now · closes ${to12h(today.close)}` }
  }
  if (minutes < open) return { state: "closed", label: `Closed now · opens ${to12h(today.open)}` }
  return { state: "closed", label: "Closed now" }
}
