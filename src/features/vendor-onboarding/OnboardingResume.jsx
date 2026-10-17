import { Navigate } from "react-router-dom"
import { ErrorState } from "@/components/ui/error-state"
import { useVendorProfile } from "./hooks"
import { resumePath } from "./steps"
import { OnboardingSkeleton, Shell } from "./OnboardingWizard"

// Sends a vendor to the step where they stopped, or to their profile once setup is finished.
export default function OnboardingResume() {
  const { data: profile, isPending, isError, error, refetch } = useVendorProfile()
  if (isPending) return <OnboardingSkeleton />
  if (isError) {
    return (
      <Shell>
        <ErrorState message={error.message} onRetry={() => refetch()} />
      </Shell>
    )
  }
  if (profile.status !== "draft") return <Navigate to="/vendor/profile" replace />
  return <Navigate to={resumePath(profile)} replace />
}
