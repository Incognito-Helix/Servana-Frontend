import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { useLocationStore } from "@/store/locationStore"
import { useDebounce } from "@/features/location/useDebounce"
import { useMediaQuery } from "@/features/location/useMediaQuery"
import { useZoneSuggestions } from "@/features/location/useZoneSuggestions"
import HomeSearchBar from "@/features/home/HomeSearchBar"
import SearchResults from "./SearchResults"
import FiltersForm from "./FiltersForm"
import ActiveFilters from "./ActiveFilters"
import { cleanQuery, MIN_QUERY_LENGTH } from "./results"
import { applyFilters, clearFilters, countActive, parseFilters, removeFilter } from "./filters"

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const [drawerOpen, setDrawerOpen] = useState(false)

  // The URL decides, so a refresh or a shared link shows the same results.
  const zoneId = params.get("zone") || location?.id || null
  const filters = useMemo(() => parseFilters(params), [params])
  const filtersKey = JSON.stringify(filters) // re-creates the form when the URL changes
  const activeCount = countActive(filters)

  const [text, setText] = useState(params.get("q") ?? "")
  const debounced = useDebounce(cleanQuery(text), 300)
  const q = debounced.length >= MIN_QUERY_LENGTH ? debounced : ""

  const zones = useZoneSuggestions("").data ?? []
  const zoneName = zones.find((z) => z.id === zoneId)?.name ?? location?.name

  // Keep ?q= in step with what was typed.
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

  // Filter changes add a history entry, so the Back button undoes them.
  const apply = (values) => setParams((prev) => applyFilters(prev, values))
  const clear = () => setParams((prev) => clearFilters(prev))
  const remove = (key) => setParams((prev) => removeFilter(prev, key))

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">Search</h1>
        <HomeSearchBar value={text} onChange={setText} disabled={!zoneId} />
        {zoneName && <p className="text-sm text-muted-foreground">Showing vendors in {zoneName}</p>}
      </header>

      {!zoneId ? (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <p>Pick a location to search for vendors.</p>
          <Button type="button" size="sm" onClick={openPicker}>
            Choose location
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
          {isDesktop && (
            <aside aria-label="Filters" className="space-y-3">
              <h2 className="font-semibold">Filters</h2>
              <FiltersForm
                key={filtersKey}
                filters={filters}
                areaName={zoneName}
                onChangeArea={openPicker}
                onApply={apply}
                onClear={clear}
              />
            </aside>
          )}

          <div className="space-y-4">
            {!isDesktop && (
              <Button type="button" variant="outline" onClick={() => setDrawerOpen(true)}>
                Filters{activeCount > 0 ? ` (${activeCount})` : ""}
              </Button>
            )}
            <ActiveFilters filters={filters} onRemove={remove} onClear={clear} />
            <SearchResults q={q} zoneId={zoneId} filters={filters} onClearFilters={clear} />
          </div>
        </div>
      )}

      {!isDesktop && zoneId && (
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-xl p-4">
            <SheetHeader className="p-0">
              <SheetTitle>Filters</SheetTitle>
              <SheetDescription>Narrow down the results.</SheetDescription>
            </SheetHeader>
            <div className="mt-3">
              <FiltersForm
                key={filtersKey}
                filters={filters}
                areaName={zoneName}
                onChangeArea={() => {
                  setDrawerOpen(false)
                  openPicker()
                }}
                onApply={(values) => {
                  apply(values)
                  setDrawerOpen(false)
                }}
                onClear={() => {
                  clear()
                  setDrawerOpen(false)
                }}
              />
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  )
}
