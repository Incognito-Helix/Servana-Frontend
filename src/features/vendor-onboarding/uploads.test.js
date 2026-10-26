import { describe, expect, it } from "vitest"
import { ApiError } from "@/lib/api"
import {
  MAX_BYTES,
  UploadError,
  buildUploadForm,
  friendlyError,
  validateImageFile,
} from "./uploads"

const file = (name, type, size = 1024) => new File([new Uint8Array(size)], name, { type })

describe("image checks", () => {
  it.each([
    ["a.jpg", "image/jpeg"],
    ["a.png", "image/png"],
    ["a.webp", "image/webp"],
  ])("accepts %s", (name, type) => expect(validateImageFile(file(name, type))).toBe(""))

  it("falls back to the extension when the browser gives no type", () => {
    expect(validateImageFile(file("photo.PNG", ""))).toBe("")
  })

  it.each([
    ["a.gif", "image/gif"],
    ["a.pdf", "application/pdf"],
    ["a.svg", "image/svg+xml"],
  ])("rejects %s", (name, type) =>
    expect(validateImageFile(file(name, type))).toMatch(/JPEG, PNG or WebP/),
  )

  it("rejects files over 5 MB, and accepts exactly 5 MB", () => {
    expect(validateImageFile(file("big.jpg", "image/jpeg", MAX_BYTES + 1))).toMatch(
      /larger than 5 MB/,
    )
    expect(validateImageFile(file("ok.jpg", "image/jpeg", MAX_BYTES))).toBe("")
  })

  it("rejects empty files and no file", () => {
    expect(validateImageFile(file("empty.jpg", "image/jpeg", 0))).toMatch(/empty/)
    expect(validateImageFile(undefined)).toBeTruthy()
  })
})

describe("the Cloudinary form", () => {
  it("has exactly the signed fields and nothing else", () => {
    const form = buildUploadForm(
      {
        apiKey: "k",
        timestamp: 1700000000,
        signature: "s",
        folder: "servana/vendors/p1/cover",
        allowedFormats: "jpg,png,webp",
      },
      file("a.jpg", "image/jpeg"),
    )
    expect([...form.keys()]).toEqual([
      "file",
      "api_key",
      "timestamp",
      "signature",
      "folder",
      "allowed_formats",
    ])
    expect(form.get("timestamp")).toBe("1700000000")
    expect(form.has("upload_preset")).toBe(false)
  })
})

describe("friendly errors", () => {
  it("uses the upload message as it is", () =>
    expect(friendlyError(new UploadError("Nope."))).toBe("Nope."))

  it("maps known API codes", () => {
    const limit = new ApiError({
      status: 409,
      code: "PORTFOLIO_LIMIT_REACHED",
      message: "you can have up to 10 portfolio images",
    })
    expect(friendlyError(limit)).toBe("You can have up to 10 portfolio images.")
  })

  it("capitalises other API messages and hides unknown errors", () => {
    const other = new ApiError({ status: 400, code: "X", message: "something specific" })
    expect(friendlyError(other)).toBe("Something specific")
    expect(friendlyError(new Error("boom"))).toBe("Something went wrong. Please try again.")
  })
})
