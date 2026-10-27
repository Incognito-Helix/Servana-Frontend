import { useCallback, useState } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { PROFILE_KEY } from "./hooks"
import { friendlyError, uploadPhoto } from "./uploads"

export const applySnapshot = (profile, snapshot) => ({
  ...profile,
  coverImageUrl: snapshot.coverImageUrl,
  profileImageUrl: snapshot.profileImageUrl,
  portfolioImages: snapshot.portfolioImages,
})

export function usePhotoUpload({ profileId, kind }) {
  const queryClient = useQueryClient()
  const [stage, setStage] = useState("idle")
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState("")

  // Returns "" on success, or the message to show.
  const start = useCallback(
    async (file) => {
      setError("")
      setProgress(0)
      try {
        const snapshot = await uploadPhoto({
          profileId,
          kind,
          file,
          onStage: setStage,
          onProgress: setProgress,
        })
        queryClient.setQueryData(PROFILE_KEY, (old) => (old ? applySnapshot(old, snapshot) : old))
        return ""
      } catch (caught) {
        const message = friendlyError(caught)
        setError(message)
        return message
      } finally {
        setStage("idle")
      }
    },
    [profileId, kind, queryClient],
  )

  return { stage, progress, error, busy: stage !== "idle", start }
}
