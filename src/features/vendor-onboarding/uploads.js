import { ApiError, api, unwrap } from "@/lib/api"

export const MAX_BYTES = 5 * 1024 * 1024
export const MAX_PORTFOLIO = 10
export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"]
export const ACCEPT_ATTR = ACCEPTED_TYPES.join(",")

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS === "true"
const EXTENSION_TYPES = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

const PLAIN_MESSAGES = {
  PORTFOLIO_LIMIT_REACHED: `You can have up to ${MAX_PORTFOLIO} portfolio images.`,
  PORTFOLIO_IMAGE_REQUIRED: "Add another portfolio image before removing the last one.",
  UPLOADS_UNAVAILABLE: "Photo uploads are temporarily unavailable. Please try again later.",
  INVALID_UPLOAD_ASSET: "Choose a JPEG, PNG or WebP image no larger than 5 MB.",
  INVALID_UPLOAD_KIND: "That photo type is not supported.",
  UPLOAD_NOT_FOUND: "The upload did not finish. Please try again.",
}

export class UploadError extends Error {
  constructor(message) {
    super(message)
    this.name = "UploadError"
  }
}

const sentence = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : "")

export function friendlyError(error) {
  if (error instanceof UploadError) return error.message
  if (error instanceof ApiError) return PLAIN_MESSAGES[error.code] ?? sentence(error.message)
  return "Something went wrong. Please try again."
}

const typeOf = (file) =>
  file.type || EXTENSION_TYPES[file.name?.split(".").pop()?.toLowerCase()] || ""

// Checked in the browser before anything is sent.
export function validateImageFile(file) {
  if (!file) return "Choose an image to upload."
  if (!ACCEPTED_TYPES.includes(typeOf(file))) return "Only JPEG, PNG or WebP images are allowed."
  if (file.size > MAX_BYTES) return "That image is larger than 5 MB. Choose a smaller one."
  if (file.size === 0) return "That file is empty. Choose a different image."
  return ""
}

export async function compressImage(file) {
  const { default: imageCompression } = await import("browser-image-compression")
  const compressed = await imageCompression(file, {
    maxSizeMB: USE_MOCKS ? 0.15 : 1,
    maxWidthOrHeight: USE_MOCKS ? 800 : 1920,
    useWebWorker: false,
  })
  return compressed.size < file.size ? compressed : file
}

// Exactly the six fields the signature covers. Any extra field breaks it.
export function buildUploadForm(signed, file) {
  const form = new FormData()
  form.append("file", file, file.name || "photo")
  form.append("api_key", signed.apiKey)
  form.append("timestamp", String(signed.timestamp))
  form.append("signature", signed.signature)
  form.append("folder", signed.folder)
  form.append("allowed_formats", signed.allowedFormats)
  return form
}

function xhrUpload(signed, file, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open("POST", signed.uploadUrl)
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(Math.round((event.loaded / event.total) * 100))
    }
    xhr.onload = () => {
      let body = {}
      try {
        body = JSON.parse(xhr.responseText)
      } catch {
        // not JSON: treated as a failure below
      }
      if (xhr.status >= 200 && xhr.status < 300 && body.public_id) return resolve(body)
      console.warn("Cloudinary rejected the upload:", body?.error?.message)
      reject(new UploadError("The upload was rejected. Please try again."))
    }
    xhr.onerror = () =>
      reject(new UploadError("Network problem. Check your connection and try again."))
    xhr.send(buildUploadForm(signed, file))
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// Mock mode: same stages and progress, no real Cloudinary.
async function simulateUpload(signed, file, onProgress) {
  for (const percent of [10, 30, 55, 80, 100]) {
    await sleep(200)
    onProgress(percent)
  }
  const { rememberMockImage } = await import("@/mocks/mockImages")
  const publicId = `${signed.folder}/mock_${Date.now().toString(36)}`
  await rememberMockImage(publicId, file)
  return { public_id: publicId }
}

export const uploadToCloudinary = (signed, file, onProgress) =>
  USE_MOCKS ? simulateUpload(signed, file, onProgress) : xhrUpload(signed, file, onProgress)

export const signUpload = async (profileId, kind) =>
  unwrap(await api.post(`/vendors/${profileId}/uploads/sign`, { kind }))

export const confirmUpload = async (profileId, kind, publicId) =>
  unwrap(await api.post(`/vendors/${profileId}/uploads/confirm`, { kind, publicId }))

export const removePortfolioImage = async (profileId, imageId) =>
  unwrap(await api.delete(`/vendors/${profileId}/portfolio/${imageId}`))

// check, sign (a fresh signature every time), compress, upload, confirm
export async function uploadPhoto({
  profileId,
  kind,
  file,
  onStage = () => {},
  onProgress = () => {},
}) {
  const problem = validateImageFile(file)
  if (problem) throw new UploadError(problem)

  onStage("compressing")
  const signed = await signUpload(profileId, kind)
  let prepared
  try {
    prepared = await compressImage(file)
  } catch {
    throw new UploadError("We could not prepare that image. Try a different one.")
  }
  if (prepared.size > MAX_BYTES) {
    throw new UploadError(
      "That image is still larger than 5 MB after compressing. Choose a smaller one.",
    )
  }

  onStage("uploading")
  onProgress(0)
  const uploaded = await uploadToCloudinary(signed, prepared, onProgress)

  onStage("saving")
  return confirmUpload(profileId, kind, uploaded.public_id)
}
