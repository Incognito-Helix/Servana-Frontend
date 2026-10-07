import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RouterProvider } from "react-router-dom"
import { QueryClientProvider } from "@tanstack/react-query"
import { router } from "@/routes"
import { queryClient } from "@/lib/queryClient"
import { setUnauthorizedHandler, setNetworkErrorHandler } from "@/lib/api"
import AuthBootstrap from "@/features/auth-session/AuthBootstrap"
import "./index.css"

setUnauthorizedHandler(() => {
  const { pathname, search } = window.location
  if (pathname.startsWith("/login")) return
  router.navigate(`/login?next=${encodeURIComponent(pathname + search)}`, { replace: true })
})

setNetworkErrorHandler(() => {
  // TODO: replace with Temitope's Toast (with a Retry button) once it's merged.
  console.warn("Network error: show retry toast")
})

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthBootstrap>
        <RouterProvider router={router} future={{ v7_startTransition: true }} />
      </AuthBootstrap>
    </QueryClientProvider>
  </StrictMode>,
)
