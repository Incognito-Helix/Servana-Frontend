// Demo values. Confirm the Lagos bounding box (a config constant in the PRD) with the backend lead.
export const LAGOS_BOUNDS = { minLat: 6.3, maxLat: 6.8, minLng: 2.7, maxLng: 4.4 }
export const TECH_CREATIVE_ID = "tech-creative"
export const COOLDOWN_DAYS = 7
export const MAX_RADIUS_KM = 50

const DAY_MS = 24 * 60 * 60 * 1000

export function insideLagos(latitude, longitude) {
  return (
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    latitude >= LAGOS_BOUNDS.minLat &&
    latitude <= LAGOS_BOUNDS.maxLat &&
    longitude >= LAGOS_BOUNDS.minLng &&
    longitude <= LAGOS_BOUNDS.maxLng
  )
}

export const isTechCreativeService = (categories, serviceName) =>
  Boolean(serviceName) &&
  (categories ?? []).some((c) => c.id === TECH_CREATIVE_ID && c.children?.includes(serviceName))

const round = (n) => (Number.isFinite(n) ? Math.round(n * 1000) / 1000 : null)
const baseKey = ({ state, city, zone, latitude, longitude }) =>
  [state, city, zone, round(latitude), round(longitude)].join("|")

// A base location change only counts once a base location has been saved.
export const baseChanged = (saved, next) => Boolean(saved?.zone) && baseKey(saved) !== baseKey(next)

export function cooldownEnd(profile) {
  const changed = Date.parse(profile?.baseLocationChangedAt ?? "")
  return Number.isFinite(changed) ? changed + COOLDOWN_DAYS * DAY_MS : null
}

// The cooldown applies once the profile is past the draft stage. An active boost lifts it
// while the boost runs, and an admin can override it (PRD 4.6).
export function isLocked(profile, now = Date.now()) {
  if (profile?.hasActiveBoost || profile?.cooldownOverride) return false
  const end = cooldownEnd(profile)
  return profile?.status !== "draft" && end !== null && now < end
}
