import { useCallback, useEffect, useRef } from "react"
import { api } from "@/lib/api"

// Off until the backend confirms how impressions are recorded.
// Read when used, so tests can switch it on.
const enabled = () => import.meta.env.VITE_IMPRESSIONS_ENABLED === "true"
const FLUSH_MS = 2000
const MAX_BATCH = 50

// PRD 6.9: an impression is one time a vendor's card is shown in search results.
// A card counts the first time it is at least half visible, once per search.
export function useImpressions({ resetKey, zoneId }) {
  const seen = useRef(new Set())
  const queue = useRef([])
  const timer = useRef(null)
  const observer = useRef(null)
  const zoneRef = useRef(zoneId)

  useEffect(() => {
    zoneRef.current = zoneId
  }, [zoneId])

  const flush = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = null
    while (queue.current.length > 0) {
      const events = queue.current.splice(0, MAX_BATCH)
      // Tracking must never bother the person: no toast, no redirect, no error.
      Promise.resolve(api.post("/events/impressions", { events }, { silent: true })).catch(() => {})
    }
  }, [])

  const record = useCallback(
    (vendorId, sponsored) => {
      if (!enabled() || seen.current.has(vendorId)) return
      seen.current.add(vendorId)
      queue.current.push({ vendorId, sponsored, zoneId: zoneRef.current })
      if (queue.current.length >= MAX_BATCH) flush()
      else if (!timer.current) timer.current = setTimeout(flush, FLUSH_MS)
    },
    [flush],
  )

  // A new search (query, area or filters changed) starts the count again.
  useEffect(() => {
    seen.current = new Set()
  }, [resetKey])

  // Send what's left when the tab is hidden or the page is left.
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush()
    }
    document.addEventListener("visibilitychange", onHide)
    return () => {
      document.removeEventListener("visibilitychange", onHide)
      flush()
    }
  }, [flush])

  const getObserver = useCallback(() => {
    if (observer.current || typeof IntersectionObserver === "undefined") return observer.current
    observer.current = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          const { vendorId, sponsored } = entry.target.dataset
          record(vendorId, sponsored === "true")
          observer.current?.unobserve(entry.target)
        }
      },
      { threshold: 0.5 },
    )
    return observer.current
  }, [record])

  // Put this ref on each card's wrapper, with data-vendor-id and data-sponsored.
  const watchRef = useCallback(
    (el) => {
      if (el) getObserver()?.observe(el)
    },
    [getObserver],
  )

  return { watchRef }
}
