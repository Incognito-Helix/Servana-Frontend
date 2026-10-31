import { Input } from "@/components/ui/input"
import { useEffectiveLocation } from "@/features/location/useEffectiveLocation"
import { MAX_QUERY_LENGTH } from "@/features/search/results"

export default function HomeSearchBar({ value, onChange, disabled }) {
  const { location } = useEffectiveLocation()
  const enabled = disabled === undefined ? Boolean(location) : !disabled
  return (
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!enabled}
      placeholder={enabled ? "Search vendors or services" : "Loading areas..."}
      aria-label="Search vendors or services"
      autoComplete="off"
      maxLength={MAX_QUERY_LENGTH}
    />
  )
}
