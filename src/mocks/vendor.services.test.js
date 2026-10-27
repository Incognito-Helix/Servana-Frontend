import { describe, expect, it } from "vitest"
import { stepValidators } from "./vendor.validators"

const service = (overrides = {}) => ({
  name: "Bridal makeup",
  priceFromKobo: 4000000,
  maxPriceKobo: null,
  ...overrides,
})
const check = (...services) => stepValidators[4]({ services }, {}, {})

describe("mock step 4 checks", () => {
  it("accepts valid services", () => {
    expect(
      check(
        service(),
        service({ name: "Event makeup", maxPriceKobo: 2000000, priceFromKobo: 1500000 }),
      ),
    ).toEqual({})
  })

  it("needs at least one service", () => expect(check().services).toBeTruthy())

  it("points each error at the right row and field", () => {
    const errors = check(service(), service({ name: "Hair", priceFromKobo: 0, maxPriceKobo: -1 }))
    expect(errors["services.1.startPrice"]).toBeTruthy()
    expect(errors["services.1.maxPrice"]).toBeTruthy()
    expect(errors["services.0.name"]).toBeUndefined()
  })

  it("rejects a max below the starting price", () => {
    expect(check(service({ maxPriceKobo: 3000000 }))["services.0.maxPrice"]).toMatch(
      /cannot be below/,
    )
  })

  it("rejects duplicate names and decimal kobo", () => {
    expect(check(service(), service())["services.1.name"]).toBeTruthy()
    expect(check(service({ priceFromKobo: 100.5 }))["services.0.startPrice"]).toBeTruthy()
  })
})
