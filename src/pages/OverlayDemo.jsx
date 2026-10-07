import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Overlay } from "@/components/ui/overlay"
import { Skeleton } from "@/components/ui/skeleton"
import { Toaster } from "@/components/ui/sonner"
import { EmptyState } from "@/components/ui/empty-state"
import { ErrorState } from "@/components/ui/error-state"

export default function OverlayDemo() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  return (
    <section className="mt-10">
      <h2 className="font-heading text-2xl font-bold">Overlays and feedback</h2>

      <div className="mt-4 flex flex-wrap items-start gap-3">
        <Button onClick={() => setOpen(true)}>Open overlay</Button>
        <Button variant="outline" onClick={() => toast.success("Profile saved")}>
          Show toast
        </Button>
        <Button variant="secondary" onClick={() => setLoading((v) => !v)}>
          {loading ? "Show content" : "Show skeleton"}
        </Button>
      </div>

      <div className="mt-6 w-full max-w-sm">
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        ) : (
          <p>Ada Beauty Studio, Lekki, Lagos</p>
        )}
      </div>

      <div className="mt-6 grid w-full max-w-sm gap-4">
        <EmptyState
          title="No providers found"
          message="Try a different area or category."
          actionLabel="Clear filters"
          onAction={() => toast("Filters cleared")}
        />
        <ErrorState onRetry={() => toast.success("Retrying...")} />
      </div>

      <Overlay
        open={open}
        onOpenChange={setOpen}
        title="Show contact"
        description="Log in to see this provider's phone number."
        footer={<Button onClick={() => setOpen(false)}>Got it</Button>}
      >
        <p className="text-sm text-muted-foreground">
          Only verified users can see contact details.
        </p>
      </Overlay>

      <Toaster />
    </section>
  )
}
