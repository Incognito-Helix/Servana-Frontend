import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export default function PortfolioGallery({ images, vendorName }) {
  const [index, setIndex] = useState(null)
  if (images.length === 0) return null

  const count = images.length
  const current = index === null ? null : images[index]
  // PRD 8: portfolio images need alt text.
  const altFor = (img, i) => img.alt || `${vendorName} portfolio photo ${i + 1}`

  return (
    <section aria-labelledby="portfolio-heading" className="space-y-3">
      <h2 id="portfolio-heading" className="text-lg font-semibold">
        Portfolio
      </h2>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {images.map((img, i) => (
          <li key={img.url}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Open photo ${i + 1} of ${count}`}
              className="block aspect-square w-full overflow-hidden rounded-md bg-muted focus-visible:ring-2 focus-visible:ring-ring"
            >
              <img
                src={img.url}
                alt={altFor(img, i)}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog open={index !== null} onOpenChange={(open) => !open && setIndex(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vendorName} portfolio</DialogTitle>
            <DialogDescription>
              Photo {(index ?? 0) + 1} of {count}
            </DialogDescription>
          </DialogHeader>
          {current && (
            <img
              src={current.url}
              alt={altFor(current, index)}
              className="max-h-[70vh] w-full rounded-md object-contain"
            />
          )}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIndex((i) => (i - 1 + count) % count)}
            >
              Previous
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIndex((i) => (i + 1) % count)}
            >
              Next
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  )
}
