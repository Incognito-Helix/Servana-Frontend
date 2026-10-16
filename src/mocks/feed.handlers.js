import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { zones, vendors } from "./fixtures"
const API = import.meta.env.VITE_API_URL

// ASSUMED shape (matches what I proposed to the backend lead):
// { top: [vendor, ...], popular: { zone, vendors: [...] } | null }
export const feedHandlers = [
  http.get(`${API}/feed`, async ({ request }) => {
    await delay(300)
    const zoneId = new URL(request.url).searchParams.get("zone")
    const zone = zones.find((z) => z.id === zoneId)
    if (!zone) return fail(400, "LOCATION_REQUIRED", "Pick a location first.")

    // Top vendors: organic only (no boost in effect), in the customer's zone.
    const top = vendors.filter((v) => !v.boost && v.zoneId === zone.id)
    // Popular: boosted for this zone, Top Spot first. Built in the next card.
    const rank = (v) => (v.boost.type === "top_spot" ? 0 : 1)
    const boosted = vendors
      .filter((v) => v.boost?.zones?.includes(zone.id))
      .sort((a, b) => rank(a) - rank(b))

    return ok({
      top: top.slice(0, 10),
      popular: boosted.length ? { zone, vendors: boosted.slice(0, 8) } : null,
    })
  }),
]
