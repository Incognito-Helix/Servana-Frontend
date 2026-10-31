import { useLocationStore } from "@/store/locationStore"

export default function AreaNotice({ zone, isDefault }) {
  const openPicker = useLocationStore((s) => s.openPicker)
  return (
    <p className="text-sm text-muted-foreground">
      Showing vendors in <strong>{zone.name}</strong>
      {isDefault ? " (suggested)" : ""}.{" "}
      <button type="button" onClick={openPicker} className="underline">
        Change area
      </button>
    </p>
  )
}
