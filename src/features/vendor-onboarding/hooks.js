import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchVendorProfile, saveVendorStep } from "./profileApi"

export const PROFILE_KEY = ["vendor-profile"]

export const useVendorProfile = () =>
  useQuery({ queryKey: PROFILE_KEY, queryFn: fetchVendorProfile })

export function useSaveStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveVendorStep,
    onSuccess: (profile) =>
      queryClient.setQueryData(PROFILE_KEY, (current) => mergeProfile(current, profile)),
  })
}
// A slow autosave response must never move the stepper backwards.
export function mergeProfile(current, incoming) {
  if (!current) return incoming
  return {
    ...incoming,
    onboarding_step: Math.max(current.onboarding_step ?? 1, incoming.onboarding_step ?? 1),
  }
}
