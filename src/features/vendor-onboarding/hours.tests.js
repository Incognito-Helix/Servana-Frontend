import { describe, expect, it } from "vitest"
import { DAYS, copyDay, dayProblem, defaultHours, hoursToDefaults } from "./hours"
import { hoursSchema } from "./schemas"

describe("one day", () => {
  it("is fine when open before close", () =>
    expect(dayProblem({ closed: false, open: "09:00", close: "18:00" })).toBe(""))

  it("rejects close before open, and equal times", () => {
    expect(dayProblem({ closed: false, open: "18:00", close: "09:00" })).toMatch(/before closing/)
    expect(dayProblem({ closed: false, open: "09:00", close: "09:00" })).toMatch(/before closing/)
  })

  it("rejects missing or impossible times", () => {
    for (const bad of [
      { closed: false, open: "", close: "18:00" },
      { closed: false, open: "09:00", close: "" },
      { closed: false, open: "25:00", close: "26:00" },
      { closed: false, open: "9:00", close: "18:00" },
    ]) {
      expect(dayProblem(bad)).toBeTruthy()
    }
  })

  it("ignores the times on a closed day", () => {
    expect(dayProblem({ closed: true, open: "", close: "" })).toBe("")
    expect(dayProblem({ closed: true, open: "18:00", close: "09:00" })).toBe("")
  })
})

describe("defaults", () => {
  it("opens Monday to Saturday 9 to 6 and closes Sunday", () => {
    const hours = defaultHours()
    expect(Object.keys(hours)).toHaveLength(DAYS.length)
    expect(hours.mon).toEqual({ closed: false, open: "09:00", close: "18:00" })
    expect(hours.sun.closed).toBe(true)
  })

  it("keeps saved days and fills the rest", () => {
    const hours = hoursToDefaults({
      tue: { closed: false, open: "10:00", close: "16:00" },
      wed: "bad",
    })
    expect(hours.tue).toEqual({ closed: false, open: "10:00", close: "16:00" })
    expect(hours.wed).toEqual({ closed: false, open: "09:00", close: "18:00" })
    expect(hoursToDefaults(undefined).sun.closed).toBe(true)
  })
})

describe("copy to all days", () => {
  it("copies the values and not the reference", () => {
    const monday = { closed: false, open: "08:00", close: "17:00" }
    const copy = copyDay(monday)
    expect(copy).toEqual(monday)
    expect(copy).not.toBe(monday)
  })
})

describe("hours form rules", () => {
  it("accepts the defaults", () => expect(hoursSchema.safeParse(defaultHours()).success).toBe(true))

  it("points an error at the bad day", () => {
    const hours = defaultHours()
    hours.tue = { closed: false, open: "18:00", close: "09:00" }
    const result = hoursSchema.safeParse(hours)
    expect(result.success).toBe(false)
    expect(result.error.issues[0].path).toEqual(["tue", "close"])
  })

  it("accepts a closed day with empty times", () => {
    const hours = defaultHours()
    hours.mon = { closed: true, open: "", close: "" }
    expect(hoursSchema.safeParse(hours).success).toBe(true)
  })
})
