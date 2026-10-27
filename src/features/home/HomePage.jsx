import { useState } from "react"
import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/store/locationStore"
import { useDebounce } from "@/features/location/useDebounce"
import SearchResults from "@/features/search/SearchResults"
import { cleanQuery, MIN_QUERY_LENGTH } from "@/features/search/results"
import HomeSearchBar from "./HomeSearchBar"
import TopVendorsSection from "./TopVendorsSection"
import PopularSection from "./PopularSection"

export default function HomePage() {
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)
  const [text, setText] = useState("")
  const q = useDebounce(cleanQuery(text), 300)
  const searching = q.length >= MIN_QUERY_LENGTH

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold">For you</h1>
        <HomeSearchBar value={text} onChange={setText} />
      </header>

      {!location && (
        <div className="space-y-2 rounded-md border p-4 text-sm">
          <p>Pick a location to see vendors near you.</p>
          <Button type="button" size="sm" onClick={openPicker}>
            Choose location
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
