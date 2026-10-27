import { useInfiniteQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { normalizeSearchPage, nextPageNumber } from "./results"

export const PAGE_SIZE = 20 // PRD 6.4: 20 per page (config constant)

// The key starts with "search", so picking a new location refreshes it
// (LocationPicker invalidates ["search"]).
export function useSearch({ q, zoneId }) {
  return useInfiniteQuery({
    queryKey: ["search", { q, zoneId }],
    enabled: Boolean(zoneId), // a location is required before any search
    initialPageParam: 1,
    staleTime: 30_000,
    queryFn: async ({ pageParam, signal }) => {
      // ASSUMED parameter names (page, limit): confirm with the backend lead
      const res = await api.get("/search", {
        params: { q: q || undefined, zone: zoneId, page: pageParam, limit: PAGE_SIZE },
        signal,
      })
      return normalizeSearchPage(unwrap(res), PAGE_SIZE)
    },
    getNextPageParam: (lastPage, pages) => nextPageNumber(lastPage, pages),
  })
}
