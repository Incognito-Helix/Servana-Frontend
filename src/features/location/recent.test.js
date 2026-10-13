import { describe, it, expect } from "vitest"
import { addRecent, normalizeZones, zoneLabel } from "./recent"

const z = (id, name) => ({ id, name, city: "Lagos" })

describe("location helpers", () => {
  it("keeps the last 3, newest first", () => {
    let r = []
    for (const zone of [z(1, "Ajah"), z(2, "Lekki"), z(3, "Yaba"), z(4, "Ikeja")]) {
      r = addRecent(r, zone)
    }
    expect(r.map((x) => x.name)).toEqual(["Ikeja", "Yaba", "Lekki"])
  })

  it("moves a repeated zone to the front without duplicating", () => {
    let r = addRecent(addRecent([], z(1, "Ajah")), z(2, "Lekki"))
    r = addRecent(r, z(1, "Ajah"))
    expect(r.map((x) => x.name)).toEqual(["Ajah", "Lekki"])
  })

  it("accepts arrays and wrapped responses, and drops bad entries", () => {
    expect(normalizeZones([z(1, "Ajah"), null, { id: 2 }])).toHaveLength(1)
    expect(normalizeZones({ zones: [z(1, "Ajah")] })).toHaveLength(1)
    expect(normalizeZones(undefined)).toEqual([])
  })

  it("builds a label", () => {
    expect(zoneLabel(z(1, "Ajah"))).toBe("Ajah, Lagos")
    expect(zoneLabel({ id: 1, name: "Ajah" })).toBe("Ajah")
  })
})
