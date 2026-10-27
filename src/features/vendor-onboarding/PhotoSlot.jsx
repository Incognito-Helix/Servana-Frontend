import { useRef } from "react"
import { Button } from "@/components/ui/button"
import { FieldError } from "./fields"
import { ACCEPT_ATTR } from "./uploads"
import { usePhotoUpload } from "./usePhotoUpload"
import UploadProgress from "./UploadProgress"

export default function PhotoSlot({
  profileId,
  kind,
  label,
  hint,
  url,
  shape = "wide",
  required = false,
  error,
}) {
  const inputRef = useRef(null)
  const { stage, progress, error: uploadError, busy, start } = usePhotoUpload({ profileId, kind })
  const frame = shape === "round" ? "size-32 rounded-full" : "aspect-[16/9] w-full rounded-lg"

  const onPick = async (event) => {
    const [file] = Array.from(event.target.files ?? [])
    event.target.value = "" // so the same file can be picked again
    if (file) await start(file)
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">
        {label}
        {required ? <span className="text-[#B42318]"> *</span> : null}
      </p>
      <div
        className={`flex items-center justify-center overflow-hidden border border-dashed border-border bg-muted ${frame}`}
      >
        {url ? (
          <img src={url} alt={`${label} preview`} className="size-full object-cover" />
        ) : (
          <span className="px-3 text-center text-xs text-muted-foreground">No photo yet</span>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-label={label}
        data-testid={`${kind}-input`}
        onChange={onPick}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {url ? "Replace photo" : "Choose photo"}
      </Button>
      <UploadProgress stage={stage} progress={progress} />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      <FieldError message={uploadError || error} />
    </div>
  )
}
