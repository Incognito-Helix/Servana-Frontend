const asList = (value) => (Array.isArray(value) ? value : [])

// Accepts a few likely shapes until the backend sends the real one.
export function normalizeFeed(data) {
  const top = asList(data?.top ?? data?.topVendors ?? data?.top_vendors)
  const rawPopular = data?.popular ?? data?.popularVendors ?? null
  const popular = rawPopular
    ? { zone: rawPopular.zone ?? null, vendors: asList(rawPopular.vendors ?? rawPopular) }
    : null
  return { top, popular }
}

export const vendorName = (vendor) => vendor.businessName ?? vendor.name ?? "Vendor"
