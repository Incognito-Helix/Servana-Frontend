import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RATING_OPTIONS, validatePrice } from "./filters"

const selectClass =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"

export default function FiltersForm({ filters, areaName, onChangeArea, onApply, onClear }) {
  const [minPrice, setMinPrice] = useState(filters.minPrice ?? "")
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice ?? "")
  const [rating, setRating] = useState(filters.rating === null ? "" : String(filters.rating))
  const [homeService, setHomeService] = useState(filters.homeService)
  const [openNow, setOpenNow] = useState(filters.openNow)
  const [error, setError] = useState("")

  // If the URL holds a rating that isn't in the list, still show it.
  const ratingChoices =
    filters.rating !== null && !RATING_OPTIONS.includes(filters.rating)
      ? [...RATING_OPTIONS, filters.rating].sort((a, b) => a - b)
      : RATING_OPTIONS

  const submit = (e) => {
    e.preventDefault()
    const { min, max, error: priceError } = validatePrice(minPrice, maxPrice)
    if (priceError) {
      setError(priceError)
      return
    }
    setError("")
    onApply({
      minPrice: min,
      maxPrice: max,
      rating: rating === "" ? null : Number(rating),
      homeService,
      openNow,
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-4">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span>Area: {areaName || "not set"}</span>
        <Button type="button" variant="link" size="sm" className="px-0" onClick={onChangeArea}>
          Change
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="minPrice">Minimum price (₦)</Label>
          <Input
            id="minPrice"
            inputMode="numeric"
            placeholder="0"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="maxPrice">Maximum price (₦)</Label>
          <Input
            id="maxPrice"
            inputMode="numeric"
            placeholder="Any"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            aria-invalid={!!error}
          />
        </div>
      </div>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="rating">Minimum rating</Label>
        <select
          id="rating"
          className={selectClass}
          value={rating}
          onChange={(e) => setRating(e.target.value)}
        >
          <option value="">Any rating</option>
          {ratingChoices.map((r) => (
            <option key={r} value={String(r)}>
              {r} stars and up
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={homeService}
            onChange={(e) => setHomeService(e.target.checked)}
          />
          Home service
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={openNow} onChange={(e) => setOpenNow(e.target.checked)} />
          Open now
        </label>
      </div>

      <div className="flex gap-2">
        <Button type="submit" className="flex-1">
          Apply filters
        </Button>
        <Button type="button" variant="outline" onClick={onClear}>
          Clear
        </Button>
      </div>
    </form>
  )
}
