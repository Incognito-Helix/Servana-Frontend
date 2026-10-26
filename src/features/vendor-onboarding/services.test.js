import { describe, expect, it } from "vitest"
import {
  koboToInput,
  lowestPriceKobo,
  parseNairaToKobo,
  servicesPayload,
  servicesToDefaults,
} from "./services"

describe("naira input to kobo", () => {
  it.each([
    ["40000", 4000000],
    ["40,000", 4000000],
    ["₦1,500.50", 150050],
    ["1500.5", 150050],
    ["0.99", 99],
    ["19.99", 1999],
    [" 250 ", 25000],
  ])("reads %s", (input, kobo) => expect(parseNairaToKobo(input)).toBe(kobo))

  it.each(["", "abc", "-5", "12.345", "1e5", "1.2.3", "1234567890"])("rejects %s", (input) =>
    expect(parseNairaToKobo(input)).toBeNaN(),
  )

  it("reads zero as zero, which the form rejects as a price", () =>
    expect(parseNairaToKobo("0")).toBe(0))
})

describe("kobo back to input text", () => {
  it("writes whole naira and kobo", () => {
    expect(koboToInput(4000000)).toBe("40000")
    expect(koboToInput(150050)).toBe("1500.50")
    expect(koboToInput(99)).toBe("0.99")
  })
  it("leaves bad values empty", () => {
    for (const bad of [null, undefined, 0, -5, 1.5]) expect(koboToInput(bad)).toBe("")
  })
})

describe("saved service data", () => {
  it("converts rows to integer kobo and trims names", () => {
    const payload = servicesPayload({
      services: [{ name: "  Bridal makeup ", startPrice: "40,000", maxPrice: "" }],
    })
    expect(payload.services).toEqual([
      { name: "Bridal makeup", priceFromKobo: 4000000, maxPriceKobo: null },
    ])
  })

  it("keeps half-typed prices as null so autosave does not break", () => {
    const payload = servicesPayload({
      services: [{ name: "Hair", startPrice: "abc", maxPrice: "0" }],
    })
    expect(payload.services[0]).toMatchObject({ priceFromKobo: null, maxPriceKobo: null })
  })

  it("starts with one empty row, and reloads saved rows as naira text", () => {
    expect(servicesToDefaults(undefined)).toHaveLength(1)
    expect(
      servicesToDefaults([{ name: "Hair", priceFromKobo: 150050, maxPriceKobo: null }]),
    ).toEqual([{ name: "Hair", startPrice: "1500.50", maxPrice: "" }])
  })
})

describe("lowest price", () => {
  it("is the smallest starting price", () => {
    const rows = [{ priceFromKobo: 4000000 }, { priceFromKobo: 1500000 }, { priceFromKobo: null }]
    expect(lowestPriceKobo(rows)).toBe(1500000)
  })
  it("is null when there is no usable price", () => {
    expect(lowestPriceKobo([])).toBeNull()
    expect(lowestPriceKobo([{ priceFromKobo: null }])).toBeNull()
    expect(lowestPriceKobo(undefined)).toBeNull()
  })
})
