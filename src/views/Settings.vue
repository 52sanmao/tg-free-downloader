<template>
  <div class="settings-view">
    <div class="view-header">
      <h2>设置</h2>
    </div>

    <div class="settings-section">
      <h3>外观</h3>
      <div class="setting-item">
        <label>主题模式</label>
        <div class="toggle-group">
          <button class="toggle-btn" :class="{ active: theme === 'dark' }" @click="setTheme('dark')">暗色</button>
          <button class="toggle-btn" :class="{ active: theme === 'light' }" @click="setTheme('light')">亮色</button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <h3>代理设置</h3>
      <div class="setting-item">
        <label>代理类型</label>
        <select v-model="proxyType" class="setting-select">
          <option value="">无代理</option>
          <option value="socks">SOCKS5</option>
          <option value="mtproto">MTProto</option>
        </select>
      </div>
      <div v-if="proxyType" class="proxy-fields">
        <div class="setting-row">
          <input v-model="proxyIp" type="text" class="setting-input" placeholder="IP 地址" />
          <input v-model="proxyPort" type="text" class="setting-input small" placeholder="端口" />
        </div>
        <div v-if="proxyType === 'mtproto'" class="setting-row">
          <input v-model="proxySecret" type="text" class="setting-input" placeholder="Secret" />
        </div>
        <button class="btn-primary btn-sm" @click="saveProxy">保存代理</button>
      </div>
      <div v-if="proxyStatus" class="setting-status" :class="proxyStatus">{{ proxyStatus === 'ok' ? '代理正常' : '代理不可用' }}</div>
    </div>

    <div class="settings-section">
      <h3>下载</h3>
      <div class="setting-item">
        <label>默认下载目录</label>
        <div class="dir-select">
          <span class="dir-path">{{ downloadDir || '未设置（使用系统默认）' }}</span>
          <button class="btn-sm" @click="selectDownloadDir">选择目录</button>
        </div>
      </div>
      <div class="setting-item">
        <label>同时下载数</label>
        <select v-model.number="maxConcurrent" class="setting-select">
          <option :value="1">1</option>
          <option :value="2">2</option>
          <option :value="3">3</option>
          <option :value="5">5</option>
          <option :value="10">10</option>
        </select>
      </div>
    </div>

    <div class="settings-section">
      <h3>账号</h3>
      <div class="setting-item">
        <label>当前用户</label>
        <span>{{ userStore.user?.username || userStore.user?.phone || userStore.user?.id || '未知' }}</span>
      </div>
      <div class="setting-item">
        <button class="btn-danger" @click="handleLogout">退出登录</button>
      </div>
    </div>

    <div class="settings-section">
      <h3>关于</h3>
      <div class="setting-item">
        <label>版本</label>
        <span>1.0.0</span>
      </div>
      <div class="disclaimer-box">
        <h4>免责声明</h4>
        <p>本工具基于 MIT 协议开源，仅供学习研究使用。Telegram API 使用请遵守 <a href="javascript:;" @click="openLink('https://telegram.org/tos')">Telegram 服务条款</a> 和当地法律法规。</p>
        <p class="github-link">源码: <a href="javascript:;" @click="openLink('https://github.com/anomalyco/opencode')">GitHub</a></p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '../stores/user'

const userStore = useUserStore()
const router = useRouter()

const theme = ref(localStorage.getItem('app-theme') || 'dark')
const proxyType = ref(localStorage.getItem('proxy-type') || '')
const proxyIp = ref(localStorage.getItem('proxy-ip') || '')
const proxyPort = ref(localStorage.getItem('proxy-port') || '')
const proxySecret = ref(localStorage.getItem('proxy-secret') || '')
const proxyStatus = ref('')
const downloadDir = ref(localStorage.getItem('download-dir') || '')
const maxConcurrent = ref(Number(localStorage.getItem('max-concurrent')) || 3)

function setTheme(t) {
  theme.value = t
  localStorage.setItem('app-theme', t)
  document.querySelector('.app').className = `app ${t}`
}

function saveProxy() {
  localStorage.setItem('proxy-type', proxyType.value)
  localStorage.setItem('proxy-ip', proxyIp.value)
  localStorage.setItem('proxy-port', proxyPort.value)
  localStorage.setItem('proxy-secret', proxySecret.value)
  proxyStatus.value = 'ok'
  setTimeout(() => { proxyStatus.value = '' }, 3000)
}

async function selectDownloadDir() {
  const { ipcRenderer } = window.require('electron')
  const dir = await ipcRenderer.invoke('select-file', { isDir: true })
  if (dir) {
    downloadDir.value = dir
    localStorage.setItem('download-dir', dir)
  }
}

function handleLogout() {
  userStore.logout()
  router.push('/login')
}

function openLink(url) {
  const { shell } = window.require('electron')
  shell.openExternal(url)
}

onMounted(() => {
  document.querySelector('.app').className = `app ${theme.value}`
})
</script>
