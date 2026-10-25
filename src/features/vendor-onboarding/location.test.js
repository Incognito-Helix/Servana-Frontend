import { describe, expect, it } from "vitest"
import { baseChanged, cooldownEnd, insideLagos, isLocked, isTechCreativeService } from "./location"
import { step3SchemaFor } from "./schemas"

const DAY = 24 * 60 * 60 * 1000
const categories = [
  { id: "beauty", children: ["Makeup"] },
  { id: "tech-creative", children: ["Web design"] },
]

describe("Lagos bounds", () => {
  it("accepts points in Lagos", () => {
    expect(insideLagos(6.4474, 3.4723)).toBe(true)
    expect(insideLagos(6.6194, 3.5105)).toBe(true)
  })

  it("rejects points elsewhere and bad values", () => {
    expect(insideLagos(51.5, -0.12)).toBe(false)
    expect(insideLagos(9.07, 7.4)).toBe(false)
    expect(insideLagos(NaN, 3.4)).toBe(false)
    expect(insideLagos(null, null)).toBe(false)
  })
})

describe("Tech and creative", () => {
  it("only matches services under that category", () => {
    expect(isTechCreativeService(categories, "Web design")).toBe(true)
    expect(isTechCreativeService(categories, "Makeup")).toBe(false)
    expect(isTechCreativeService(categories, undefined)).toBe(false)
    expect(isTechCreativeService(undefined, "Web design")).toBe(false)
  })
})

describe("base location changes", () => {
  const saved = {
    state: "Lagos",
    city: "Lagos",
    zone: "lekki",
    latitude: 6.4474,
    longitude: 3.4723,
  }

  it("is not a change before a base location exists", () =>
    expect(baseChanged({}, saved)).toBe(false))
  it("is not a change when nothing moved", () =>
    expect(baseChanged(saved, { ...saved })).toBe(false))
  it("ignores tiny coordinate noise", () =>
    expect(baseChanged(saved, { ...saved, latitude: 6.44741 })).toBe(false))
  it("sees a new zone or new coordinates", () => {
    expect(baseChanged(saved, { ...saved, zone: "ikeja" })).toBe(true)
    expect(baseChanged(saved, { ...saved, latitude: 6.5 })).toBe(true)
  })
})

describe("7-day cooldown", () => {
  const changedAt = "2026-10-20T10:00:00Z"
  const profile = { status: "approved", baseLocationChangedAt: changedAt }

  it("locks for 7 days after a change, then unlocks", () => {
    expect(isLocked(profile, Date.parse(changedAt) + 6 * DAY)).toBe(true)
    expect(isLocked(profile, Date.parse(changedAt) + 7 * DAY + 1)).toBe(false)
  })

  it("does not apply to drafts or to profiles that never changed", () => {
    expect(isLocked({ ...profile, status: "draft" }, Date.parse(changedAt) + DAY)).toBe(false)
    expect(isLocked({ status: "approved" }, Date.now())).toBe(false)
    expect(cooldownEnd({})).toBeNull()
  })
  it("is lifted while a boost is active", () => {
    const within = Date.parse(changedAt) + DAY
    expect(isLocked({ ...profile, hasActiveBoost: true }, within)).toBe(false)
    expect(isLocked({ ...profile, hasActiveBoost: false }, within)).toBe(true)
  })

  it("is lifted by an admin override", () => {
    expect(isLocked({ ...profile, cooldownOverride: true }, Date.parse(changedAt) + DAY)).toBe(
      false,
    )
  })
})

describe("step 3 form rules", () => {
  const zoneIds = ["lekki", "ikeja"]
  const normal = step3SchemaFor({ zoneIds, canWorkRemotely: false })
  const tech = step3SchemaFor({ zoneIds, canWorkRemotely: true })
  const valid = (overrides = {}) => ({
    state: "Lagos",
    city: "Lagos",
    zone: "lekki",
    locationSource: "zone",
    latitude: null,
    longitude: null,
    homeService: false,
    travelRadiusKm: "",
    worksRemotely: false,
    ...overrides,
  })
  const messages = (result) => result.error.issues.map((issue) => issue.message)

  it("accepts a valid form", () => expect(normal.safeParse(valid()).success).toBe(true))

  it("needs state, city and a real zone", () => {
    expect(messages(normal.safeParse(valid({ state: "", city: "", zone: "" })))).toEqual(
      expect.arrayContaining(["Pick your state", "Pick your city", "Pick your zone"]),
    )
    expect(messages(normal.safeParse(valid({ zone: "mars" })))).toContain(
      "That zone is not available",
    )
  })

  it("keeps device coordinates inside Lagos", () => {
    expect(
      normal.safeParse(valid({ locationSource: "device", latitude: 6.45, longitude: 3.39 }))
        .success,
    ).toBe(true)
    expect(
      normal.safeParse(valid({ locationSource: "device", latitude: 51.5, longitude: -0.12 }))
        .success,
    ).toBe(false)
  })

  it("needs a travel radius only when home service is on", () => {
    expect(normal.safeParse(valid({ homeService: true })).success).toBe(false)
    expect(normal.safeParse(valid({ homeService: true, travelRadiusKm: "0" })).success).toBe(false)
    expect(normal.safeParse(valid({ homeService: true, travelRadiusKm: "51" })).success).toBe(false)
    expect(normal.safeParse(valid({ homeService: true, travelRadiusKm: "10" })).success).toBe(true)
    expect(normal.safeParse(valid({ homeService: false, travelRadiusKm: "" })).success).toBe(true)
  })

  it("allows Works remotely only for Tech and creative", () => {
    expect(normal.safeParse(valid({ worksRemotely: true })).success).toBe(false)
    expect(tech.safeParse(valid({ worksRemotely: true })).success).toBe(true)
  })

  it("does not ask for a radius when working remotely", () => {
    expect(
      tech.safeParse(valid({ worksRemotely: true, homeService: true, travelRadiusKm: "" })).success,
    ).toBe(true)
  })
})
