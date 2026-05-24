// Telegram API credentials
// Get yours at https://my.telegram.org/apps (free, requires Telegram login)
// In production, set VITE_API_ID and VITE_API_HASH env vars, or fill in below
const API_ID = Number(import.meta.env.VITE_API_ID) || 0
const API_HASH = import.meta.env.VITE_API_HASH || ''

export { API_ID, API_HASH }
