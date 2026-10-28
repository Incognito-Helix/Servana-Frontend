import { useInfiniteQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { getSessionSeed } from "@/lib/session"
import { normalizeSearchPage, nextPageNumber } from "./results"
import { EMPTY_FILTERS, toApiParams } from "./filters"

export const PAGE_SIZE = 20 // PRD 6.4: 20 per page (config constant)

// The key starts with "search", so picking a new location refreshes it.
// Changing any filter changes the key, so results start again from page 1.
export function useSearch({ q, zoneId, filters = EMPTY_FILTERS }) {
  return useInfiniteQuery({
    queryKey: ["search", { q, zoneId, filters }],
    enabled: Boolean(zoneId), // a location is required before any search
    initialPageParam: 1,
    staleTime: 30_000,
    refetchOnReconnect: false, // a refetch could reorder what the person is reading
    queryFn: async ({ pageParam, signal }) => {
      // ASSUMED parameter names (page, limit, seed): confirm with the backend lead
      const res = await api.get("/search", {
        params: {
          q: q || undefined,
          zone: zoneId,
          page: pageParam,
          limit: PAGE_SIZE,
          seed: getSessionSeed(),
          ...toApiParams(filters),
        },
        signal,
      })
      return normalizeSearchPage(unwrap(res), PAGE_SIZE)
    },
    getNextPageParam: (lastPage, pages) => nextPageNumber(lastPage, pages),
  })
}
