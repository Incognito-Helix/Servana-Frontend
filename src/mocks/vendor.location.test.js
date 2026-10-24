import { describe, expect, it } from "vitest"
import { stepSavers, stepValidators } from "./vendor.validators"

const DAY = 24 * 60 * 60 * 1000
const base = {
  state: "Lagos",
  city: "Lagos",
  zone: "lekki",
  locationSource: "zone",
  latitude: 6.4474,
  longitude: 3.4723,
  homeService: false,
  travelRadiusKm: null,
  worksRemotely: false,
}
const moved = { ...base, zone: "ikeja", latitude: 6.6018, longitude: 3.3515 }
const drafting = { userId: "u1", status: "draft", primaryService: "Makeup" }

describe("mock step 3 checks", () => {
  it("accepts a valid location", () => expect(stepValidators[3](base, drafting, {})).toEqual({}))

  it("flags missing fields", () => {
    const errors = stepValidators[3]({ ...base, state: "", city: "", zone: "" }, drafting, {})
    expect(errors).toMatchObject({
      state: expect.any(String),
      city: expect.any(String),
      zone: expect.any(String),
    })
  })

  it("rejects coordinates outside Lagos", () => {
    const errors = stepValidators[3](
      { ...base, locationSource: "device", latitude: 51.5, longitude: -0.12 },
      drafting,
      {},
    )
    expect(errors.latitude).toBeTruthy()
  })

  it("only allows Works remotely for Tech and creative", () => {
    expect(
      stepValidators[3]({ ...base, worksRemotely: true }, drafting, {}).worksRemotely,
    ).toBeTruthy()
    const designer = { ...drafting, primaryService: "Web design" }
    expect(
      stepValidators[3]({ ...base, worksRemotely: true }, designer, {}).worksRemotely,
    ).toBeUndefined()
  })

  it("needs a travel radius for home service", () => {
    const errors = stepValidators[3](
      { ...base, homeService: true, travelRadiusKm: null },
      drafting,
      {},
    )
    expect(errors.travelRadiusKm).toBeTruthy()
  })

  it("blocks a base change during the cooldown and names the date", () => {
    const approved = {
      ...drafting,
      ...base,
      status: "approved",
      baseLocationChangedAt: new Date(Date.now() - 2 * DAY).toISOString(),
    }
    expect(stepValidators[3](moved, approved, {}).zone).toMatch(/can change it again on/)
  })

  it("allows a base change after the cooldown", () => {
    const approved = {
      ...drafting,
      ...base,
      status: "approved",
      baseLocationChangedAt: new Date(Date.now() - 8 * DAY).toISOString(),
    }
    expect(stepValidators[3](moved, approved, {}).zone).toBeUndefined()
  })
})

describe("mock step 3 saving", () => {
  const approved = { ...drafting, ...base, status: "approved" }

  it("saves location changes freely while drafting", () => {
    const saved = stepSavers[3](moved, { ...drafting, ...base }, false)
    expect(saved.zone).toBe("ikeja")
    expect(saved.baseLocationChangedAt).toBeUndefined()
  })

  it("does not let autosave commit a base change after setup", () => {
    const saved = stepSavers[3](
      { ...moved, homeService: true, travelRadiusKm: 12 },
      approved,
      false,
    )
    expect(saved.zone).toBeUndefined()
    expect(saved.latitude).toBeUndefined()
    expect(saved.homeService).toBe(true)
  })

  it("stamps the change time on Save and continue", () => {
    const saved = stepSavers[3](moved, approved, true)
    expect(saved.zone).toBe("ikeja")
    expect(Date.parse(saved.baseLocationChangedAt)).toBeGreaterThan(Date.now() - 5000)
  })

  it("ignores a change time sent by the browser", () => {
    const saved = stepSavers[3](
      { ...base, baseLocationChangedAt: "2020-01-01T00:00:00Z" },
      approved,
      true,
    )
    expect(saved.baseLocationChangedAt).toBeUndefined()
  })
})
describe("cooldown lifts", () => {
  const recent = new Date(Date.now() - 2 * DAY).toISOString()
  const approved = { ...drafting, ...base, status: "approved", baseLocationChangedAt: recent }

  it("lets a vendor with an active boost change location during the cooldown", () => {
    expect(stepValidators[3](moved, { ...approved, hasActiveBoost: true }, {}).zone).toBeUndefined()
  })

  it("lets an admin override the cooldown", () => {
    expect(
      stepValidators[3](moved, { ...approved, cooldownOverride: true }, {}).zone,
    ).toBeUndefined()
  })

  it("still blocks without a boost or an override", () => {
    expect(stepValidators[3](moved, approved, {}).zone).toMatch(/or sooner while a boost is active/)
  })

  it("still records the change time while a boost is active", () => {
    expect(
      stepSavers[3](moved, { ...approved, hasActiveBoost: true }, true).baseLocationChangedAt,
    ).toBeTruthy()
  })
})
