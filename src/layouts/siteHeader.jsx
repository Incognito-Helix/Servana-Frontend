import { Link, useNavigate } from "react-router-dom"
import { Button } from "@/components/ui/button"
import LocationChip from "@/features/location/LocationChip"
import { logout } from "@/features/auth-session/logout"
import { useAuthStore } from "@/store/authStore"

// Only links that make sense for the role.
const LINKS = {
  customer: [
    ["/account", "My account"],
    ["/account/reviews", "My reviews"],
  ],
  vendor: [
    ["/vendor/profile", "My profile"],
    ["/vendor/boosts", "Boosts"],
  ],
  admin: [["/admin", "Admin"]],
}

const displayName = (user) => user.firstName ?? user.name?.split(" ")[0] ?? ""

export default function SiteHeader({ showLocation = true }) {
  const user = useAuthStore((s) => s.user)
  const status = useAuthStore((s) => s.status)
  const navigate = useNavigate()
  const links = LINKS[user?.role] ?? []

  const onLogout = async () => {
    await logout()
    navigate("/", { replace: true })
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
      <Link to="/" className="font-bold">
        Servana
      </Link>
      {showLocation && <LocationChip />}
      <nav aria-label="Main" className="flex flex-wrap items-center gap-3 text-sm">
        {status === "unauthenticated" && (
          <>
            <Link to="/login">Log in</Link>
            <Link to="/signup">Sign up</Link>
          </>
        )}
        {status === "authenticated" && (
          <>
            {links.map(([to, label]) => (
              <Link key={to} to={to}>
                {label}
              </Link>
            ))}
            {user && displayName(user) && (
              <span className="hidden text-muted-foreground sm:inline">{displayName(user)}</span>
            )}
            <Button type="button" variant="outline" size="sm" onClick={onLogout}>
              Log out
            </Button>
          </>
        )}
      </nav>
    </header>
  )
}
