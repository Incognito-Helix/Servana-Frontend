import { useMemo } from "react"
import { useLocationStore } from "@/store/locationStore"
import { useZoneSuggestions } from "./useZoneSuggestions"
import { DEFAULT_ZONE_ID } from "./constants"

// The area the app uses: the one the person chose, or else a suggested default.
export function useEffectiveLocation() {
  const chosen = useLocationStore((s) => s.location)
  const zones = useZoneSuggestions("")

  const fallback = useMemo(() => {
    const list = zones.data ?? []
    return list.find((z) => z.id === DEFAULT_ZONE_ID) ?? list[0] ?? null
  }, [zones.data])

  return {
    location: chosen ?? fallback,
    isDefault: !chosen && Boolean(fallback),
    isLoading: !chosen && zones.isLoading,
    isError: !chosen && zones.isError,
    retry: zones.refetch,
  }
}
