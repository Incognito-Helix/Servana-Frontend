import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { getSessionUser } from "./auth.handlers"
import { zones, categories, vendors, reviews } from "./fixtures"

const API = import.meta.env.VITE_API_URL
const MAX_SPONSORED = 3

const number = (value) => (value === null ? undefined : Number(value))
const priceFrom = (v) => Math.min(...v.services.map((s) => s.priceFromKobo))
const findVendor = (id) => vendors.find((v) => v.id === id || v.slug === id)
// Contact numbers only come from the contact endpoint, for logged-in users.
const publicVendor = (v) => ({ ...v, phone: undefined, whatsapp: undefined })

function distanceKm(lat1, lng1, lat2, lng2) {
  const rad = (d) => (d * Math.PI) / 180
  const a =
    Math.sin(rad(lat2 - lat1) / 2) ** 2 +
    Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return Math.round(2 * 6371 * Math.asin(Math.sqrt(a)) * 10) / 10
}

const notFound = () => fail(404, "NOT_FOUND", "Vendor not found.")

// ASSUMED response shapes: confirm with the backend lead.
export const dataHandlers = [
  http.get(`${API}/zones`, () => ok(zones)),
  http.get(`${API}/categories`, () => ok(categories)),

  http.get(`${API}/locations/suggest`, async ({ request }) => {
    await delay(200)
    const q = (new URL(request.url).searchParams.get("q") ?? "").toLowerCase()
    return ok(zones.filter((z) => z.name.toLowerCase().includes(q)))
  }),

  // The server decides the order. The frontend shows it as returned.
  http.get(`${API}/search`, async ({ request }) => {
    await delay(400)
    const p = new URL(request.url).searchParams
    const words = (p.get("q") ?? "").toLowerCase().split(/\s+/).filter(Boolean)
    const category = p.get("category")?.toLowerCase()
    const zone = p.get("zone")
    const lat = number(p.get("lat"))
    const lng = number(p.get("lng"))
    const minPrice = number(p.get("minPrice")) // kobo
    const maxPrice = number(p.get("maxPrice")) // kobo
    const minRating = number(p.get("minRating"))
    const homeOnly = p.get("homeService") === "true"

    const items = vendors
      .filter((v) => {
        const text = `${v.name} ${v.subcategory} ${v.categoryId}`.toLowerCase()
        const from = priceFrom(v)
        if (words.length && !words.some((w) => text.includes(w))) return false
        if (category && v.categoryId !== category && v.subcategory.toLowerCase() !== category)
          return false
        if (zone && v.zoneId !== zone && !v.boost?.zones.includes(zone)) return false
        if (minPrice !== undefined && from < minPrice) return false
        if (maxPrice !== undefined && from > maxPrice) return false
        if (minRating !== undefined && v.rating < minRating) return false
        return !homeOnly || v.homeService
      })
      .map((v) => {
        const area = zones.find((z) => z.id === v.zoneId)
        const boosted = v.boost && (!zone || v.boost.zones.includes(zone))
        return {
          ...publicVendor(v),
          priceFromKobo: priceFrom(v),
          sponsored: Boolean(boosted),
          boostType: boosted ? v.boost.type : null,
          distanceKm:
            Number.isFinite(lat) && Number.isFinite(lng)
              ? distanceKm(lat, lng, area.lat, area.lng)
              : null,
        }
      })

    const rank = (i) => (i.boostType === "top_spot" ? 0 : i.boostType === "zone_boost" ? 1 : 2)
    const byDistance = (a, b) =>
      (a.distanceKm ?? 1e9) - (b.distanceKm ?? 1e9) || b.rating - a.rating
    const sponsored = items
      .filter((i) => i.sponsored)
      .sort((a, b) => rank(a) - rank(b) || byDistance(a, b))
    const organic = [
      ...items.filter((i) => !i.sponsored),
      ...sponsored.slice(MAX_SPONSORED).map((i) => ({ ...i, sponsored: false, boostType: null })),
    ].sort(byDistance)

    return ok({ items: [...sponsored.slice(0, MAX_SPONSORED), ...organic], total: items.length })
  }),

  http.get(`${API}/vendors/:id`, async ({ params }) => {
    if (params.id === "profile") return // lets a later /vendors/profile handler take over
    await delay(300)
    const v = findVendor(params.id)
    return v ? ok(publicVendor(v)) : notFound()
  }),

  http.get(`${API}/vendors/:id/services`, async ({ params }) => {
    await delay(200)
    const v = findVendor(params.id)
    return v ? ok(v.services) : notFound()
  }),

  http.get(`${API}/vendors/:id/reviews`, async ({ params }) => {
    await delay(300)
    const v = findVendor(params.id)
    if (!v) return notFound()
    const items = reviews
      .filter((r) => r.vendorId === v.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return ok({ items })
  }),

  http.post(`${API}/vendors/:id/reviews`, async ({ params, request }) => {
    await delay(400)
    const user = getSessionUser()
    if (!user) return fail(401, "UNAUTHORIZED", "Log in to leave a review.")
    const v = findVendor(params.id)
    if (!v) return notFound()
    const { rating, comment = "" } = await request.json()
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return fail(400, "VALIDATION", "Check the highlighted fields.", {
        rating: "Pick a rating from 1 to 5",
      })
    }
    if (reviews.some((r) => r.vendorId === v.id && r.userId === user.id)) {
      return fail(409, "ALREADY_REVIEWED", "You have already reviewed this vendor.")
    }
    const created = {
      id: `r_${Date.now()}`,
      vendorId: v.id,
      userId: user.id,
      authorName: user.name,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    }
    reviews.push(created)
    v.rating = Math.round(((v.rating * v.reviewCount + rating) / (v.reviewCount + 1)) * 10) / 10
    v.reviewCount += 1
    return ok(created, 201)
  }),

  // "Show contact": logged-in users only. A 401 sends the visitor to /login.
  http.all(`${API}/vendors/:id/contact`, async ({ params }) => {
    await delay(300)
    if (!getSessionUser()) return fail(401, "UNAUTHORIZED", "Log in to see contact details.")
    const v = findVendor(params.id)
    return v ? ok({ phone: v.phone, whatsapp: v.whatsapp }) : notFound()
  }),
]
