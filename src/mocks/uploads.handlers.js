import { http, delay } from "msw"
import { ok, fail } from "./respond"
import { guard, load, profileFor, save } from "./vendor.handlers"
import { lookupMockImage, placeholderImage } from "./mockImages"

const API = import.meta.env.VITE_API_URL
const MAX_PORTFOLIO = 10
const MAX_BYTES = 5 * 1024 * 1024
const KINDS = ["cover", "profile", "portfolio"]
const IMAGE_FIELD = { cover: "coverImageUrl", profile: "profileImageUrl" }

const folderFor = (profileId, kind) => `servana/vendors/${profileId}/${kind}`

const snapshot = (profile, kind) => ({
  kind,
  coverImageUrl: profile.coverImageUrl ?? null,
  profileImageUrl: profile.profileImageUrl ?? null,
  portfolioImages: profile.portfolioImages ?? [],
})

// Only the owner of a profile can use its id.
function owned(request, params) {
  const { user, error } = guard(request)
  if (error) return { error }
  const profiles = load()
  const profile = profileFor(profiles, user)
  if (params.profileId !== profile.id)
    return { error: fail(403, "FORBIDDEN", "This is not your profile.") }
  return { profiles, profile }
}

const wrongKind = () => fail(400, "INVALID_UPLOAD_KIND", "Choose a supported photo type.")

// Routes from the backend lead's message.
export const uploadHandlers = [
  http.post(`${API}/vendors/:profileId/uploads/sign`, async ({ request, params }) => {
    await delay(250)
    const { error, profile } = owned(request, params)
    if (error) return error
    const { kind } = await request.json()
    if (!KINDS.includes(kind)) return wrongKind()
    if (kind === "portfolio" && (profile.portfolioImages ?? []).length >= MAX_PORTFOLIO) {
      return fail(409, "PORTFOLIO_LIMIT_REACHED", "You can have up to 10 portfolio images.")
    }
    return ok({
      uploadUrl: "https://api.cloudinary.com/v1_1/mock-cloud/image/upload",
      cloudName: "mock-cloud",
      apiKey: "mock-key",
      timestamp: Math.floor(Date.now() / 1000),
      signature: "mock-signature",
      folder: folderFor(profile.id, kind),
      allowedFormats: "jpg,png,webp",
      maxBytes: MAX_BYTES,
    })
  }),

  http.post(`${API}/vendors/:profileId/uploads/confirm`, async ({ request, params }) => {
    await delay(300)
    const { error, profiles, profile } = owned(request, params)
    if (error) return error
    const { kind, publicId } = await request.json()
    if (!KINDS.includes(kind)) return wrongKind()
    if (typeof publicId !== "string" || !publicId.startsWith(`${folderFor(profile.id, kind)}/`)) {
      return fail(
        400,
        "INVALID_UPLOAD_ASSET",
        "This upload does not belong to this vendor and photo type.",
      )
    }
    const url = lookupMockImage(publicId) ?? placeholderImage(`${kind} photo`)
    if (!profile.portfolioImages) profile.portfolioImages = []
    if (kind === "portfolio") {
      if (profile.portfolioImages.length >= MAX_PORTFOLIO) {
        return fail(409, "PORTFOLIO_LIMIT_REACHED", "You can have up to 10 portfolio images.")
      }
      const sortOrder = profile.portfolioImages.reduce(
        (next, image) => Math.max(next, image.sortOrder + 1),
        0,
      )
      profile.portfolioImages.push({
        id: `img_${Date.now().toString(36)}${sortOrder}`,
        url,
        sortOrder,
      })
    } else {
      profile[IMAGE_FIELD[kind]] = url
    }
    save(profiles)
    return ok(snapshot(profile, kind))
  }),

  http.delete(`${API}/vendors/:profileId/portfolio/:imageId`, async ({ request, params }) => {
    await delay(250)
    const { error, profiles, profile } = owned(request, params)
    if (error) return error
    const images = profile.portfolioImages ?? []
    const image = images.find((i) => i.id === params.imageId)
    if (!image) return fail(404, "IMAGE_NOT_FOUND", "Portfolio image not found.")
    if (["pending", "approved"].includes(profile.status) && images.length <= 1) {
      return fail(
        409,
        "PORTFOLIO_IMAGE_REQUIRED",
        "Add another portfolio image before removing the last one.",
      )
    }
    profile.portfolioImages = images.filter((i) => i.id !== image.id)
    save(profiles)
    return ok(snapshot(profile, "portfolio"))
  }),
]
