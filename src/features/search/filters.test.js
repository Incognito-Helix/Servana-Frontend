import { describe, it, expect } from "vitest"
import {
  EMPTY_FILTERS,
  validatePrice,
  parseFilters,
  applyFilters,
  clearFilters,
  removeFilter,
  countActive,
  toApiParams,
  describeFilters,
} from "./filters"

const p = (s) => new URLSearchParams(s)

describe("price validation", () => {
  it("accepts blanks, zero and whole numbers", () => {
    expect(validatePrice("", "")).toEqual({ min: null, max: null, error: "" })
    expect(validatePrice("0", "500")).toEqual({ min: 0, max: 500, error: "" })
  })
  it("rejects commas, decimals and symbols", () => {
    expect(validatePrice("5,000", "").error).toBeTruthy()
    expect(validatePrice("12.5", "").error).toBeTruthy()
    expect(validatePrice("", "₦500").error).toBeTruthy()
  })
  it("rejects a minimum above the maximum", () => {
    expect(validatePrice("900", "100").error).toBeTruthy()
  })
})

describe("filters in the URL", () => {
  it("reads every filter", () => {
    expect(
      parseFilters(p("minPrice=5000&maxPrice=20000&rating=4.5&homeService=1&openNow=1")),
    ).toEqual({
      minPrice: 5000,
      maxPrice: 20000,
      rating: 4.5,
      homeService: true,
      openNow: true,
    })
  })
  it("ignores bad values", () => {
    expect(parseFilters(p("minPrice=abc&rating=9&homeService=yes&openNow=true"))).toEqual(
      EMPTY_FILTERS,
    )
  })
  it("drops both prices when the minimum is above the maximum", () => {
    const f = parseFilters(p("minPrice=900&maxPrice=100"))
    expect(f.minPrice).toBeNull()
    expect(f.maxPrice).toBeNull()
  })
  it("writes filters and keeps q and zone", () => {
    const values = { minPrice: 5000, maxPrice: null, rating: 4, homeService: true, openNow: false }
    const next = applyFilters(p("q=ma&zone=lekki"), values)
    expect(next.get("q")).toBe("ma")
    expect(next.get("zone")).toBe("lekki")
    expect(parseFilters(next)).toEqual(values)
  })
  it("clears filters but keeps q and zone", () => {
    const next = clearFilters(p("q=ma&zone=lekki&rating=4&homeService=1"))
    expect(next.toString()).toBe("q=ma&zone=lekki")
  })
  it("removes the price filter as one chip", () => {
    const next = removeFilter(p("zone=lekki&minPrice=100&maxPrice=900&rating=4"), "price")
    expect(next.get("minPrice")).toBeNull()
    expect(next.get("maxPrice")).toBeNull()
    expect(next.get("rating")).toBe("4")
  })
})

describe("filter helpers", () => {
  it("counts the price range as one filter", () => {
    expect(countActive({ ...EMPTY_FILTERS, minPrice: 1, maxPrice: 2, openNow: true })).toBe(2)
    expect(countActive(EMPTY_FILTERS)).toBe(0)
  })
  it("builds API params and keeps a zero minimum", () => {
    expect(toApiParams({ ...EMPTY_FILTERS, minPrice: 0, homeService: true })).toEqual({
      minPrice: 0,
      maxPrice: undefined,
      rating: undefined,
      homeService: true,
      openNow: undefined,
    })
    expect(toApiParams(EMPTY_FILTERS).homeService).toBeUndefined()
  })
  it("labels the chips", () => {
    const labels = describeFilters({
      minPrice: 5000,
      maxPrice: 20000,
      rating: 4,
      homeService: true,
      openNow: false,
    })
    expect(labels.map((l) => l.label)).toEqual(["₦5,000 to ₦20,000", "4+ stars", "Home service"])
  })
})
