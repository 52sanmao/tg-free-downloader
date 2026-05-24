const STORAGE_KEY = 'tg_session'

export function loadSession() {
  try {
    return localStorage.getItem(STORAGE_KEY) || ''
  } catch {
    return ''
  }
}

export function storeSession(session) {
  try {
    localStorage.setItem(STORAGE_KEY, session)
  } catch {}
}

export function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {}
}
