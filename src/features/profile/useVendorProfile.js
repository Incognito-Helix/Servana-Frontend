import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { toProfileData } from "./profileData"

// ASSUMED route (the PRD lists /vendors/:id): confirm it accepts the slug.
const profilePath = (slug) => `/vendors/${encodeURIComponent(slug)}`

export function useVendorProfile(slug) {
  return useQuery({
    queryKey: ["vendor", slug],
    enabled: Boolean(slug),
    staleTime: 60_000,
    // Retry a flaky network, never a 404.
    retry: (count, error) => (error?.status === 0 || error?.status >= 500) && count < 2,
    queryFn: async ({ signal }) => {
      const data = unwrap(await api.get(profilePath(slug), { signal }))
      return toProfileData(data?.vendor ?? data?.profile ?? data)
    },
  })
}
