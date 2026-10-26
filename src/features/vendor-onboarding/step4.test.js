import { describe, expect, it } from "vitest"
import { step4Schema } from "./schemas"

const row = (overrides = {}) => ({
  name: "Bridal makeup",
  startPrice: "40000",
  maxPrice: "",
  ...overrides,
})
const form = (...services) => ({ services })
const messages = (result) => result.error.issues.map((issue) => issue.message)

describe("step 4 rules", () => {
  it("accepts one valid service, with or without a max price", () => {
    expect(step4Schema.safeParse(form(row())).success).toBe(true)
    expect(step4Schema.safeParse(form(row({ maxPrice: "80,000" }))).success).toBe(true)
  })

  it("needs at least one service", () => {
    expect(messages(step4Schema.safeParse(form()))).toContain("Add at least one service")
  })

  it("allows at most 20 services", () => {
    const many = Array.from({ length: 21 }, (_, i) => row({ name: `Service ${i}` }))
    expect(messages(step4Schema.safeParse(form(...many)))).toContain(
      "You can add up to 20 services",
    )
  })

  it("needs a positive starting price", () => {
    for (const bad of ["", "0", "abc", "-5", "12.345"]) {
      expect(step4Schema.safeParse(form(row({ startPrice: bad }))).success).toBe(false)
    }
  })

  it("does not let the max price sit below the starting price", () => {
    expect(messages(step4Schema.safeParse(form(row({ maxPrice: "30000" }))))).toContain(
      "Max price cannot be below the starting price",
    )
    expect(step4Schema.safeParse(form(row({ maxPrice: "40000" }))).success).toBe(true)
  })

  it("rejects an invalid max price", () => {
    expect(step4Schema.safeParse(form(row({ maxPrice: "abc" }))).success).toBe(false)
  })

  it("rejects the same service name twice, ignoring capitals", () => {
    const result = step4Schema.safeParse(form(row(), row({ name: "bridal MAKEUP" })))
    expect(messages(result)).toContain("You already added this service")
  })

  it("needs a service name", () => {
    expect(step4Schema.safeParse(form(row({ name: "" }))).success).toBe(false)
  })
})
