const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const textOf = (v) => (v && typeof v === "object" ? (v.name ?? "") : (v ?? ""))
const titleCase = (s) =>
  String(s)
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ")

// Prices are integer kobo (PRD 5.1). If src/lib/money.js has a naira formatter, use that instead.
export function formatNaira(kobo) {
  return `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(kobo / 100)}`
}

// "From N..." is the lowest starting price across all services (PRD 6.2).
export function lowestPriceKobo(vendor) {
  if (num(vendor.fromPrice) !== null) return vendor.fromPrice
  const prices = (vendor.services ?? [])
    .map((s) => s.priceMin ?? s.price_min ?? s.price)
    .filter((p) => num(p) !== null && p > 0)
  return prices.length ? Math.min(...prices) : null
}

export function ratingText(rating, count) {
  if (rating === null || !count) return "No reviews yet"
  return `${rating.toFixed(1)} (${count})`
}

export function distanceText(km, remote) {
  if (remote) return "Remote"
  return km === null ? "" : `${km.toFixed(1)} km`
}

const countOf = (v) => {
  if (num(v.reviewCount) !== null) return v.reviewCount
  if (Array.isArray(v.reviews)) return v.reviews.length
  return num(v.reviews) ?? 0
}

const areaOf = (v) => v.zoneName ?? v.area ?? v.zone?.name ?? (v.zoneId ? titleCase(v.zoneId) : "")

// The ONE place that knows the vendor field names. If the API differs, change it here.
export function toCardData(v) {
  return {
    id: v.id,
    slug: v.slug,
    name: v.businessName ?? v.name ?? "Vendor",
    cover: v.coverImageUrl ?? v.coverImage ?? v.cover ?? v.image ?? null,
    verified: Boolean(v.isVerified ?? v.verified),
    service: textOf(v.primaryService ?? v.category ?? v.service),
    area: areaOf(v),
    rating: num(v.avgRating ?? v.rating),
    reviewCount: countOf(v),
    distanceKm: num(v.distanceKm ?? v.distance),
    fromKobo: lowestPriceKobo(v),
    homeService: Boolean(v.offersHomeService ?? v.homeService),
    remote: Boolean(v.worksRemotely ?? v.remote),
  }
}
