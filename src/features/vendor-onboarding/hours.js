export const DAYS = [
  { key: "mon", label: "Monday" },
  { key: "tue", label: "Tuesday" },
  { key: "wed", label: "Wednesday" },
  { key: "thu", label: "Thursday" },
  { key: "fri", label: "Friday" },
  { key: "sat", label: "Saturday" },
  { key: "sun", label: "Sunday" },
]

export const DEFAULT_OPEN = "09:00"
export const DEFAULT_CLOSE = "18:00"

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/

export const defaultDay = (closed = false) => ({ closed, open: DEFAULT_OPEN, close: DEFAULT_CLOSE })

export const defaultHours = () =>
  Object.fromEntries(DAYS.map(({ key }) => [key, defaultDay(key === "sun")]))

export function hoursToDefaults(saved) {
  return Object.fromEntries(
    DAYS.map(({ key }) => {
      const day = saved?.[key]
      if (!day || typeof day !== "object") return [key, defaultDay(key === "sun")]
      return [
        key,
        {
          closed: Boolean(day.closed),
          open: day.open || DEFAULT_OPEN,
          close: day.close || DEFAULT_CLOSE,
        },
      ]
    }),
  )
}

// "" means the day is fine. Zero-padded HH:MM text compares correctly as plain strings.
export function dayProblem(day) {
  if (!day || day.closed) return ""
  if (!TIME.test(day.open ?? "") || !TIME.test(day.close ?? ""))
    return "Set an opening and closing time"
  if (day.open >= day.close) return "Opening time must be before closing time"
  return ""
}

export const copyDay = (day) => ({
  closed: Boolean(day?.closed),
  open: day?.open ?? "",
  close: day?.close ?? "",
})
