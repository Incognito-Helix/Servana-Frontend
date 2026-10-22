const API = import.meta.env.VITE_API_URL
const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = ["image/jpeg", "image/png", "image/webp"]

export async function uploadImage(file) {
  if (!ALLOWED.includes(file.type)) throw new Error("Only JPEG, PNG and WebP images are allowed.")
  if (file.size > MAX_BYTES) throw new Error("File must be 5 MB or smaller.")

  const signRes = await fetch(`${API}/api/uploads/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ type: file.type, size: file.size }),
  })
  if (!signRes.ok) throw new Error((await signRes.json()).error)
  const s = await signRes.json()

  const form = new FormData()
  form.append("file", file)
  form.append("api_key", s.apiKey)
  form.append("timestamp", s.timestamp)
  form.append("signature", s.signature)
  form.append("upload_preset", s.uploadPreset)
  form.append("folder", s.folder)

  const upRes = await fetch(`https://api.cloudinary.com/v1_1/${s.cloudName}/image/upload`, {
    method: "POST",
    body: form,
  })
  const up = await upRes.json()
  if (!upRes.ok) throw new Error(up.error?.message || "Upload rejected.")

  const confirmRes = await fetch(`${API}/api/uploads/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ publicId: up.public_id }),
  })
  if (!confirmRes.ok) throw new Error((await confirmRes.json()).error)
  return confirmRes.json() // { publicId, url, thumbnails }
}
