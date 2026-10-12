import { MapPin, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useLocationStore } from "@/store/locationStore"
import { zoneLabel } from "./recent"

export default function LocationChip() {
  const location = useLocationStore((s) => s.location)
  const openPicker = useLocationStore((s) => s.openPicker)

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={openPicker}
      aria-haspopup="dialog"
      aria-label={
        location ? `Location: ${zoneLabel(location)}. Change location` : "Set your location"
      }
    >
      <MapPin aria-hidden />
      <span className="max-w-[10rem] truncate">{location ? location.name : "Set location"}</span>
      <ChevronDown aria-hidden />
    </Button>
  )
}
