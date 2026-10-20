import VendorCard from "@/features/vendors/VendorCard"
import { useFeed } from "./useFeed"

export default function PopularSection({ zone }) {
  const { data, isLoading, isError } = useFeed(zone.id)
  const vendors = data?.popular?.vendors ?? []

  if (isLoading || isError || vendors.length === 0) return null

  return (
    <section aria-labelledby="popular-vendors-heading" className="space-y-3">
      <h2 id="popular-vendors-heading" className="text-lg font-semibold">
        Popular in {zone.name}
      </h2>

      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {vendors.map((vendor) => (
          <li key={vendor.id}>
            <VendorCard vendor={vendor} sponsored />
          </li>
        ))}
      </ul>
    </section>
  )
}
