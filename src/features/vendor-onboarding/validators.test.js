import { describe, expect, it } from "vitest"
import { containsContactInfo, isHttpUrl, normalizeNigerianPhone } from "./validators"

describe("Nigerian phone numbers", () => {
  it.each(["08031234567", "0803 123 4567", "+234 803 123 4567", "2348031234567", "0803-123-4567"])(
    "accepts %s",
    (input) => expect(normalizeNigerianPhone(input)).toBe("+2348031234567"),
  )

  it.each(["", "12345", "08031234", "06031234567", "+2348031234567890", "abc"])(
    "rejects %s",
    (input) => expect(normalizeNigerianPhone(input)).toBeNull(),
  )
})

describe("contact details in text", () => {
  it("catches emails and phone numbers", () => {
    expect(containsContactInfo("Write to ada@example.com")).toBe(true)
    expect(containsContactInfo("Call 0803 123 4567 today")).toBe(true)
    expect(containsContactInfo("WhatsApp +234 803 123 4567")).toBe(true)
  })

  it("leaves ordinary text alone", () => {
    expect(containsContactInfo("Open since 2015 - 2020, 5 years in Lekki")).toBe(false)
    expect(containsContactInfo("Bridal and event makeup, open 24/7")).toBe(false)
  })
})

describe("links", () => {
  it("accepts full web links only", () => {
    expect(isHttpUrl("https://instagram.com/bisi")).toBe(true)
    for (const bad of [
      "instagram.com/bisi",
      "javascript:alert(1)",
      "ftp://x.com",
      "https://localhost",
    ]) {
      expect(isHttpUrl(bad)).toBe(false)
    }
  })
})
