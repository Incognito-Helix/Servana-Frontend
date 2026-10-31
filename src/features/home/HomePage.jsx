import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { useDebounce } from "@/features/location/useDebounce"
import { useEffectiveLocation } from "@/features/location/useEffectiveLocation"
import AreaNotice from "@/features/location/AreaNotice"
import SearchResults from "@/features/search/SearchResults"
import { cleanQuery, MIN_QUERY_LENGTH } from "@/features/search/results"
import HomeSearchBar from "./HomeSearchBar"
import TopVendorsSection from "./TopVendorsSection"
import PopularSection from "./PopularSection"

export default function HomePage() {
  const { location, isDefault, isLoading, isError, retry } = useEffectiveLocation()
  const [text, setText] = useState("")
  const q = useDebounce(cleanQuery(text), 300)
  const searching = q.length >= MIN_QUERY_LENGTH

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">For you</h1>
        <HomeSearchBar value={text} onChange={setText} />
        {location && <AreaNotice zone={location} isDefault={isDefault} />}
      </header>

      {isLoading && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3" aria-label="Loading vendors">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      )}

      {isError && (
        <div role="alert" className="space-y-2 text-sm">
          <p className="text-destructive">We couldn&apos;t load areas. Check your connection.</p>
          <Button type="button" variant="outline" size="sm" onClick={() => retry()}>
            Try again
          </Button>
        </div>
      )}

      {/* PRD 5.3: typing replaces the feed with ranked results. Clearing brings it back. */}
      {location && searching && (
        <div className="space-y-3">
          <Link
            to={`/search?zone=${encodeURIComponent(location.id)}&q=${encodeURIComponent(q)}`}
            className="text-sm underline"
          >
            Filter these results
          </Link>
          <SearchResults q={q} zoneId={location.id} />
        </div>
      )}

      {location && !searching && (
        <>
          <TopVendorsSection zone={location} />
          <PopularSection zone={location} />
        </>
      )}
    </div>
  )
}
