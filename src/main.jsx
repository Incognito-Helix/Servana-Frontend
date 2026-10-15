import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "@/routes"
import { queryClient } from "@/lib/queryClient"
import { setUnauthorizedHandler, setNetworkErrorHandler } from "@/lib/api"
import AuthBootstrap from "@/features/auth-session/AuthBootstrap"
import "./index.css"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"

setUnauthorizedHandler(() => {
  const { pathname, search } = window.location
  if (pathname.startsWith("/login")) return
  router.navigate(`/login?next=${encodeURIComponent(pathname + search)}`, { replace: true })
})

setNetworkErrorHandler(() => {
  toast.error("Network problem. Check your connection and try again.", {
    id: "network-error",
    action: { label: "Retry", onClick: () => queryClient.refetchQueries({ type: "active" }) },
  })
})

async function enableMocking() {
  if (import.meta.env.VITE_USE_MOCKS !== "true") return
  const { worker } = await import("@/mocks/browser")
  await worker.start({ onUnhandledRequest: "bypass" })
}

enableMocking().then(() => {
  createRoot(document.getElementById("root")).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthBootstrap>
          <RouterProvider router={router} future={{ v7_startTransition: true }} />
        </AuthBootstrap>
        <Toaster />
      </QueryClientProvider>
    </StrictMode>,
  )
})
