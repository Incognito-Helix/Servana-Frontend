import { Link } from "react-router-dom"
import { MapPin, Star } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { BADGE } from "./badges"
import { toCardData, formatNaira, ratingText, distanceText } from "./cardData"

export default function VendorCard({ vendor, sponsored = false }) {
  const v = toCardData(vendor)
  const distance = distanceText(v.distanceKm, v.remote)

  return (
    <article className="relative h-full overflow-hidden rounded-lg border bg-card transition-shadow focus-within:ring-2 hover:shadow-md">
      <div className="aspect-[16/9] w-full bg-muted">
        {v.cover ? (
          <img src={v.cover} alt="" loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div
            aria-hidden
            className="flex h-full items-center justify-center text-3xl font-semibold text-muted-foreground"
          >
            {v.name.charAt(0)}
          </div>
        )}
      </div>

      <div className="space-y-2 p-3">
        {(sponsored || v.verified) && (
          <div className="flex flex-wrap items-center gap-1.5">
            {sponsored && <Badge variant={BADGE.sponsored}>Sponsored</Badge>}
            {v.verified && <Badge variant={BADGE.verified}>Verified</Badge>}
          </div>
        )}

        <h3 className="font-semibold leading-tight">
          {/* The link covers the whole card, so the card is one big tap target. */}
          <Link to={`/p/${v.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {v.name}
          </Link>
        </h3>

        <p className="text-sm text-muted-foreground">
          {[v.service, v.area].filter(Boolean).join(" · ")}
        </p>

        <div className="flex items-center justify-between gap-2 text-sm">
          <span className="flex items-center gap-1">
            <Star aria-hidden className="size-4" />
            <span className="sr-only">Rating:</span>
            <span>{ratingText(v.rating, v.reviewCount)}</span>
          </span>
          {distance && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <MapPin aria-hidden className="size-4" />
              <span>{distance}</span>
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2">
          {v.fromKobo !== null ? (
            <p className="text-sm font-medium">From {formatNaira(v.fromKobo)}</p>
          ) : (
            <span />
          )}
          <span className="flex flex-wrap gap-1.5">
            {v.homeService && <Badge variant={BADGE.home}>Home service</Badge>}
            {v.remote && <Badge variant={BADGE.remote}>Works remotely</Badge>}
          </span>
        </div>
      </div>
    </article>
  )
}
