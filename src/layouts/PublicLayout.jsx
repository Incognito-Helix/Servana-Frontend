import { Link, Outlet } from "react-router-dom"
import LocationChip from "@/features/location/LocationChip"
import LocationPicker from "@/features/location/LocationPicker"

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between gap-3 border-b p-4">
        <Link to="/" className="font-bold">
          Servana
        </Link>
        <LocationChip />
        <nav className="flex gap-4 text-sm">
          <Link to="/login">Log in</Link>
          <Link to="/signup">Sign up</Link>
        </nav>
      </header>
      <main>
        <Outlet />
      </main>
      <LocationPicker />
    </div>
  )
}
