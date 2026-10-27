import { Input } from "@/components/ui/input"
import { useHasLocation } from "@/store/locationStore"
import { MAX_QUERY_LENGTH } from "@/features/search/results"

export default function HomeSearchBar({ value, onChange, disabled }) {
  const hasLocation = useHasLocation()
  const enabled = disabled === undefined ? hasLocation : !disabled
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!enabled}
      placeholder={enabled ? "Search vendors or services" : "Pick a location first"}
      aria-label="Search vendors or services"
      autoComplete="off"
      maxLength={MAX_QUERY_LENGTH}
    />
  )
}
