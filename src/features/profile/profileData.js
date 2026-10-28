import { toCardData, formatNaira } from "@/features/vendors/cardData"
import { normalizeHours } from "./hours"

const num = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null)
const firstNumber = (...values) => values.map(num).find((v) => v !== null) ?? null

// Web links only, so nobody can plant a javascript: link.
export function safeUrl(value) {
  try {
    const url = new URL(String(value))
    return url.protocol === "https:" || url.protocol === "http:" ? url.href : null
  } catch {
    return null
  }
}

// Prices are integer kobo (PRD 5.1).
export function priceText(minKobo, maxKobo) {
  if (minKobo === null) return "Ask for price"
  if (maxKobo !== null && maxKobo > minKobo)
    return `${formatNaira(minKobo)} to ${formatNaira(maxKobo)}`
  return formatNaira(minKobo)
}

const toService = (s, i) => ({
  id: s.id ?? `${s.name}-${i}`,
  name: s.name ?? "Service",
  description: s.description ?? "",
  minKobo: firstNumber(s.priceMin, s.price_min, s.price),
  maxKobo: firstNumber(s.priceMax, s.price_max),
})

const toImage = (item) =>
  typeof item === "string"
    ? { url: item, alt: "" }
    : { url: item?.url ?? item?.src ?? "", alt: item?.alt ?? "" }

const PLATFORMS = { instagram: "Instagram", tiktok: "TikTok", x: "X", facebook: "Facebook" }
const toSocial = (s) => {
  const href = safeUrl(s?.url)
  if (!href) return null
  const platform = String(s.platform ?? "other").toLowerCase()
  return { platform, label: PLATFORMS[platform] ?? "Website", href }
}

// The ONE place that knows the profile field names. The object is built field by
// field, so a phone or WhatsApp number can never slip through (PRD 6.2).
export function toProfileData(v) {
  const card = toCardData(v)
  const about = v.about ?? v.bio
  const images = v.portfolioImages ?? v.portfolio ?? v.images ?? []
  const socials = v.socialLinks ?? v.socials ?? []
  return {
    id: card.id,
    slug: card.slug,
    name: card.name,
    cover: card.cover,
    profileImage: v.profileImageUrl ?? v.profileImage ?? v.logo ?? null,
    verified: card.verified,
    service: card.service,
    area: card.area,
    rating: card.rating,
    reviewCount: card.reviewCount,
    fromKobo: card.fromKobo,
    homeService: card.homeService,
    remote: card.remote,
    status: v.status ?? null,
    about: typeof about === "string" ? about : "",
    services: (Array.isArray(v.services) ? v.services : []).map(toService),
    portfolio: (Array.isArray(images) ? images : []).map(toImage).filter((img) => img.url),
    hours: normalizeHours(v.workingHours ?? v.hours),
    socials: (Array.isArray(socials) ? socials : []).map(toSocial).filter(Boolean),
  }
}
