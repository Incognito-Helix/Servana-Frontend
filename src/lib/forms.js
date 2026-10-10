import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { ApiError } from "@/lib/api"

export function useZodForm(schema, options = {}) {
  return useForm({ resolver: zodResolver(schema), mode: "onTouched", ...options })
}

// Puts the server's fieldErrors on the matching inputs.
// Anything without a field goes to errors.root.serverError.
export function applyApiErrors(error, setError) {
  if (!(error instanceof ApiError)) {
    setError("root.serverError", {
      type: "server",
      message: "Something went wrong. Please try again.",
    })
    return
  }
  const entries = Object.entries(error.fieldErrors ?? {})
  if (entries.length === 0) {
    setError("root.serverError", { type: "server", message: error.message })
    return
  }
  entries.forEach(([name, message]) => setError(name, { type: "server", message: String(message) }))
}
