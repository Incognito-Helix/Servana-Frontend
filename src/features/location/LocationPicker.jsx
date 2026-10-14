import { useEffect, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { api } from "@/lib/api"
import { useAuthStore } from "@/store/authStore"
import { useLocationStore } from "@/store/locationStore"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import PickerOverlay from "./PickerOverlay"
import UseMyLocation from "./UseMyLocation"
import { useDebounce } from "./useDebounce"
import { useZoneSuggestions } from "./useZoneSuggestions"
import { useRecentLocations } from "./useRecentLocation"
import { zoneLabel } from "./recent"

function ZoneList({ title, zones, current, onPick }) {
  if (!zones.length) return null
  return (
    <section>
      <h3 className="mb-1 text-xs font-medium uppercase tracking-wide text-gray-500">{title}</h3>
      <ul className="space-y-1">
        {zones.map((zone) => (
          <li key={zone.id}>
            <button
              type="button"
              onClick={() => onPick(zone)}
              aria-current={current?.id === zone.id ? "true" : undefined}
              className="flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm hover:bg-muted"
            >
              <span>{zoneLabel(zone)}</span>
              {current?.id === zone.id && <span aria-hidden>✓</span>}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

function PickerBody({ onPick, forced }) {
  const [text, setText] = useState("")
  const q = useDebounce(text.trim())
  const { data: zones = [], isLoading, isError, refetch } = useZoneSuggestions(q)
  const all = useZoneSuggestions("") // the full list, used to find the nearest zone
  const recents = useRecentLocations()
  const current = useLocationStore((s) => s.location)

  return (
    <div className="space-y-4">
      {forced && (
        <p className="text-sm text-gray-600">
          Pick an area to continue. We use it to show vendors near you.
        </p>
      )}

      <UseMyLocation zones={all.data ?? []} loading={all.isLoading} onPick={onPick} />

      <Input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Search an area, for example Ajah"
        aria-label="Search for an area"
        autoComplete="off"
      />

      {isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-red-600">We couldn&apos;t load areas. Check your connection.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {isLoading && (
        <div className="space-y-2" aria-label="Loading areas">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      )}

      {!q && <ZoneList title="Recent" zones={recents} current={current} onPick={onPick} />}
      {!isLoading && !isError && (
        <ZoneList
          title={q ? "Suggestions" : "Areas"}
          zones={zones}
          current={current}
          onPick={onPick}
        />
      )}
      {!isLoading && !isError && q && zones.length === 0 && (
        <p className="text-sm text-gray-600">No area found. Try Lekki, Ikeja or Yaba.</p>
      )}
    </div>
  )
}

export default function LocationPicker() {
  const open = useLocationStore((s) => s.pickerOpen)
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)
  const closePicker = useLocationStore((s) => s.closePicker)
  const setLocation = useLocationStore((s) => s.setLocation)
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const isCustomer = user?.role === "customer"
  const queryClient = useQueryClient()

  // A logged-in customer must have a location. Visitors can browse without one.
  const forced = status === "authenticated" && isCustomer && !location

  useEffect(() => {
    if (forced) openPicker()
  }, [forced, openPicker])

  const pick = async (zone) => {
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

  return (
    <PickerOverlay
      open={open || forced}
      forced={forced}
      onOpenChange={(next) => {
        if (next) openPicker()
        else if (!forced) closePicker()
      }}
      title="Choose your location"
      description="Pick an area in Lagos to see vendors near you."
    >
      <PickerBody onPick={pick} forced={forced} />
    </PickerOverlay>
  )
}
