import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import VendorCard from "@/features/vendors/VendorCard"
import { useLocationStore } from "@/store/locationStore"
import { useSearch } from "./useSearch"
import { useImpressions } from "./useImpressions"
import { flattenPages, isSponsored } from "./results"
import { EMPTY_FILTERS, countActive } from "./filters"

function SkeletonGrid({ label, count = 6 }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label={label}>
      {Array.from({ length: count }, (_, i) => (
        <Skeleton key={i} className="h-64 w-full" />
      ))}
    </div>
  )
}

export default function SearchResults({
  q,
  zoneId,
  filters = EMPTY_FILTERS,
  onClearFilters,
  nearbyAreas = [],
  onPickArea,
}) {
  const {
    data,
    isLoading,
    isError,
    isFetchNextPageError,
    refetch,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
  } = useSearch({ q, zoneId, filters })
  const openPicker = useLocationStore((s) => s.openPicker)
  const sentinel = useRef(null)
  const { watchRef } = useImpressions({ resetKey: JSON.stringify([q, zoneId, filters]), zoneId })

  const vendors = flattenPages(data)
  const filtersActive = countActive(filters) > 0
  const canClear = filtersActive && Boolean(onClearFilters)
  const hasNearby = nearbyAreas.length > 0 && Boolean(onPickArea)

  // Infinite scroll: load the next page when the bottom comes into view.
  useEffect(() => {
    const el = sentinel.current
    if (!el || !hasNextPage || typeof IntersectionObserver === "undefined") return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isFetchingNextPage) fetchNextPage()
      },
      { rootMargin: "300px" },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasNextPage, isFetchingNextPage, fetchNextPage])

  return (
    <div className="space-y-4">
      {isLoading && <SkeletonGrid label="Loading vendors" />}

      {isError && !isFetchNextPageError && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-destructive">We couldn&apos;t load results. Check your connection.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && vendors.length === 0 && (
        <div className="space-y-3 rounded-md border p-4 text-sm">
          <p>
            No vendors found{q ? ` for “${q}”` : ""}.{" "}
            {filtersActive
              ? "Try removing some filters."
              : hasNearby
                ? "Try a nearby area."
                : "Try a different search or area."}
          </p>
          <div className="flex flex-wrap gap-2">
            {canClear && (
              <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
                Clear filters
              </Button>
            )}
            {hasNearby &&
              nearbyAreas.map((zone) => (
                <Button
                  key={zone.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onPickArea(zone)}
                >
                  Try {zone.name}
                </Button>
              ))}
            {!canClear && !hasNearby && (
              <Button type="button" variant="outline" size="sm" onClick={openPicker}>
                Change area
              </Button>
            )}
          </div>
        </div>
      )}

      {vendors.length > 0 && (
        // The API decides the order. The frontend shows it as it comes.
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <li
              key={vendor.id}
              ref={watchRef}
              data-vendor-id={vendor.id}
              data-sponsored={String(isSponsored(vendor))}
            >
              <VendorCard vendor={vendor} sponsored={isSponsored(vendor)} />
            </li>
          ))}
        </ul>
      )}

      {isFetchingNextPage && <SkeletonGrid label="Loading more vendors" count={3} />}

      {isFetchNextPageError && (
        <p role="alert" className="text-sm text-destructive">
          We couldn&apos;t load more results. Try again below.
        </p>
      )}

      {hasNextPage && (
        <div ref={sentinel} className="flex justify-center py-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            Load more
          </Button>
        </div>
      )}
    </div>
  )
}
