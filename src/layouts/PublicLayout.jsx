import { Outlet } from "react-router-dom"
import LocationPicker from "@/features/location/LocationPicker"
import SiteHeader from "./SiteHeader"

export default function PublicLayout() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <LocationPicker />
    </div>
  )
}
