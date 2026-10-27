import { useMemo } from "react"
import { z } from "zod"
import StepForm from "./StepForm"
import PhotoSlot from "./PhotoSlot"
import PortfolioGrid from "./PortfolioGrid"

const schemaFor = ({ hasCover, hasProfile, portfolioCount }) =>
  z.object({}).superRefine((_, ctx) => {
    if (!hasCover)
      ctx.addIssue({ code: "custom", path: ["coverImage"], message: "Add a cover image" })
    if (!hasProfile)
      ctx.addIssue({ code: "custom", path: ["profileImage"], message: "Add a profile photo" })
    if (portfolioCount < 1)
      ctx.addIssue({
        code: "custom",
        path: ["portfolio"],
        message: "Add at least one portfolio image",
      })
  })

export default function PhotosStep({ step, profile }) {
  const images = profile.portfolioImages ?? []
  const schema = useMemo(
    () =>
      schemaFor({
        hasCover: Boolean(profile.coverImageUrl),
        hasProfile: Boolean(profile.profileImageUrl),
        portfolioCount: images.length,
      }),
    [profile.coverImageUrl, profile.profileImageUrl, images.length],
  )

  return (
    <StepForm
      step={step}
      title="Photos"
      description="Show customers your work. Photos are compressed in your browser before they upload."
      schema={schema}
      defaultValues={{}}
    >
      {({ formState: { errors } }) => (
        <>
          <p className="rounded-lg bg-marigold-soft px-3 py-2 text-sm">
            Do not show phone numbers, emails or other personal information in your photos. We check
            this before approving your profile.
          </p>
          <PhotoSlot
            profileId={profile.id}
            kind="cover"
            label="Cover image"
            hint="A wide photo of your work. It shows at the top of your profile."
            url={profile.coverImageUrl}
            required
            error={errors.coverImage?.message}
          />
          <PhotoSlot
            profileId={profile.id}
            kind="profile"
            shape="round"
            label="Profile photo"
            hint="Your logo, or a clear photo of you."
            url={profile.profileImageUrl}
            required
            error={errors.profileImage?.message}
          />
          <PortfolioGrid profileId={profile.id} images={images} error={errors.portfolio?.message} />
        </>
      )}
    </StepForm>
  )
}
