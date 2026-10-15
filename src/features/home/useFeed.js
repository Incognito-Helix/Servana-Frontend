import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { normalizeFeed } from "./feed"

// The key starts with "feed", so picking a new location refreshes it
// (LocationPicker invalidates ["feed"]).
export function useFeed(zoneId) {
  return useQuery({
    queryKey: ["feed", zoneId],
    enabled: Boolean(zoneId),
    staleTime: 60_000,
    queryFn: async ({ signal }) =>
      normalizeFeed(unwrap(await api.get("/feed", { params: { zone: zoneId }, signal }))),
  })
}
