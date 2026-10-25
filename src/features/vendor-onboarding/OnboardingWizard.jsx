import { Navigate, useParams } from "react-router-dom"
import { ErrorState } from "@/components/ui/error-state"
import { Skeleton } from "@/components/ui/skeleton"
import { useVendorProfile } from "./hooks"
import { currentStepOf, parseStep, resumePath } from "./steps"
import { STEP_COMPONENTS } from "./registry"
import Stepper from "./Stepper"

export function Shell({ children }) {
  return <div className="mx-auto w-full max-w-2xl px-4 py-6">{children}</div>
}

export function OnboardingSkeleton() {
  return (
    <Shell>
      <Skeleton className="h-6 w-2/3" />
      <Skeleton className="mt-6 h-8 w-1/2" />
      <Skeleton className="mt-4 h-10 w-full" />
      <Skeleton className="mt-4 h-10 w-full" />
    </Shell>
  )
}

export default function OnboardingWizard() {
  const { step: param } = useParams()
  const { data: profile, isPending, isError, error, refetch } = useVendorProfile()

  if (isPending) return <OnboardingSkeleton />
  if (isError) {
    return (
      <Shell>
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </Shell>
    )
  }

  const step = parseStep(param)
  const reached = currentStepOf(profile)
  if (step === null || step > reached) return <Navigate to={resumePath(profile)} replace />

  const StepComponent = STEP_COMPONENTS[step]
  return (
    <Shell>
      <Stepper active={step} reached={reached} />
      <div className="mt-6">
        <StepComponent key={step} step={step} profile={profile} />
      </div>
    </Shell>
  )
}
