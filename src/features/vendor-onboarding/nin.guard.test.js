import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const FILES = [
  "./nin.js",
  "./ninApi.js",
  "./NinStep.jsx",
  "../../mocks/nin.handlers.js",
  "../../mocks/nin.rules.js",
]

const FORBIDDEN = [
  [/console\./, "console output"],
  [/localStorage|sessionStorage|indexedDB/, "browser storage"],
  [/useAutosave|StepForm|useZodForm|useForm\b/, "form or autosave helpers"],
  [/useMutation/, "a mutation hook"],
  [/saveVendorStep/, "the step save"],
]

describe("NIN files stay clean", () => {
  it.each(FILES)("%s has no logging, storage or autosave", (path) => {
    const source = readFileSync(new URL(path, import.meta.url), "utf8")
    for (const [pattern, what] of FORBIDDEN) {
      expect(pattern.test(source), `${path} must not use ${what}`).toBe(false)
    }
  })
})
