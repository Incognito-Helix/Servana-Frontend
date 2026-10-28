import { describe, it, expect } from "vitest"
import { toProfileData, safeUrl, priceText } from "./profileData"

describe("profile data", () => {
  it("never carries phone or WhatsApp numbers", () => {
    const p = toProfileData({
      id: "1",
      slug: "bisi",
      name: "Bisi",
      phone: "08031234567",
      whatsapp: "08031234567",
      contact: { phone: "08039999999" },
    })
    expect(JSON.stringify(p)).not.toMatch(/0803/)
  })

  it("reads bio as the about text", () => {
    expect(toProfileData({ id: "1", slug: "a", name: "A", bio: "Hello" }).about).toBe("Hello")
    expect(toProfileData({ id: "1", slug: "a", name: "A" }).about).toBe("")
  })

  it("builds price text from kobo", () => {
    expect(priceText(500000, null)).toBe("₦5,000")
    expect(priceText(500000, 800000)).toBe("₦5,000 to ₦8,000")
    expect(priceText(null, null)).toBe("Ask for price")
  })

  it("keeps only web links", () => {
    expect(safeUrl("javascript:alert(1)")).toBeNull()
    expect(safeUrl("not a url")).toBeNull()
    expect(safeUrl("https://instagram.com/bisi")).toBe("https://instagram.com/bisi")
    const p = toProfileData({
      id: "1",
      slug: "a",
      name: "A",
      socialLinks: [
        { platform: "x", url: "javascript:alert(1)" },
        { platform: "instagram", url: "https://instagram.com/a" },
      ],
    })
    expect(p.socials).toHaveLength(1)
  })

  it("turns plain image addresses into image objects", () => {
    const p = toProfileData({
      id: "1",
      slug: "a",
      name: "A",
      portfolio: ["https://x.test/1.jpg", { url: "" }],
    })
    expect(p.portfolio).toEqual([{ url: "https://x.test/1.jpg", alt: "" }])
  })
})
