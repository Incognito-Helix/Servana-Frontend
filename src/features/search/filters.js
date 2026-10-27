export const EMPTY_FILTERS = {
  minPrice: null,
  maxPrice: null,
  rating: null,
  homeService: false,
  openNow: false,
}

// PRD 6.4: minimum rating is a number from 1 to 5. These are the choices shown.
export const RATING_OPTIONS = [2, 3, 4, 4.5]

const naira = (n) => `₦${new Intl.NumberFormat("en-NG").format(n)}`

// PRD 6.4: prices are zero or positive whole numbers, in naira, and min can't be above max.
export function validatePrice(minText, maxText) {
  const minRaw = String(minText ?? "").trim()
  const maxRaw = String(maxText ?? "").trim()
  const bad = (t) => t !== "" && !/^\d+$/.test(t)
  if (bad(minRaw) || bad(maxRaw)) {
    return { min: null, max: null, error: "Enter whole numbers only, without commas or symbols." }
  }
  const min = minRaw === "" ? null : Number(minRaw)
  const max = maxRaw === "" ? null : Number(maxRaw)
  if (min !== null && max !== null && min > max) {
    return { min: null, max: null, error: "The minimum price can't be above the maximum." }
  }
  return { min, max, error: "" }
}

// Reads the filters out of the URL. Anything invalid is ignored.
export function parseFilters(params) {
  const { min, max } = validatePrice(params.get("minPrice"), params.get("maxPrice"))
  const raw = params.get("rating")
  const rating = raw === null ? NaN : Number(raw)
  return {
    minPrice: min,
    maxPrice: max,
    rating: Number.isFinite(rating) && rating >= 1 && rating <= 5 ? rating : null,
    homeService: params.get("homeService") === "1",
    openNow: params.get("openNow") === "1",
  }
}

const setParam = (params, key, value) => {
  if (value === null || value === undefined || value === false || value === "") params.delete(key)
  else params.set(key, value === true ? "1" : String(value))
}

// Writes filters into a copy of the URL params. Other params (q, zone) stay as they are.
export function applyFilters(params, values) {
  const next = new URLSearchParams(params)
  setParam(next, "minPrice", values.minPrice)
  setParam(next, "maxPrice", values.maxPrice)
  setParam(next, "rating", values.rating)
  setParam(next, "homeService", values.homeService)
  setParam(next, "openNow", values.openNow)
  return next
}

export const clearFilters = (params) => applyFilters(params, EMPTY_FILTERS)

export function removeFilter(params, key) {
  const filters = parseFilters(params)
  if (key === "price") {
    filters.minPrice = null
    filters.maxPrice = null
  } else if (key === "rating") {
    filters.rating = null
  } else {
    filters[key] = false
  }
  return applyFilters(params, filters)
}

export function countActive(filters) {
  return (
    (filters.minPrice !== null || filters.maxPrice !== null ? 1 : 0) +
    (filters.rating !== null ? 1 : 0) +
    (filters.homeService ? 1 : 0) +
    (filters.openNow ? 1 : 0)
  )
}

// What the API receives. Prices go in naira. The API converts to kobo (PRD 6.4).
export function toApiParams(filters = EMPTY_FILTERS) {
  return {
    minPrice: filters.minPrice ?? undefined,
    maxPrice: filters.maxPrice ?? undefined,
    rating: filters.rating ?? undefined,
    homeService: filters.homeService || undefined,
    openNow: filters.openNow || undefined,
  }
}

// Labels for the chips above the results.
export function describeFilters(filters) {
  const items = []
  const { minPrice, maxPrice } = filters
  if (minPrice !== null && maxPrice !== null) {
    items.push({ key: "price", label: `${naira(minPrice)} to ${naira(maxPrice)}` })
  } else if (minPrice !== null) {
    items.push({ key: "price", label: `From ${naira(minPrice)}` })
  } else if (maxPrice !== null) {
    items.push({ key: "price", label: `Up to ${naira(maxPrice)}` })
  }
  if (filters.rating !== null) items.push({ key: "rating", label: `${filters.rating}+ stars` })
  if (filters.homeService) items.push({ key: "homeService", label: "Home service" })
  if (filters.openNow) items.push({ key: "openNow", label: "Open now" })
  return items
}
