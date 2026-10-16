import { describe, it, expect } from "vitest"
import { haversineKm, nearestZone, geoErrorMessage } from "./geo"

const zones = [
  { id: "lekki", name: "Lekki", lat: 6.4474, lng: 3.4723 },
  { id: "ikeja", name: "Ikeja", lat: 6.6018, lng: 3.3515 },
  { id: "yaba", name: "Yaba", lat: 6.5095, lng: 3.3711 },
]

describe("geo helpers", () => {
  it("measures distance in km", () => {
    expect(haversineKm({ lat: 6.5, lng: 3.3 }, { lat: 6.5, lng: 3.3 })).toBe(0)
    const km = haversineKm(
      { lat: zones[2].lat, lng: zones[2].lng },
      { lat: zones[1].lat, lng: zones[1].lng },
    )
    expect(km).toBeGreaterThan(10)
    expect(km).toBeLessThan(11)
  })

  it("picks the nearest zone", () => {
    expect(nearestZone({ lat: 6.51, lng: 3.37 }, zones).id).toBe("yaba")
    expect(nearestZone({ lat: 6.45, lng: 3.47 }, zones).id).toBe("lekki")
  })

  it("also reads centerLatitude and centerLongitude", () => {
    const real = [{ id: 1, name: "Ajah", centerLatitude: 6.4698, centerLongitude: 3.5852 }]
    expect(nearestZone({ lat: 6.47, lng: 3.58 }, real).name).toBe("Ajah")
  })

  it("returns null when no zone has coordinates", () => {
    expect(nearestZone({ lat: 6.5, lng: 3.3 }, [])).toBeNull()
    expect(nearestZone({ lat: 6.5, lng: 3.3 }, [{ id: 1, name: "X" }])).toBeNull()
  })

  it("explains a blocked permission", () => {
    expect(geoErrorMessage({ code: 1 })).toMatch(/blocked/)
    expect(geoErrorMessage({ code: 2 })).toMatch(/couldn't find/)
    expect(geoErrorMessage({ code: "UNSUPPORTED" })).toMatch(/browser/)
  })
})
