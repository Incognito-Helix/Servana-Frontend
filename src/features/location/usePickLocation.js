import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useLocationStore } from "@/store/locationStore"

// Choose an area from anywhere: saves it, closes the picker, refreshes the lists.
export function usePickLocation() {
  const queryClient = useQueryClient()
  const setLocation = useLocationStore((s) => s.setLocation)
  const closePicker = useLocationStore((s) => s.closePicker)
  const isCustomer = useAuthStore((s) => s.user?.role === "customer")

  return async (zone) => {
    setLocation(zone)
    closePicker()
    queryClient.invalidateQueries({ queryKey: ["feed"] })
    queryClient.invalidateQueries({ queryKey: ["search"] })
    queryClient.invalidateQueries({ queryKey: ["locations", "recent"] })
    if (isCustomer) {
      try {
        await api.patch("/users/me/location", { zoneId: zone.id }) // ASSUMED body: confirm with backend
      } catch {
        // Saved in the browser only until the endpoint is live
      }
    }
  }
}
