export const MAX_SERVICES = 20

// "40,000" or "1500.50" becomes integer kobo. Anything else gives NaN. Done with text, so no float errors.
export function parseNairaToKobo(value) {
  const cleaned = String(value ?? "").replace(/[₦,\s]/g, "")
  if (!/^\d{1,9}(\.\d{1,2})?$/.test(cleaned)) return NaN
  const [whole, decimals = ""] = cleaned.split(".")
  return Number(whole) * 100 + Number(decimals.padEnd(2, "0"))
}

export function koboToInput(kobo) {
  if (!Number.isInteger(kobo) || kobo <= 0) return ""
  const rest = kobo % 100
  return rest ? `${Math.floor(kobo / 100)}.${String(rest).padStart(2, "0")}` : String(kobo / 100)
}

export const emptyRow = () => ({ name: "", startPrice: "", maxPrice: "" })

export function servicesToDefaults(services) {
  if (!Array.isArray(services) || services.length === 0) return [emptyRow()]
  return services.map((s) => ({
    name: s.name ?? "",
    startPrice: koboToInput(s.priceFromKobo),
    maxPrice: koboToInput(s.maxPriceKobo),
  }))
}

// What gets saved. Half-typed prices become null, so autosave never fails on them.
export function servicesPayload(values) {
  const kobo = (value) => {
    const k = parseNairaToKobo(value)
    return k > 0 ? k : null
  }
  return {
    services: (values.services ?? []).map((row) => ({
      name: String(row.name ?? "").trim(),
      priceFromKobo: kobo(row.startPrice),
      maxPriceKobo: kobo(row.maxPrice),
    })),
  }
}

export function lowestPriceKobo(services) {
  const prices = (services ?? [])
    .map((s) => s.priceFromKobo)
    .filter((p) => Number.isInteger(p) && p > 0)
  return prices.length ? Math.min(...prices) : null
}
