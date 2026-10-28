import { useEffect } from "react"
import { Link, useParams } from "react-router-dom"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { BADGE } from "@/features/vendors/badges"
import { formatNaira, ratingText } from "@/features/vendors/cardData"
import { useVendorProfile } from "./useVendorProfile"
import { priceText } from "./profileData"
import { DAY_NAMES, lagosNow, openStatus, to12h } from "./hours"
import PortfolioGallery from "./PortfolioGallery"
import ShareButtons from "./ShareButtons"

function ProfileSkeleton() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4" aria-label="Loading profile">
      <Skeleton className="aspect-[16/6] w-full" />
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-32 w-full" />
    </div>
  )
}

function NotAvailable() {
  return (
    <div className="mx-auto max-w-md space-y-3 p-6 text-center">
      <h1 className="text-xl font-semibold">This profile isn&apos;t available</h1>
      <p className="text-sm text-muted-foreground">
        It may have been removed, or it isn&apos;t published yet.
      </p>
      <Button asChild>
        <Link to="/search">Browse vendors</Link>
      </Button>
    </div>
  )
}

export default function VendorProfilePage() {
  const { slug } = useParams()
  const { data: vendor, isLoading, isError, error, refetch } = useVendorProfile(slug)

  useEffect(() => {
    if (!vendor?.name) return
    document.title = `${vendor.name} · Servana`
    return () => {
      document.title = "Servana"
    }
  }, [vendor?.name])

  if (isLoading) return <ProfileSkeleton />
  // PRD 6.2: an unapproved or suspended profile is a 404 for everyone except its owner.
  if (isError && error?.status === 404) return <NotAvailable />
  if (isError || !vendor) {
    return (
      <div role="alert" className="mx-auto max-w-md space-y-2 p-6 text-sm">
<<<<<<< HEAD
        <p className="text-destructive">
          We couldn&apos;t load this profile. Check your connection.
        </p>
=======
        <p className="text-destructive">We couldn&apos;t load this profile. Check your connection.</p>
>>>>>>> origin/feat/asan-d17-vendor-profile
        <Button type="button" variant="outline" size="sm" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    )
  }

  const today = lagosNow().day
  const status = openStatus(vendor.hours)

  return (
    <article className="mx-auto w-full max-w-4xl pb-10">
      <div className="relative">
        <div className="aspect-[16/6] w-full overflow-hidden bg-muted sm:rounded-b-xl">
          {vendor.cover && <img src={vendor.cover} alt="" className="h-full w-full object-cover" />}
        </div>
        <div className="absolute -bottom-10 left-4 size-20 overflow-hidden rounded-full border-4 border-background bg-muted sm:left-6 sm:size-24">
          {vendor.profileImage ? (
            <img
              src={vendor.profileImage}
              alt={`${vendor.name} profile photo`}
              className="h-full w-full object-cover"
            />
          ) : (
            <span
              aria-hidden
              className="flex h-full items-center justify-center text-2xl font-semibold text-muted-foreground"
            >
              {vendor.name.charAt(0)}
            </span>
          )}
        </div>
      </div>

      <header className="space-y-3 px-4 pt-14 sm:px-6">
        {vendor.status && vendor.status !== "approved" && (
          <p role="status" className="rounded-md border p-3 text-sm">
            Only you can see this profile while it is {vendor.status}.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">{vendor.name}</h1>
          {vendor.verified && <Badge variant={BADGE.verified}>Verified</Badge>}
        </div>

        <p className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin aria-hidden className="size-4" />
          <span>{[vendor.service, vendor.area].filter(Boolean).join(" · ")}</span>
        </p>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="flex items-center gap-1">
            <Star aria-hidden className="size-4" />
            <span className="sr-only">Rating:</span>
            <span>{ratingText(vendor.rating, vendor.reviewCount)}</span>
          </span>
          {vendor.fromKobo !== null && (
            <span className="font-medium">From {formatNaira(vendor.fromKobo)}</span>
          )}
        </div>

        {(vendor.homeService || vendor.remote) && (
          <div className="flex flex-wrap gap-1.5">
            {vendor.homeService && <Badge variant={BADGE.home}>Home service</Badge>}
            {vendor.remote && <Badge variant={BADGE.remote}>Works remotely</Badge>}
          </div>
        )}

        <ShareButtons name={vendor.name} slug={vendor.slug} />
        {/* "Show contact" goes here (next card). Phone numbers never come from this page's data. */}
      </header>

      <div className="grid gap-8 px-4 pt-8 sm:px-6 md:grid-cols-[1fr_18rem]">
        <div className="space-y-8">
          {vendor.about && (
            <section aria-labelledby="about-heading" className="space-y-2">
              <h2 id="about-heading" className="text-lg font-semibold">
                About
              </h2>
              <p className="whitespace-pre-line text-sm leading-relaxed">{vendor.about}</p>
            </section>
          )}

          {vendor.services.length > 0 && (
            <section aria-labelledby="services-heading" className="space-y-2">
              <h2 id="services-heading" className="text-lg font-semibold">
                Services and prices
              </h2>
              <ul className="divide-y rounded-md border">
                {vendor.services.map((s) => (
                  <li key={s.id} className="flex items-start justify-between gap-4 p-3 text-sm">
                    <div>
                      <p className="font-medium">{s.name}</p>
                      {s.description && <p className="text-muted-foreground">{s.description}</p>}
                    </div>
                    <span className="shrink-0 font-medium">{priceText(s.minKobo, s.maxKobo)}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <PortfolioGallery images={vendor.portfolio} vendorName={vendor.name} />
          {/* Reviews go here, with id="reviews". */}
        </div>

        <aside className="space-y-6">
          {vendor.hours.length > 0 && (
            <section aria-labelledby="hours-heading" className="space-y-2">
              <h2 id="hours-heading" className="text-lg font-semibold">
                Opening hours
              </h2>
              <p
                className={`text-sm font-medium ${status.state === "open" ? "text-primary" : "text-muted-foreground"}`}
              >
                {status.label}
              </p>
              <ul className="space-y-1 text-sm">
                {vendor.hours.map((h) => (
                  <li
                    key={h.day}
                    className={`flex justify-between gap-3 ${h.day === today ? "font-semibold" : ""}`}
                  >
                    <span>{DAY_NAMES[h.day]}</span>
                    <span>{h.closed ? "Closed" : `${to12h(h.open)} to ${to12h(h.close)}`}</span>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Times are in Lagos time.</p>
            </section>
          )}

          {vendor.socials.length > 0 && (
            <section aria-labelledby="links-heading" className="space-y-2">
              <h2 id="links-heading" className="text-lg font-semibold">
                Find them online
              </h2>
              <ul className="space-y-1 text-sm">
                {vendor.socials.map((s) => (
                  <li key={s.href}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      {s.label}
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </article>
  )
}
