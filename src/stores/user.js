import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  initClient, connectClient,
  sendCode, signIn, signInWithPassword,
  getQRLogin, checkQRLogin, onQRUpdate, signInWithQRPassword,
  getMe, disconnect as tgDisconnect
} from '../services/telegram'
import { loadSession, clearSession } from '../services/session'

export const useUserStore = defineStore('user', () => {
  const state = ref(0)    // 0=init, 1=code_sent, 2=need_2fa, 3=qr_waiting, 100=logged_in
  const user = ref(null)
  const phoneCodeHash = ref('')
  const phone = ref('')
  const error = ref('')
  const loading = ref(false)
  const qrToken = ref(null)
  const qrSvg = ref('')

  const isLoggedIn = computed(() => state.value === 100)
  const isUserLoaded = computed(() => user.value !== null)

  async function tryAutoLogin() {
    const session = loadSession()
    if (!session) return false
    try {
      await initClient(session)
      const result = await connectClient()
      if (result.authorized) {
        state.value = 100
        user.value = result.user
        return true
      }
    } catch (e) {
      console.error('Auto login failed:', e)
      clearSession()
    }
    return false
  }

  async function startQRLogin() {
    loading.value = true
    error.value = ''
    try {
      await initClient()
      await connectClient()
      const result = await getQRLogin()
      if (result.type === 'qr') {
        qrToken.value = result.token
        state.value = 3
      } else if (result.type === 'already') {
        state.value = 100
        user.value = await getMe()
      }
    } catch (e) {
      error.value = e.message || 'QR login failed'
    } finally {
      loading.value = false
    }
  }

  async function pollQRLogin() {
    const result = await checkQRLogin()
    if (result?.authorized) {
      state.value = 100
      user.value = result.user
      return true
    }
    if (result?.needs2fa) {
      state.value = 2
      return false
    }
    return false
  }

  async function finishQRPassword(password) {
    loading.value = true
    error.value = ''
    try {
      await signInWithQRPassword(password)
      state.value = 100
      user.value = await getMe()
    } catch (e) {
      error.value = e.message || 'Invalid password'
    } finally {
      loading.value = false
    }
  }

  async function startPhoneLogin(phoneNumber) {
    loading.value = true
    error.value = ''
    try {
      await initClient()
      await connectClient()
      const result = await sendCode(phoneNumber)
      phoneCodeHash.value = result.phoneCodeHash
      phone.value = phoneNumber
      state.value = 1
    } catch (e) {
      error.value = e.message || 'Failed to send code'
    } finally {
      loading.value = false
    }
  }

  async function verifyCode(code) {
    loading.value = true
    error.value = ''
    try {
      const result = await signIn(phone.value, code, phoneCodeHash.value)
      if (result.needs2fa) {
        state.value = 2
        return
      }
      state.value = 100
      user.value = await getMe()
    } catch (e) {
      error.value = e.message || 'Invalid code'
    } finally {
      loading.value = false
    }
  }

  async function verifyPassword(password) {
    loading.value = true
    error.value = ''
    try {
      await signInWithPassword(password)
      state.value = 100
      user.value = await getMe()
    } catch (e) {
      error.value = e.message || 'Invalid password'
    } finally {
      loading.value = false
    }
  }

  function logout() {
    clearSession()
    state.value = 0
    user.value = null
    qrToken.value = null
    qrSvg.value = ''
  }

  return {
    state, user, phoneCodeHash, phone, error, loading, qrToken, qrSvg,
    isLoggedIn, isUserLoaded,
    tryAutoLogin, startQRLogin, pollQRLogin, finishQRPassword,
    startPhoneLogin, verifyCode, verifyPassword, logout
  }
})
