import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/store/locationStore"
import { useEffectiveLocation } from "./useEffectiveLocation"
import { zoneLabel } from "./recent"

export default function LocationChip() {
  const { location, isDefault } = useEffectiveLocation()
  const openPicker = useLocationStore((s) => s.openPicker)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openPicker}
      aria-haspopup="dialog"
      aria-label={
        location
          ? `Area: ${zoneLabel(location)}${isDefault ? " (suggested)" : ""}. Change area`
          : "Set your area"
      }
    >
      <MapPin aria-hidden />
      <span className="max-w-[10rem] truncate">{location ? location.name : "Set location"}</span>
      <ChevronDown aria-hidden />
    </Button>
  )
}
