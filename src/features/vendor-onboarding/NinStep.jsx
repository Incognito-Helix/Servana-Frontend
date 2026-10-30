import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useQueryClient } from "@tanstack/react-query"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FieldError } from "./fields"
import { PROFILE_KEY, useSaveStep } from "./hooks"
import {
  MAX_ATTEMPTS,
  NIN_LENGTH,
  maskedNin,
  reasonText,
  redactNin,
  statusOf,
  validateNin,
} from "./nin"
import { verifyNin } from "./ninApi"
import { fetchVendorProfile } from "./profileApi"
import { REVIEW_PATH, stepPath } from "./steps"

const POLL_MS = 2000
const MAX_POLLS = 30

const BADGES = {
  not_submitted: ["remote", "Not submitted"],
  pending: ["pending", "Checking"],
  passed: ["verified", "Passed"],
  failed: ["rejected", "Failed"],
}

function StatusBadge({ status }) {
  const [variant, label] = BADGES[status] ?? BADGES.not_submitted
  return <Badge variant={variant}>{label}</Badge>
}

// Not the shared step form: nothing on this screen is saved as you type.
export default function NinStep({ step, profile }) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const saveStep = useSaveStep()
  const inputRef = useRef(null)
  const [digits, setDigits] = useState(0)
  const [problem, setProblem] = useState("")
  const [notice, setNotice] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [stalled, setStalled] = useState(false)
  const [pollRound, setPollRound] = useState(0)

  const check = profile.ninVerification ?? {}
  const status = statusOf(profile)
  const checking = submitting || status === "pending"

  // While a check is pending, ask for the profile again until it settles.
  useEffect(() => {
    if (status !== "pending") return undefined
    let polls = 0
    const timer = setInterval(async () => {
      polls += 1
      try {
        queryClient.setQueryData(PROFILE_KEY, await fetchVendorProfile())
      } catch {
        // try again on the next tick
      }
      if (polls >= MAX_POLLS) {
        clearInterval(timer)
        setStalled(true)
      }
    }, POLL_MS)
    return () => clearInterval(timer)
  }, [status, pollRound, queryClient])

  const applyOutcome = (outcome) => {
    if (outcome.kind === "result") {
      queryClient.setQueryData(PROFILE_KEY, (old) =>
        old
          ? {
              ...old,
              ninVerification: {
                status: outcome.status,
                lastFour: outcome.lastFour,
                reason: outcome.reason,
              },
            }
          : old,
      )
      return
    }
    if (outcome.kind === "rate_limited") {
      setBlocked(true)
      return
    }
    if (outcome.kind === "invalid") {
      setProblem(`Your NIN must be exactly ${NIN_LENGTH} digits, numbers only.`)
      return
    }
    if (outcome.kind === "already_verified") {
      fetchVendorProfile()
        .then((fresh) => queryClient.setQueryData(PROFILE_KEY, fresh))
        .catch(() => {})
      return
    }
    setNotice(
      outcome.kind === "network"
        ? "Network problem. For your safety we cleared the field. Check your connection and enter your NIN again."
        : "Something went wrong. Please enter your NIN and try again.",
    )
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitting) return
    const entered = inputRef.current?.value ?? ""
    const message = validateNin(entered)
    if (message) {
      setProblem(message)
      return
    }
    setProblem("")
    setNotice("")
    setSubmitting(true)
    const nin = entered.trim()
    inputRef.current.value = "" // cleared as soon as the request is on its way
    setDigits(0)
    const outcome = await verifyNin(nin)
    setSubmitting(false)
    applyOutcome(outcome)
  }

  const goToReview = async () => {
    setNotice("")
    try {
      await saveStep.mutateAsync({ step, data: {}, advance: true })
      navigate(REVIEW_PATH)
    } catch (error) {
      setNotice(redactNin(error?.message) || "We could not continue. Please try again.")
    }
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <h1 className="font-heading text-2xl font-bold text-primary">NIN verification</h1>
          <StatusBadge status={checking ? "pending" : status} />
        </div>
        <p className="text-sm text-muted-foreground">
          We check your National Identification Number to confirm who you are. The name on it must
          match the first and last name on your account. Only the last 4 digits and the result are
          shown on your profile.
        </p>
      </header>

      <div aria-live="polite" className="space-y-4">
        {status === "passed" ? (
          <>
            <div className="space-y-1 rounded-lg bg-verified-soft px-4 py-3 text-verified">
              <p className="font-medium">Verified</p>
              <p className="text-sm">NIN ending in {check.lastFour}</p>
              <p className="font-mono text-sm tracking-widest">{maskedNin(check.lastFour)}</p>
            </div>
            <p className="text-sm text-muted-foreground">
              Your NIN and your account name are locked now. To change a verified name, contact
              support.
            </p>
          </>
        ) : checking ? (
          <div role="status" className="space-y-2 rounded-lg bg-marigold-soft px-4 py-3 text-sm">
            <p className="font-medium">Checking your NIN...</p>
            <p>This usually takes a few seconds. You can stay on this page.</p>
            {stalled ? (
              <>
                <p>This is taking longer than usual.</p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setStalled(false)
                    setPollRound((round) => round + 1)
                  }}
                >
                  Check again
                </Button>
              </>
            ) : null}
          </div>
        ) : (
          <>
            {status === "failed" ? (
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-[#B42318]"
              >
                {reasonText(check.reason)}. You can try again.
              </p>
            ) : null}

            {blocked ? (
              <p
                role="alert"
                className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]"
              >
                You have used all {MAX_ATTEMPTS} verification attempts for now. Please try again
                after 24 hours.
              </p>
            ) : null}

            <form onSubmit={submit} noValidate className="space-y-2">
              <Label htmlFor="nin-entry">NIN ({NIN_LENGTH} digits)</Label>
              <Input
                id="nin-entry"
                name="nin-entry"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
                spellCheck={false}
                data-private="true"
                aria-invalid={!!problem}
                aria-describedby="nin-help"
                disabled={blocked}
                onChange={(event) => {
                  setDigits(event.target.value.length)
                  setProblem("")
                }}
              />
              <p id="nin-help" className="text-xs text-muted-foreground">
                {digits}/{NIN_LENGTH} digits. Numbers only. You can check up to {MAX_ATTEMPTS} times
                in 24 hours.
              </p>
              <FieldError message={problem} />
              <Button type="submit" disabled={blocked || submitting}>
                {status === "failed" ? "Try again" : "Verify NIN"}
              </Button>
            </form>
          </>
        )}
      </div>

      {notice ? (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-[#B42318]">
          {notice}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" onClick={() => navigate(stepPath(step - 1))}>
          Back
        </Button>
        {status === "passed" ? (
          <Button type="button" onClick={goToReview} disabled={saveStep.isPending}>
            Save and review
          </Button>
        ) : (
          <Button
            type="button"
            variant="ghost"
            onClick={goToReview}
            disabled={checking || saveStep.isPending}
          >
            Review without verifying
          </Button>
        )}
      </div>
    </div>
  )
}
