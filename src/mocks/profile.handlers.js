import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { vendors } from "./fixtures"

const API = import.meta.env.VITE_API_URL

const day = (dayOfWeek, closed = false) => ({
  dayOfWeek, // Monday = 1 ... Sunday = 7
  openTime: closed ? null : "09:00",
  closeTime: closed ? null : "18:00",
  isClosed: closed,
})

// Demo data only. Anything the fixture already has is kept, and anything missing is filled in.
const withDemoData = (v) => {
  const seed = v.slug ?? v.id
  const services =
    Array.isArray(v.services) && v.services.length > 0
      ? v.services
      : [
          { id: "s1", name: "Standard service", priceMin: 500000 },
          { id: "s2", name: "Premium service", priceMin: 1500000 },
        ]
  return {
    slug: seed,
    status: "approved",
    isVerified: true,
    coverImageUrl: `https://picsum.photos/seed/${seed}-cover/1200/450`,
    profileImageUrl: `https://picsum.photos/seed/${seed}-me/200/200`,
    socialLinks: [{ platform: "instagram", url: "https://instagram.com/servana" }],
    ...v,
    // A price range on the first service, so the "₦X to ₦Y" display can be checked.
    services: services.map((s, i) => {
      const min = s.priceMin ?? s.price_min ?? s.price
      return i === 0 && s.priceMax == null && typeof min === "number"
        ? { ...s, priceMax: min * 2 }
        : s
    }),
    portfolioImages: [1, 2, 3, 4].map((n) => ({
      url: `https://picsum.photos/seed/${seed}-${n}/800/600`,
    })),
    workingHours: [1, 2, 3, 4, 5, 6].map((d) => day(d)).concat(day(7, true)),
  }
}

export const profileHandlers = [
  http.get(`${API}/vendors/:slug`, async ({ params }) => {
    await delay(300)
    const vendor = vendors.find((v) => v.slug === params.slug || v.id === params.slug)
    if (!vendor) return fail(404, "NOT_FOUND", "Vendor not found.")
    // Phone and WhatsApp numbers are never sent in a profile (PRD 6.2).
    const safe = withDemoData(vendor)
    return ok(safe)
  }),
]
