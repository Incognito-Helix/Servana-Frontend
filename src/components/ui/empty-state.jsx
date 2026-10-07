import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"

export function EmptyState({
  title = "Nothing here yet",
  message,
  actionLabel,
  onAction,
  icon: Icon = Inbox,
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-secondary text-primary">
        <Icon className="size-6" aria-hidden="true" />
      </div>
      <h3 className="font-heading text-lg font-semibold">{title}</h3>
      {message ? <p className="max-w-xs text-sm text-muted-foreground">{message}</p> : null}
      {actionLabel && onAction ? <Button onClick={onAction}>{actionLabel}</Button> : null}
    </div>
  )
}
