export const LAGOS_TIME_ZONE = "Africa/Lagos"

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

const partsFormatter = new Intl.DateTimeFormat("en-US", {
  timeZone: LAGOS_TIME_ZONE,
  year: "numeric",
  month: "numeric",
  day: "numeric",
  hour: "numeric",
  minute: "numeric",
  hourCycle: "h23",
})

function lagosParts(input) {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) return null
  const parts = {}
  for (const { type, value } of partsFormatter.formatToParts(date)) {
    if (type !== "literal") parts[type] = Number(value)
  }
  parts.hour %= 24
  return parts
}

// "9 Oct 2026"
export function formatLagosDate(input) {
  const p = lagosParts(input)
  return p ? `${p.day} ${MONTHS[p.month - 1]} ${p.year}` : ""
}

// "9 Oct 2026, 3:05 PM"
export function formatLagosDateTime(input) {
  const p = lagosParts(input)
  if (!p) return ""
  const hour12 = p.hour % 12 || 12
  const suffix = p.hour < 12 ? "AM" : "PM"
  const minutes = String(p.minute).padStart(2, "0")
  return `${p.day} ${MONTHS[p.month - 1]} ${p.year}, ${hour12}:${minutes} ${suffix}`
}
