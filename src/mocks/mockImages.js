const memory = new Map()

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

export async function rememberMockImage(publicId, file) {
  memory.set(publicId, await readAsDataUrl(file))
}

export const lookupMockImage = (publicId) => memory.get(publicId) ?? null

export const placeholderImage = (label) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400"><rect width="100%" height="100%" fill="#EDEBFA"/><text x="50%" y="50%" fill="#1F1B5C" font-size="28" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`,
  )}`
