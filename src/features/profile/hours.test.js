import { describe, it, expect } from "vitest"
import { normalizeHours, openStatus, to12h } from "./hours"

const monToSat = [1, 2, 3, 4, 5, 6].map((d) => ({
  dayOfWeek: d,
  openTime: "09:00",
  closeTime: "18:00",
  isClosed: false,
}))
const week = normalizeHours([...monToSat, { dayOfWeek: 7, isClosed: true }])

describe("opening hours", () => {
  it("reads Monday = 1 to Sunday = 7", () => {
    expect(week[0]).toMatchObject({ open: "09:00", close: "18:00", closed: false })
    expect(week[6].closed).toBe(true)
  })

  it("also reads Sunday = 0", () => {
    const zeroBased = normalizeHours([
      { dayOfWeek: 0, isClosed: true },
      ...monToSat.map((d) => ({ ...d })),
    ])
    expect(zeroBased[6].closed).toBe(true)
    expect(zeroBased[0].open).toBe("09:00")
  })

  it("says when it is open, in Lagos time", () => {
    const s = openStatus(week, new Date("2026-10-21T10:00:00+01:00")) // Wednesday
    expect(s.state).toBe("open")
    expect(s.label).toBe("Open now · closes 6:00 PM")
  })

  it("says when it is closed", () => {
    expect(openStatus(week, new Date("2026-10-21T19:30:00+01:00")).label).toBe("Closed now")
    expect(openStatus(week, new Date("2026-10-21T07:00:00+01:00")).label).toBe(
      "Closed now · opens 9:00 AM",
    )
    expect(openStatus(week, new Date("2026-10-25T12:00:00+01:00")).label).toBe("Closed today") // Sunday
  })

  it("uses Lagos time, not the visitor's", () => {
    // 23:30 UTC on Wednesday is 00:30 on Thursday in Lagos.
    expect(openStatus(week, new Date("2026-10-21T23:30:00Z")).label).toBe(
      "Closed now · opens 9:00 AM",
    )
  })

  it("does not guess when there are no hours", () => {
    expect(openStatus([], new Date()).state).toBe("unknown")
  })

  it("formats 12-hour times", () => {
    expect(to12h("09:00")).toBe("9:00 AM")
    expect(to12h("13:30")).toBe("1:30 PM")
    expect(to12h("00:05")).toBe("12:05 AM")
    expect(to12h("12:00")).toBe("12:00 PM")
  })
})
