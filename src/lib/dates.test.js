import { describe, it, expect } from "vitest"
import { formatLagosDate, formatLagosDateTime } from "./dates"

describe("Lagos dates", () => {
  it("formats an afternoon time in Lagos time", () => {
    expect(formatLagosDateTime("2026-10-08T14:05:00Z")).toBe("8 Oct 2026, 3:05 PM")
  })

  it("rolls over midnight because Lagos is UTC+1", () => {
    expect(formatLagosDate("2026-10-08T23:30:00Z")).toBe("9 Oct 2026")
    expect(formatLagosDateTime("2026-10-08T23:30:00Z")).toBe("9 Oct 2026, 12:30 AM")
  })

  it("shows noon as 12:00 PM", () => {
    expect(formatLagosDateTime("2026-01-01T11:00:00Z")).toBe("1 Jan 2026, 12:00 PM")
  })

  it("accepts Date objects and returns empty text for bad input", () => {
    expect(formatLagosDate(new Date("2026-03-05T10:00:00Z"))).toBe("5 Mar 2026")
    expect(formatLagosDate("not a date")).toBe("")
  })
})
