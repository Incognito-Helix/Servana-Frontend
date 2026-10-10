// Money is stored as integer kobo and shown as naira. Never compute prices on the frontend.

export function nairaToKobo(naira) {
  if (naira === "" || naira == null) return NaN
  const value = Number(naira)
  return Number.isFinite(value) ? Math.round(value * 100) : NaN
}

export function koboToNaira(kobo) {
  return kobo / 100
}

export function formatNaira(kobo) {
  if (typeof kobo !== "number" || !Number.isFinite(kobo)) return ""
  const total = Math.round(Math.abs(kobo))
  const whole = Math.floor(total / 100)
  const rest = total % 100
  const grouped = String(whole).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
  const decimals = rest ? `.${String(rest).padStart(2, "0")}` : ""
  const sign = kobo < 0 && total > 0 ? "-" : ""
  return `${sign}₦${grouped}${decimals}`
}

export function formatPriceFrom(kobo) {
  const price = formatNaira(kobo)
  return price ? `From ${price}` : ""
}
