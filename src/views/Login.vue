<template>
  <div class="login-view">
    <div class="login-card">
      <div class="login-header">
        <h1>TG Free Downloader</h1>
        <p>开源 Telegram 媒体下载工具 · 无需付费</p>
      </div>

      <div class="login-tabs">
        <button :class="{ active: tab === 'qr' }" @click="tab = 'qr'">二维码</button>
        <button :class="{ active: tab === 'phone' }" @click="tab = 'phone'">手机号</button>
      </div>

      <!-- QR Login -->
      <div v-if="tab === 'qr'" class="login-form">
        <div v-if="userStore.state === 3" class="qr-container">
          <div class="qr-display">
            <img :src="qrDataUrl" width="220" height="220" v-if="qrDataUrl" />
            <div v-else class="qr-placeholder">生成二维码中...</div>
          </div>
          <p class="qr-hint">使用 Telegram 扫码登录</p>
          <p class="qr-hint-sub">打开 Telegram → 设置 → 设备 → 扫描二维码</p>
          <button class="btn-secondary" @click="userStore.startQRLogin()" :disabled="userStore.loading">
            {{ userStore.loading ? '加载中...' : '刷新二维码' }}
          </button>
        </div>
        <div v-else class="qr-init">
          <button class="btn-primary" @click="startQR" :disabled="userStore.loading">
            {{ userStore.loading ? '加载中...' : '开始扫码登录' }}
          </button>
        </div>
      </div>

      <!-- Phone Login -->
      <div v-if="tab === 'phone'" class="login-form">
        <div v-if="userStore.state === 0">
          <div class="form-group">
            <label>手机号（国际格式，如 +8613800138000）</label>
            <input v-model="phoneInput" type="text" placeholder="+86..."
              @keyup.enter="sendCode" :disabled="userStore.loading" />
          </div>
          <button class="btn-primary" @click="sendCode" :disabled="userStore.loading || !phoneInput">
            {{ userStore.loading ? '发送中...' : '发送验证码' }}
          </button>
        </div>

        <div v-if="userStore.state === 1">
          <div class="form-group">
            <label>输入 Telegram 发送的验证码</label>
            <input v-model="codeInput" type="text" placeholder="验证码"
              @keyup.enter="verifyCode" :disabled="userStore.loading" />
          </div>
          <button class="btn-primary" @click="verifyCode" :disabled="userStore.loading || !codeInput">
            {{ userStore.loading ? '验证中...' : '登录' }}
          </button>
        </div>

        <div v-if="userStore.state === 2">
          <div class="form-group">
            <label>两步验证密码</label>
            <input v-model="passwordInput" type="password" placeholder="密码"
              @keyup.enter="verifyPassword" :disabled="userStore.loading" />
          </div>
          <button class="btn-primary" @click="verifyPassword" :disabled="userStore.loading || !passwordInput">
            {{ userStore.loading ? '验证中...' : '确认' }}
          </button>
        </div>
      </div>

      <p v-if="userStore.error" class="error-msg">{{ userStore.error }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'
import QRCode from 'qrcode'

const userStore = useUserStore()
const router = useRouter()
const tab = ref('qr')
const phoneInput = ref('')
const codeInput = ref('')
const passwordInput = ref('')
const qrUrl = ref('')
const qrDataUrl = ref('')
let pollTimer = null

function arrayToBase64Url(arr) {
  const bytes = new Uint8Array(arr)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function startQR() {
  await userStore.startQRLogin()
  if (userStore.state === 3 && userStore.qrToken) {
    qrUrl.value = `tg://login?token=${arrayToBase64Url(userStore.qrToken)}`
    QRCode.toDataURL(qrUrl.value, { width: 220, margin: 2 }, (err, url) => {
      if (!err) qrDataUrl.value = url
    })
    pollTimer = setInterval(pollQR, 3000)
  }
}

async function pollQR() {
  const done = await userStore.pollQRLogin()
  if (done) {
    clearInterval(pollTimer)
    router.push('/chat')
  }
  if (userStore.state === 2) {
    clearInterval(pollTimer)
  }
}

async function sendCode() {
  await userStore.startPhoneLogin(phoneInput.value)
}
async function verifyCode() {
  await userStore.verifyCode(codeInput.value)
  if (userStore.isLoggedIn) router.push('/chat')
}
async function verifyPassword() {
  if (tab.value === 'qr') {
    await userStore.finishQRPassword(passwordInput.value)
  } else {
    await userStore.verifyPassword(passwordInput.value)
  }
  if (userStore.isLoggedIn) router.push('/chat')
}

onUnmounted(() => {
  if (pollTimer) clearInterval(pollTimer)
})
</script>
