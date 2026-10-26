import { useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Button } from "@/components/ui/button"
import { FieldError } from "./fields"
import { PROFILE_KEY } from "./hooks"
import { ACCEPT_ATTR, MAX_PORTFOLIO, friendlyError, removePortfolioImage } from "./uploads"
import { applySnapshot, usePhotoUpload } from "./usePhotoUpload"
import UploadProgress from "./UploadProgress"

export default function PortfolioGrid({ profileId, images = [], error }) {
  const inputRef = useRef(null)
  const queryClient = useQueryClient()
  const { stage, progress, busy, start } = usePhotoUpload({ profileId, kind: "portfolio" })
  const [notes, setNotes] = useState([])
  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState("")
  const remaining = Math.max(MAX_PORTFOLIO - images.length, 0)
  const sorted = [...images].sort((a, b) => a.sortOrder - b.sortOrder)

  const onPick = async (event) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ""
    if (files.length === 0) return
    const messages = []
    const accepted = files.slice(0, remaining)
    if (files.length > accepted.length) {
      messages.push(
        `You can add ${remaining} more image${remaining === 1 ? "" : "s"}. The rest were skipped.`,
      )
    }
    for (const file of accepted) {
      const problem = await start(file)
      if (problem) messages.push(`${file.name}: ${problem}`)
    }
    setNotes(messages)
  }

  const remove = async (image) => {
    setRemoveError("")
    setRemovingId(image.id)
    try {
      const snapshot = await removePortfolioImage(profileId, image.id)
      queryClient.setQueryData(PROFILE_KEY, (old) => (old ? applySnapshot(old, snapshot) : old))
    } catch (caught) {
      setRemoveError(friendlyError(caught))
    } finally {
      setRemovingId(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Portfolio images <span className="text-[#B42318]">*</span>
        </p>
        <p className="text-xs text-muted-foreground">
          {images.length} of {MAX_PORTFOLIO}
        </p>
      </div>

      {sorted.length > 0 ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {sorted.map((image, index) => (
            <li
              key={image.id}
              className="relative aspect-square overflow-hidden rounded-lg border border-border"
            >
              <img
                src={image.url}
                alt={`Portfolio image ${index + 1}`}
                className="size-full object-cover"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="absolute inset-x-2 bottom-2"
                disabled={busy || removingId === image.id}
                aria-label={`Remove portfolio image ${index + 1}`}
                onClick={() => remove(image)}
              >
                {removingId === image.id ? "Removing..." : "Remove"}
              </Button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="rounded-lg border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
          No portfolio images yet
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        multiple
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-label="Add portfolio images"
        data-testid="portfolio-input"
        onChange={onPick}
      />
      <Button
        type="button"
        variant="outline"
        disabled={busy || remaining === 0}
        onClick={() => inputRef.current?.click()}
      >
        {remaining === 0 ? "Portfolio is full" : "Add photos"}
      </Button>
      <UploadProgress stage={stage} progress={progress} />

      {notes.length > 0 ? (
        <ul role="alert" className="space-y-1 text-sm text-[#B42318]">
          {notes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      ) : null}
      <FieldError message={removeError || error} />
      <p className="text-xs text-muted-foreground">
        JPEG, PNG or WebP, up to 5 MB each. Add at least one.
      </p>
    </div>
  )
}
