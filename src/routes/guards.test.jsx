// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest"
import { cleanup, render, screen } from "@testing-library/react"
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom"
import { useAuthStore } from "@/store/authStore"
import { RequireAuth, RequireRole } from "./guards"

afterEach(() => {
  cleanup()
  useAuthStore.getState().clearUser()
})

function LoginProbe() {
  const { pathname, search } = useLocation()
  return <p data-testid="login-probe">{pathname + search}</p>
}

const routes = (
  <Routes>
    <Route path="/login" element={<LoginProbe />} />
    <Route path="/403" element={<p>Forbidden page</p>} />
    <Route element={<RequireRole roles={["customer"]} />}>
      <Route path="/account" element={<p>Customer area</p>} />
    </Route>
    <Route element={<RequireRole roles={["vendor"]} />}>
      <Route path="/vendor/boosts" element={<p>Vendor area</p>} />
    </Route>
    <Route element={<RequireRole roles={["admin"]} />}>
      <Route path="/admin" element={<p>Admin area</p>} />
    </Route>
    <Route element={<RequireAuth />}>
      <Route path="/signed-in" element={<p>Signed-in area</p>} />
    </Route>
  </Routes>
)

function renderAt(path, role) {
  const store = useAuthStore.getState()
  if (role) store.setUser({ id: `u_${role}`, role })
  else store.clearUser()
  render(<MemoryRouter initialEntries={[path]}>{routes}</MemoryRouter>)
}

const AREAS = [
  { path: "/account", text: "Customer area", owner: "customer" },
  { path: "/vendor/boosts", text: "Vendor area", owner: "vendor" },
  { path: "/admin", text: "Admin area", owner: "admin" },
]

describe("visitor (not logged in)", () => {
  it.each(AREAS)("is sent to login from $path and told where to come back to", ({ path }) => {
    renderAt(path, null)
    expect(screen.getByTestId("login-probe").textContent).toBe(
      `/login?next=${encodeURIComponent(path)}`,
    )
  })

  it("keeps the query string in the return address", () => {
    renderAt("/vendor/boosts?tab=active", null)
    expect(screen.getByTestId("login-probe").textContent).toBe(
      `/login?next=${encodeURIComponent("/vendor/boosts?tab=active")}`,
    )
  })

  it("is sent to login from a signed-in-only page", () => {
    renderAt("/signed-in", null)
    expect(screen.getByTestId("login-probe").textContent).toContain("/login?next=")
  })
})

describe.each(["customer", "vendor", "admin"])("%s", (role) => {
  it.each(AREAS)("$path", ({ path, text, owner }) => {
    renderAt(path, role)
    if (role === owner) expect(screen.getByText(text)).toBeTruthy()
    else expect(screen.getByText("Forbidden page")).toBeTruthy()
  })

  it("can open a signed-in-only page", () => {
    renderAt("/signed-in", role)
    expect(screen.getByText("Signed-in area")).toBeTruthy()
  })
})

describe("while the session is still loading", () => {
  it("shows Loading and does not redirect yet", () => {
    useAuthStore.setState({ user: null, status: "loading" })
    render(<MemoryRouter initialEntries={["/vendor/boosts"]}>{routes}</MemoryRouter>)
    expect(screen.getByText("Loading...")).toBeTruthy()
    expect(screen.queryByTestId("login-probe")).toBeNull()
  })
})
