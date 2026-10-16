import { describe, it, expect } from "vitest"
import { normalizeFeed, vendorName } from "./feed"

describe("normalizeFeed", () => {
  it("reads top and popular", () => {
    const f = normalizeFeed({
      top: [{ id: 1 }],
      popular: { zone: { id: "lekki" }, vendors: [{ id: 2 }] },
    })
    expect(f.top).toHaveLength(1)
    expect(f.popular.vendors).toHaveLength(1)
  })
  it("treats a missing popular section as none", () => {
    expect(normalizeFeed({ top: [] }).popular).toBeNull()
  })
  it("survives an empty or wrong response", () => {
    expect(normalizeFeed(undefined)).toEqual({ top: [], popular: null })
    expect(normalizeFeed({ top: "oops" }).top).toEqual([])
  })
  it("finds a vendor name", () => {
    expect(vendorName({ businessName: "Bisi Makeovers" })).toBe("Bisi Makeovers")
    expect(vendorName({ name: "Ada" })).toBe("Ada")
    expect(vendorName({})).toBe("Vendor")
  })
})
