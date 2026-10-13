export const MAX_RECENTS = 3

// Newest first, no duplicates, last 3 only.
export function addRecent(recents, zone) {
  if (!zone?.id) return recents
  return [zone, ...recents.filter((z) => z.id !== zone.id)].slice(0, MAX_RECENTS)
}

// The API may return a bare array or wrap it. Keep only usable zones.
export function normalizeZones(data) {
  const list = Array.isArray(data) ? data : (data?.zones ?? data?.items ?? data?.results ?? [])
  return list.filter((z) => z && z.id != null && z.name)
}

export const zoneLabel = (zone) => (zone.city ? `${zone.name}, ${zone.city}` : zone.name)
