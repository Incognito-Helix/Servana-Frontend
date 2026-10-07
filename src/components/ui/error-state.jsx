import { TriangleAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ErrorState({
  title = "Something went wrong",
  message = "Please check your connection and try again.",
  onRetry,
  retryLabel = "Try again",
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-2xl border border-destructive/30 bg-danger-soft px-6 py-10 text-center"
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-card text-destructive">
        <TriangleAlert className="size-6" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      <p className="max-w-xs text-sm text-foreground">{message}</p>
      {onRetry ? (
        <Button variant="outline" onClick={onRetry}>
          {retryLabel}
        </Button>
      ) : null}
    </div>
  )
}
