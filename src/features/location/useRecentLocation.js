import { useQuery } from "@tanstack/react-query"
import { api, unwrap } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useLocationStore } from "@/store/locationStore"
import { normalizeZones } from "./recent"

// Customers: from the account (GET /users/me/recent-locations, being built by the backend).
// Visitors, or while that endpoint isn't live: from the browser.
export function useRecentLocations() {
  const isCustomer = useAuthStore((s) => s.user?.role === "customer")
  const local = useLocationStore((s) => s.recents)
  const query = useQuery({
    queryKey: ["locations", "recent"],
    enabled: isCustomer,
    retry: false,
    staleTime: 60_000,
    queryFn: async () => normalizeZones(unwrap(await api.get("/users/me/recent-locations"))),
  })
  const fromServer = isCustomer && query.isSuccess ? query.data : []
  return (fromServer.length ? fromServer : local).slice(0, 3)
}
