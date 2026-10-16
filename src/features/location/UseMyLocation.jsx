import { useState } from "react"
import { MapPin } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getCurrentCoords, nearestZone, geoErrorMessage } from "./geo"

export default function UseMyLocation({ zones, loading, onPick }) {
  const [locating, setLocating] = useState(false)
  const [message, setMessage] = useState("")

  const run = async () => {
    setMessage("")
    setLocating(true)
    try {
      const point = await getCurrentCoords()
      const zone = nearestZone(point, zones)
      if (!zone) {
        setMessage("We couldn't match your location to an area. Pick one from the list.")
        return
      }
      onPick(zone)
    } catch (err) {
      setMessage(geoErrorMessage(err))
    } finally {
      setLocating(false)
    }
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full"
        onClick={run}
        disabled={locating || loading || zones.length === 0}
      >
        <MapPin aria-hidden />
        {locating ? "Finding you..." : "Use my current location"}
      </Button>
      {message && (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      )}
    </div>
  )
}
