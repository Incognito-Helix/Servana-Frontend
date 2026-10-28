import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

export default function ShareButtons({ name, slug }) {
  const [message, setMessage] = useState("")
  const url = `${window.location.origin}/p/${slug}`

  useEffect(() => {
    if (!message) return
    const id = setTimeout(() => setMessage(""), 3000)
    return () => clearTimeout(id)
  }, [message])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setMessage("Link copied")
    } catch {
      setMessage("Couldn't copy. Copy the address from your browser instead.")
    }
  }

  // Phones open their share sheet. Computers fall back to copying the link.
  const share = async () => {
    if (!navigator.share) return copy()
    try {
      await navigator.share({
        title: `${name} on Servana`,
        text: `Check out ${name} on Servana`,
        url,
      })
    } catch (err) {
      if (err?.name !== "AbortError") await copy()
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        Copy link
      </Button>
      <Button type="button" variant="outline" size="sm" onClick={share}>
        Share
      </Button>
      <span role="status" className="text-xs text-muted-foreground">
        {message}
      </span>
    </div>
  )
}
