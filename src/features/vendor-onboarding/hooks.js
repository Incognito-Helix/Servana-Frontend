import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { fetchVendorProfile, saveVendorStep } from "./profileApi"

export const PROFILE_KEY = ["vendor-profile"]

export const useVendorProfile = () =>
  useQuery({ queryKey: PROFILE_KEY, queryFn: fetchVendorProfile })

export function useSaveStep() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: saveVendorStep,
    onSuccess: (profile) => queryClient.setQueryData(PROFILE_KEY, profile),
  })
}
