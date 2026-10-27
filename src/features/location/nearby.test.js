import { describe, it, expect } from "vitest"
import { nearbyZones } from "./geo"

const zones = [
  { id: "yaba", name: "Yaba", lat: 6.5095, lng: 3.3711 },
  { id: "surulere", name: "Surulere", lat: 6.5, lng: 3.35 },
  { id: "ikeja", name: "Ikeja", lat: 6.6018, lng: 3.3515 },
  { id: "lekki", name: "Lekki", lat: 6.4474, lng: 3.4723 },
]

describe("nearbyZones", () => {
  it("lists the closest other zones first", () => {
    expect(nearbyZones("yaba", zones, 2).map((z) => z.id)).toEqual(["surulere", "ikeja"])
  })
  it("never includes the current zone", () => {
    expect(nearbyZones("yaba", zones).map((z) => z.id)).not.toContain("yaba")
  })
  it("returns nothing for an unknown zone or zones without coordinates", () => {
    expect(nearbyZones("nowhere", zones)).toEqual([])
    expect(
      nearbyZones("a", [
        { id: "a", name: "A" },
        { id: "b", name: "B" },
      ]),
    ).toEqual([])
  })
})
