import { describe, it, expect } from "vitest"
import { nairaToKobo, koboToNaira, formatNaira, formatPriceFrom } from "./money"

describe("money", () => {
  it("converts naira to kobo without float errors", () => {
    expect(nairaToKobo(1000)).toBe(100000)
    expect(nairaToKobo(19.99)).toBe(1999)
    expect(nairaToKobo("40000")).toBe(4000000)
    expect(nairaToKobo("")).toBeNaN()
  })

  it("converts kobo to naira", () => {
    expect(koboToNaira(150050)).toBe(1500.5)
  })

  it("formats kobo as naira", () => {
    expect(formatNaira(4000000)).toBe("₦40,000")
    expect(formatNaira(100000)).toBe("₦1,000")
    expect(formatNaira(150050)).toBe("₦1,500.50")
    expect(formatNaira(99)).toBe("₦0.99")
    expect(formatNaira(0)).toBe("₦0")
    expect(formatNaira(123456789)).toBe("₦1,234,567.89")
    expect(formatNaira(-50000)).toBe("-₦500")
  })

  it("returns an empty string for bad input", () => {
    expect(formatNaira(NaN)).toBe("")
    expect(formatNaira(undefined)).toBe("")
    expect(formatNaira("100")).toBe("")
  })

  it("formats the From price", () => {
    expect(formatPriceFrom(4000000)).toBe("From ₦40,000")
    expect(formatPriceFrom(undefined)).toBe("")
  })
})
