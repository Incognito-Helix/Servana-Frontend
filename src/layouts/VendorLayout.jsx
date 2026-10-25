import { NavLink, Outlet } from "react-router-dom"
import SiteHeader from "./SiteHeader"

const links = [
  ["/vendor/profile", "My profile"],
  ["/vendor/onboarding/1", "Onboarding"],
  ["/vendor/boosts", "Boosts"],
]
export default function VendorLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader showLocation={false} />
      <nav className="flex gap-4 border-b p-4 text-sm">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  )
}
