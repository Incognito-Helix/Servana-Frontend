import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import { MemoryRouter } from "react-router-dom"
import SiteHeader from "./SiteHeader"
import { useAuthStore } from "@/store/authStore"

const show = () =>
  render(
    <MemoryRouter>
      <SiteHeader showLocation={false} />
    </MemoryRouter>,
  )

describe("SiteHeader", () => {
  beforeEach(() => useAuthStore.setState({ user: null, status: "unauthenticated" }))

  it("shows Log in and Sign up to visitors", () => {
    show()
    expect(screen.getByRole("link", { name: "Log in" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Sign up" })).toBeInTheDocument()
  })

  it("hides Log in and Sign up once signed in, and offers Log out", () => {
    useAuthStore.setState({ user: { role: "customer", firstName: "Ada" }, status: "authenticated" })
    show()
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Sign up" })).toBeNull()
    expect(screen.getByRole("button", { name: "Log out" })).toBeInTheDocument()
  })

  it("shows vendor links to vendors only", () => {
    useAuthStore.setState({ user: { role: "vendor" }, status: "authenticated" })
    show()
    expect(screen.getByRole("link", { name: "My profile" })).toBeInTheDocument()
    useAuthStore.setState({ user: { role: "customer" }, status: "authenticated" })
  })

  it("does not show vendor links to customers", () => {
    useAuthStore.setState({ user: { role: "customer" }, status: "authenticated" })
    show()
    expect(screen.queryByRole("link", { name: "My profile" })).toBeNull()
    expect(screen.queryByRole("link", { name: "Boosts" })).toBeNull()
    expect(screen.getByRole("link", { name: "My account" })).toBeInTheDocument()
  })

  it("shows neither set of links while it checks who is signed in", () => {
    useAuthStore.setState({ user: null, status: "loading" })
    show()
    expect(screen.queryByRole("link", { name: "Log in" })).toBeNull()
    expect(screen.queryByRole("button", { name: "Log out" })).toBeNull()
  })
})
