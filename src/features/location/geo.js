const EARTH_RADIUS_KM = 6371
const toRad = (deg) => (deg * Math.PI) / 180

export function haversineKm(a, b) {
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(h))
}

// The mock uses lat/lng. The real API may use centerLatitude/centerLongitude.
const coordsOf = (zone) => ({
  lat: zone.lat ?? zone.centerLatitude,
  lng: zone.lng ?? zone.centerLongitude,
})

// PRD 6.4: pick the zone whose centre point is nearest.
export function nearestZone(point, zones) {
  let best = null
  let bestKm = Infinity
  for (const zone of zones) {
    const c = coordsOf(zone)
    if (typeof c.lat !== "number" || typeof c.lng !== "number") continue
    const km = haversineKm(point, c)
    if (km < bestKm) {
      best = zone
      bestKm = km
    }
  }
  return best
}

export function getCurrentCoords() {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) return reject({ code: "UNSUPPORTED" })
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => reject(err),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    )
  })
}

export function geoErrorMessage(err) {
  if (err?.code === 1) return "Location access was blocked. Pick an area from the list instead."
  if (err?.code === "UNSUPPORTED")
    return "Your browser can't share its location. Pick an area from the list."
  return "We couldn't find your location. Pick an area from the list."
}

// The closest other zones, nearest first. Zones without coordinates are skipped.
export function nearbyZones(currentId, zones, count = 3) {
  const current = zones.find((z) => z.id === currentId)
  if (!current) return []
  const origin = coordsOf(current)
  if (typeof origin.lat !== "number" || typeof origin.lng !== "number") return []
  return zones
    .filter((z) => z.id !== currentId)
    .map((zone) => ({ zone, km: haversineKm(origin, coordsOf(zone)) }))
    .filter(({ km }) => Number.isFinite(km))
    .sort((a, b) => a.km - b.km)
    .slice(0, count)
    .map(({ zone }) => zone)
}
