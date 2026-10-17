import { describe, it, expect } from "vitest"
import { toCardData, formatNaira, lowestPriceKobo, ratingText, distanceText } from "./cardData"

describe("card helpers", () => {
  it("formats kobo as naira", () => {
    expect(formatNaira(500000)).toBe("₦5,000")
    expect(formatNaira(1250000)).toBe("₦12,500")
  })

  it("finds the lowest starting price, ignoring zero", () => {
    expect(
      lowestPriceKobo({ services: [{ priceMin: 800000 }, { priceMin: 500000 }, { priceMin: 0 }] }),
    ).toBe(500000)
    expect(lowestPriceKobo({ fromPrice: 300000, services: [{ priceMin: 100 }] })).toBe(300000)
    expect(lowestPriceKobo({ services: [] })).toBeNull()
  })

  it("formats ratings like 4.9 (124)", () => {
    expect(ratingText(4.9, 124)).toBe("4.9 (124)")
    expect(ratingText(4.87, 3)).toBe("4.9 (3)")
    expect(ratingText(null, 0)).toBe("No reviews yet")
    expect(ratingText(5, 0)).toBe("No reviews yet")
  })

  it("shows Remote in place of a distance", () => {
    expect(distanceText(2.46, false)).toBe("2.5 km")
    expect(distanceText(12, true)).toBe("Remote")
    expect(distanceText(null, false)).toBe("")
  })

  it("reads alternative field names", () => {
    const c = toCardData({
      id: "v1",
      slug: "bisi",
      name: "Bisi",
      zoneId: "victoria-island",
      rating: 4.5,
      reviews: [{}, {}],
      services: [{ priceMin: 300000 }],
    })
    expect(c.name).toBe("Bisi")
    expect(c.area).toBe("Victoria Island")
    expect(c.reviewCount).toBe(2)
    expect(c.fromKobo).toBe(300000)
  })
})
