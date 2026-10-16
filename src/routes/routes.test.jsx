// @vitest-environment jsdom
import { act, cleanup, render } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { afterEach, describe, expect, it } from "vitest"
import { createMemoryRouter, RouterProvider } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { router } from "./index"

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearUser()
})

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 30))
  })

async function visit(path, role) {
  const store = useAuthStore.getState()

  if (role) {
    store.setUser({ id: `u_${role}`, role })
  } else {
    store.clearUser()
  }

  const memory = createMemoryRouter(router.routes, {
    initialEntries: [path],
  })

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  })

  render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={memory} />
    </QueryClientProvider>,
  )

  await settle()
  return memory.state.location
}

const AREAS = [
  { path: "/account", owner: "customer" },
  { path: "/account/reviews", owner: "customer" },
  { path: "/vendor/profile", owner: "vendor" },
  { path: "/vendor/boosts", owner: "vendor" },
  { path: "/admin", owner: "admin" },
  { path: "/admin/vendors", owner: "admin" },
]

const PUBLIC = ["/", "/search", "/login", "/signup", "/forgot-password", "/terms"]

describe("real route map", () => {
  it("sends a visitor from /account/security to login", async () => {
    const location = await visit("/account/security", null)

    expect(location.pathname).toBe("/login")
  })

  it.each(["customer", "vendor", "admin"])("lets %s change their password", async (role) => {
    const location = await visit("/account/security", role)

    expect(location.pathname).toBe("/account/security")
  })

  it.each(AREAS)("sends a visitor from $path to login", async ({ path }) => {
    const location = await visit(path, null)

    expect(location.pathname).toBe("/login")
    expect(location.search).toBe(`?next=${encodeURIComponent(path)}`)
  })

  describe.each(["customer", "vendor", "admin"])("as %s", (role) => {
    it.each(AREAS)("$path", async ({ path, owner }) => {
      const location = await visit(path, role)

      expect(location.pathname).toBe(role === owner ? path : "/403")
    })
  })

  it.each(PUBLIC)("keeps %s open to visitors", async (path) => {
    const location = await visit(path, null)

    expect(location.pathname).toBe(path)
  })
})
