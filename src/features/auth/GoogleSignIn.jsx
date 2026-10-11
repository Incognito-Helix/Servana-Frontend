import { useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID
const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"
const SCRIPT_SRC = "https://accounts.google.com/gsi/client"

function loadGoogleScript() {
  return new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve()
    const existing = document.querySelector(`script[src="${SCRIPT_SRC}"]`)
    const script = existing ?? document.createElement("script")
    script.addEventListener("load", resolve, { once: true })
    script.addEventListener("error", reject, { once: true })
    if (!existing) {
      script.src = SCRIPT_SRC
      script.async = true
      document.head.appendChild(script)
    }
  })
}

export default function GoogleSignIn({ onCredential }) {
  const buttonRef = useRef(null)
  const handlerRef = useRef(onCredential)

  useEffect(() => {
    handlerRef.current = onCredential
  })

  useEffect(() => {
    if (USE_MOCKS || !CLIENT_ID) return
    let cancelled = false
    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current) return
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (res) => handlerRef.current(res.credential),
        })
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 320,
          text: "continue_with",
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  if (USE_MOCKS) {
    return (
      <div className="grid gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onCredential("mock-existing-google-user")}
        >
          Continue with Google (mock: existing user)
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => onCredential("mock-new-google-user")}
        >
          Continue with Google (mock: new user)
        </Button>
      </div>
    )
  }
  if (!CLIENT_ID) {
    return <p className="text-sm text-muted-foreground">Google sign-in is not configured.</p>
  }
  return <div ref={buttonRef} className="flex justify-center" />
}
