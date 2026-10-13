import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { normalizeZones } from "./recent"

export function useZoneSuggestions(q) {
  return useQuery({
    queryKey: ["locations", "suggest", q],
    queryFn: async ({ signal }) =>
      normalizeZones(unwrap(await api.get("/locations/suggest", { params: { q }, signal }))),
    staleTime: 5 * 60_000,
    placeholderData: (previous) => previous,
  })
}
