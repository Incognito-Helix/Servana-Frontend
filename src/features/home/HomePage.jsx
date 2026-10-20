import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/store/locationStore"
import { useDebounce } from "@/features/location/useDebounce"
import HomeSearchBar from "./HomeSearchBar"
import TopVendorsSection from "./TopVendorsSection"
import PopularSection from "./PopularSection"

const MIN_SEARCH_LENGTH = 2 // PRD 6.4

export default function HomePage() {
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)
  const [text, setText] = useState("")
  const q = useDebounce(text.trim(), 300)
  const searching = q.length >= MIN_SEARCH_LENGTH

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

      {location && searching && (
        // The ranked search results replace the feed here (built in the search card).
        <p className="text-sm text-gray-600">Search results for “{q}” will appear here.</p>
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
