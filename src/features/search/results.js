export const MIN_QUERY_LENGTH = 2 // PRD 6.4: search starts at 2 characters
export const MAX_QUERY_LENGTH = 100 // PRD 6.4: search text up to 100 characters

// Collapse spaces and cut to 100 characters. The API sanitises again.
export const cleanQuery = (text) =>
  String(text ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_QUERY_LENGTH)

// Accepts a plain list or a wrapped response until the backend sends the real shape.
export function normalizeSearchPage(data, pageSize) {
  const raw = Array.isArray(data) ? data : (data?.items ?? data?.results ?? data?.vendors ?? [])
  const items = Array.isArray(raw) ? raw : []
  let hasMore
  if (typeof data?.hasMore === "boolean") hasMore = data.hasMore
  else if (data?.nextPage != null) hasMore = true
  else if (typeof data?.totalPages === "number" && typeof data?.page === "number")
    hasMore = data.page < data.totalPages
  else hasMore = items.length >= pageSize
  return { items, hasMore }
}

// All pages in one list, in the order the API sent them. Repeats are dropped.
export function flattenPages(data) {
  const seen = new Set()
  const out = []
  for (const page of data?.pages ?? []) {
    for (const vendor of page.items) {
      if (seen.has(vendor.id)) continue
      seen.add(vendor.id)
      out.push(vendor)
    }
  }
  return out
}

// Stops loading when the API has more pages but a page brings nothing new.
export function nextPageNumber(lastPage, pages) {
  if (!lastPage.hasMore) return undefined
  const seen = new Set(pages.slice(0, -1).flatMap((p) => p.items.map((v) => v.id)))
  return lastPage.items.some((v) => !seen.has(v.id)) ? pages.length + 1 : undefined
}

// PRD 5.4: the API sends a sponsored flag. The frontend only shows it.
export const isSponsored = (vendor) => Boolean(vendor.sponsored ?? vendor.isSponsored)
