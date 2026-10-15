import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useLocationStore } from "@/store/locationStore"
import { useFeed } from "./useFeed"
import { vendorName } from "./feed"

export default function TopVendorsSection({ zone }) {
  const { data, isLoading, isError, refetch } = useFeed(zone.id)
  const openPicker = useLocationStore((s) => s.openPicker)
  const top = data?.top ?? []

  return (
    <section aria-labelledby="top-vendors-heading" className="space-y-3">
      <h2 id="top-vendors-heading" className="text-lg font-semibold">
        Top vendors near you
        <span className="ml-2 text-sm font-normal text-gray-500">in {zone.name}</span>
      </h2>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading vendors">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-red-600">We couldn&apos;t load vendors. Check your connection.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
            Try again
          </Button>
        </div>
      )}

      {!isLoading && !isError && top.length === 0 && (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <p>No vendors in {zone.name} yet.</p>
          <Button type="button" variant="outline" size="sm" onClick={openPicker}>
            Try another area
          </Button>
        </div>
      )}

      {!isLoading && !isError && top.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {top.map((vendor) => (
            <li key={vendor.id} className="rounded-md border p-3 text-sm">
              {/* Placeholder row. The next card replaces it with the real VendorCard. */}
              <Link to={`/p/${vendor.slug}`} className="font-medium underline">
                {vendorName(vendor)}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
