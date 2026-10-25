import { NavLink, Outlet } from "react-router-dom"
import SiteHeader from "./SiteHeader"

const links = [
  ["/admin", "Overview"],
  ["/admin/vendors", "Vendor queue"],
  ["/admin/categories", "Categories"],
  ["/admin/zones", "Zones"],
  ["/admin/pricing", "Boost pricing"],
  ["/admin/payments", "Payments"],
  ["/admin/reviews", "Reviews"],
  ["/admin/users", "Users"],
  ["/admin/audit-log", "Audit log"],
]
export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <SiteHeader showLocation={false} />
      <nav className="flex w-52 flex-col gap-2 border-r p-4 text-sm">
        {links.map(([to, label]) => (
          <NavLink key={to} to={to} end={to === "/admin"}>
            {label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}
