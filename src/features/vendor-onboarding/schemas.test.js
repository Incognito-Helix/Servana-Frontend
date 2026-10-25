import { describe, expect, it } from "vitest"
import { step1SchemaFor, step2Payload, step2Schema } from "./schemas"

const SERVICES = ["Makeup", "Hair", "Nails", "Lashes", "Barbing"]
const step1 = (overrides = {}) => ({
  businessName: "Bisi Makeovers",
  primaryService: "Makeup",
  otherServices: ["Hair"],
  about: "Bridal and event makeup in Lekki.",
  ...overrides,
})
const step2 = (overrides = {}) => ({
  phone: "08031234567",
  whatsappSame: true,
  whatsapp: "",
  socials: { instagram: "", tiktok: "", x: "", facebook: "", other: "" },
  ...overrides,
})
const messages = (result) => result.error.issues.map((issue) => issue.message)
const schema1 = step1SchemaFor(SERVICES)

describe("step 1 rules", () => {
  it("accepts a valid form", () => expect(schema1.safeParse(step1()).success).toBe(true))

  it("checks the business name length", () => {
    expect(messages(schema1.safeParse(step1({ businessName: "A" })))).toContain(
      "Business name must be at least 2 characters",
    )
    expect(messages(schema1.safeParse(step1({ businessName: "x".repeat(81) })))).toContain(
      "Business name must be at most 80 characters",
    )
  })

  it("needs a main service from the active list", () => {
    expect(messages(schema1.safeParse(step1({ primaryService: "" })))).toContain(
      "Pick your main service",
    )
    expect(messages(schema1.safeParse(step1({ primaryService: "Old service" })))).toContain(
      "That service is not available",
    )
  })

  it("limits other services to 3 and blocks repeating the main one", () => {
    expect(
      messages(schema1.safeParse(step1({ otherServices: ["Hair", "Nails", "Lashes", "Barbing"] }))),
    ).toContain("Pick up to 3 other services")
    expect(messages(schema1.safeParse(step1({ otherServices: ["Makeup"] })))).toContain(
      "Your main service cannot be repeated here",
    )
  })

  it("keeps contact details out of the about text", () => {
    expect(messages(schema1.safeParse(step1({ about: "Email me at a@b.com" })))).toContain(
      "Remove phone numbers and email addresses from your about section",
    )
    expect(messages(schema1.safeParse(step1({ about: "x".repeat(501) })))).toContain(
      "Keep it under 500 characters",
    )
  })
})

describe("step 2 rules", () => {
  it("accepts a valid form, with or without social links", () => {
    expect(step2Schema.safeParse(step2()).success).toBe(true)
    expect(
      step2Schema.safeParse(
        step2({
          socials: {
            instagram: "https://instagram.com/bisi",
            tiktok: "",
            x: "",
            facebook: "",
            other: "",
          },
        }),
      ).success,
    ).toBe(true)
  })

  it("rejects an invalid phone number and bad links", () => {
    expect(step2Schema.safeParse(step2({ phone: "12345" })).success).toBe(false)
    expect(
      step2Schema.safeParse(
        step2({
          socials: { instagram: "instagram.com/bisi", tiktok: "", x: "", facebook: "", other: "" },
        }),
      ).success,
    ).toBe(false)
  })

  it("checks WhatsApp only when it differs from the phone number", () => {
    expect(step2Schema.safeParse(step2({ whatsappSame: false, whatsapp: "nope" })).success).toBe(
      false,
    )
    expect(
      step2Schema.safeParse(step2({ whatsappSame: false, whatsapp: "0805 555 0101" })).success,
    ).toBe(true)
  })
})

describe("what step 2 saves", () => {
  it("defaults WhatsApp to the phone number and stores +234 numbers", () => {
    expect(step2Payload(step2())).toMatchObject({
      phone: "+2348031234567",
      whatsapp: "+2348031234567",
    })
  })
  it("keeps a different WhatsApp number", () => {
    expect(step2Payload(step2({ whatsappSame: false, whatsapp: "0805 555 0101" })).whatsapp).toBe(
      "+2348055550101",
    )
  })
})
