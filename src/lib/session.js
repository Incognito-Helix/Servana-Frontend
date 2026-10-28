const KEY = "servana_session"

// One random id per browser tab. The API can use it so the order of paid results
// stays the same while someone scrolls (PRD 5.4, rule 5).
export function getSessionSeed() {
  try {
    let id = sessionStorage.getItem(KEY)
    if (!id) {
      id = globalThis.crypto?.randomUUID?.() ?? String(Math.random()).slice(2)
      sessionStorage.setItem(KEY, id)
    }
    return id
  } catch {
    return "anon"
  }
}
