import { describe, expect, it } from "vitest"
import { stepValidators } from "./vendor.validators"

const mine = { userId: "u_vendor" }
const contact = (phone) => ({ phone, whatsapp: phone, socials: {} })

describe("mock duplicate phone check", () => {
  it("rejects a number another vendor already uses, with a clear message", () => {
    const errors = stepValidators[2](contact("08000000001"), mine, {})
    expect(errors.phone).toMatch(/already used by another vendor/i)
  })

  it("rejects a number saved on another vendor's profile", () => {
    const profiles = { u_other: { userId: "u_other", phone: "+2348055550101" } }
    expect(stepValidators[2](contact("0805 555 0101"), mine, profiles).phone).toMatch(
      /already used/i,
    )
  })

  it("lets a vendor keep their own number", () => {
    const profiles = { u_vendor: { userId: "u_vendor", phone: "+2348055550101" } }
    expect(stepValidators[2](contact("08055550101"), mine, profiles).phone).toBeUndefined()
  })
})

describe("mock step 1 checks", () => {
  it("returns field errors for each problem", () => {
    const errors = stepValidators[1]({
      businessName: "A",
      primaryService: "",
      otherServices: [],
      about: "mail a@b.com",
    })
    expect(errors).toMatchObject({
      businessName: expect.any(String),
      primaryService: expect.any(String),
      about: expect.any(String),
    })
  })

  it("accepts a valid form", () => {
    const errors = stepValidators[1]({
      businessName: "Bisi Makeovers",
      primaryService: "Makeup",
      otherServices: ["Hair"],
      about: "",
    })
    expect(errors).toEqual({})
  })
})
