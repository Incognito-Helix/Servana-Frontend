import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/store/locationStore"
import { useDebounce } from "@/features/location/useDebounce"
import { useZoneSuggestions } from "@/features/location/useZoneSuggestions"
import HomeSearchBar from "@/features/home/HomeSearchBar"
import SearchResults from "./SearchResults"
import { cleanQuery, MIN_QUERY_LENGTH } from "./results"

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)

  // The URL decides, so a refresh or a shared link shows the same results.
  const zoneId = params.get("zone") || location?.id || null
  const [text, setText] = useState(params.get("q") ?? "")
  const debounced = useDebounce(cleanQuery(text), 300)
  const q = debounced.length >= MIN_QUERY_LENGTH ? debounced : ""

  const zones = useZoneSuggestions("").data ?? []
  const zoneName = zones.find((z) => z.id === zoneId)?.name ?? location?.name

  // Keep ?q= in step with what was typed. Filters join the URL in the next card.
  useEffect(() => {
    if (debounced === (params.get("q") ?? "")) return
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (debounced) next.set("q", debounced)
        else next.delete("q")
        return next
      },
      { replace: true },
    )
  }, [debounced, params, setParams])

  // Picking a new area from the header chip updates ?zone=.
  const previousLocationId = useRef(location?.id)
  useEffect(() => {
    const id = location?.id
    if (!id || id === previousLocationId.current) return
    previousLocationId.current = id
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        next.set("zone", id)
        return next
      },
      { replace: true },
    )
  }, [location?.id, setParams])

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">Search</h1>
        <HomeSearchBar value={text} onChange={setText} disabled={!zoneId} />
        {zoneName && <p className="text-sm text-gray-600">Showing vendors in {zoneName}</p>}
      </header>

      {!zoneId ? (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <p>Pick a location to search for vendors.</p>
          <Button type="button" size="sm" onClick={openPicker}>
            Choose location
          </Button>
        </div>
      ) : (
        <SearchResults q={q} zoneId={zoneId} />
      )}
    </div>
  )
}
