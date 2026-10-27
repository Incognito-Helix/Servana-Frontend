const TEXT = { compressing: "Preparing photo...", saving: "Saving..." }

export default function UploadProgress({ stage, progress }) {
  if (stage === "idle") return null
  const percent = stage === "uploading" ? progress : stage === "saving" ? 100 : 0
  return (
    <div className="space-y-1" aria-live="polite">
      <div
        role="progressbar"
        aria-label="Upload progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
        className="h-2 w-full overflow-hidden rounded-full bg-border"
      >
        <div className="h-full bg-primary transition-all" style={{ width: `${percent}%` }} />
      </div>
      <p className="text-xs text-muted-foreground">
        {stage === "uploading" ? `Uploading ${progress}%` : TEXT[stage]}
      </p>
    </div>
  )
}
