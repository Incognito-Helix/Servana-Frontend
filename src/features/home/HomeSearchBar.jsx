import { Input } from "@/components/ui/input"
import { useHasLocation } from "@/store/locationStore"

export default function HomeSearchBar({ value, onChange }) {
  const hasLocation = useHasLocation()
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!hasLocation}
      placeholder={hasLocation ? "Search vendors or services" : "Pick a location first"}
      aria-label="Search vendors or services"
      autoComplete="off"
      maxLength={100}
    />
  )
}
