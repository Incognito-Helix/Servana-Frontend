import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import VendorCard from "@/features/vendors/VendorCard"
import { useLocationStore } from "@/store/locationStore"
import { useSearch } from "./useSearch"
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

export default function SearchResults({ q, zoneId, filters = EMPTY_FILTERS, onClearFilters }) {
  const { data, isLoading, isError, refetch, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useSearch({ q, zoneId, filters })
  const openPicker = useLocationStore((s) => s.openPicker)
  const sentinel = useRef(null)
  const vendors = flattenPages(data)
  const filtersActive = countActive(filters) > 0

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

      {isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-destructive">We couldn&apos;t load results. Check your connection.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && vendors.length === 0 && (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <p>
            No vendors found{q ? ` for “${q}”` : ""}.{" "}
            {filtersActive ? "Try removing some filters." : "Try a different search or area."}
          </p>
          {filtersActive && onClearFilters ? (
            <Button type="button" variant="outline" size="sm" onClick={onClearFilters}>
              Clear filters
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" onClick={openPicker}>
              Change area
            </Button>
          )}
        </div>
      )}

      {vendors.length > 0 && (
        // The API decides the order. The frontend shows it as it comes.
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {vendors.map((vendor) => (
            <li key={vendor.id}>
              <VendorCard vendor={vendor} sponsored={isSponsored(vendor)} />
            </li>
          ))}
        </ul>
      )}

      {isFetchingNextPage && <SkeletonGrid label="Loading more vendors" count={3} />}

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
