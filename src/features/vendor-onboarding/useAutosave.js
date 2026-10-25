import { useCallback, useEffect, useRef, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { PROFILE_KEY } from "./hooks"
import { saveVendorStep } from "./profileApi"

// Saves the form 800ms after the last change, and once more when the step is left.
export function useAutosave({ step, watch, transform, delay = 800 }) {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState("idle")
  const timer = useRef(null)
  const latest = useRef(null)
  const transformRef = useRef(transform)

  useEffect(() => {
    transformRef.current = transform
  })

  const cancel = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = null
    latest.current = null
  }, [])

  const flush = useCallback(async () => {
    clearTimeout(timer.current)
    timer.current = null
    const data = latest.current
    latest.current = null
    if (!data) return
    setStatus("saving")
    try {
      const profile = await saveVendorStep({ step, data, advance: false })
      queryClient.setQueryData(PROFILE_KEY, profile)
      setStatus("saved")
    } catch {
      setStatus("error")
    }
  }, [queryClient, step])

  useEffect(() => {
    const subscription = watch((values) => {
      latest.current = transformRef.current ? transformRef.current(values) : values
      clearTimeout(timer.current)
      timer.current = setTimeout(flush, delay)
    })
    return () => {
      subscription.unsubscribe()
      flush()
    }
  }, [watch, flush, delay])

  return { status, cancel }
}
