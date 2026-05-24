// Telegram API credentials
// Priority: localStorage (user-set) > env vars (CI/build-time) > defaults
export function getApiId() {
  if (typeof localStorage !== 'undefined') {
    const v = localStorage.getItem('tg-api-id')
    if (v) return Number(v)
  }
  return Number(import.meta.env.VITE_API_ID) || 0
}

export function getApiHash() {
  if (typeof localStorage !== 'undefined') {
    const v = localStorage.getItem('tg-api-hash')
    if (v) return v
  }
  return import.meta.env.VITE_API_HASH || ''
}

export function isSetupComplete() {
  return typeof localStorage !== 'undefined' && localStorage.getItem('tg-setup-done') === '1'
}
