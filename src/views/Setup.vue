<template>
  <div class="setup-wrapper">
    <div class="setup-card">
      <h1>TG Free Downloader</h1>
      <p class="subtitle">首次使用需要设置 Telegram API 凭证</p>

      <div class="guide">
        <p>1. 访问 <a href="#" @click.prevent="openLink">my.telegram.org/apps</a> 并登录你的 Telegram 账号</p>
        <p>2. 创建一个应用，获取 <strong>App api_id</strong> 和 <strong>App api_hash</strong></p>
        <p>3. 将以下两项填入（凭证仅保存在本地）</p>
      </div>

      <div class="form">
        <label>
          <span>API ID</span>
          <input v-model="apiId" type="text" placeholder="例如：12345678" />
        </label>
        <label>
          <span>API Hash</span>
          <input v-model="apiHash" type="text" placeholder="例如：1a2b3c4d5e6f7g8h9i0j" />
        </label>
        <p v-if="error" class="error">{{ error }}</p>
        <button @click="save" :disabled="!valid">保存并继续</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const apiId = ref('')
const apiHash = ref('')
const error = ref('')

const valid = computed(() => {
  return /^\d+$/.test(apiId.value) && apiHash.value.length >= 10
})

function openLink() {
  const { shell } = window.require('electron')
  shell.openExternal('https://my.telegram.org/apps')
}

function save() {
  if (!valid.value) {
    error.value = '请填写正确的 API ID（数字）和 API Hash（至少 10 位）'
    return
  }
  localStorage.setItem('tg-api-id', apiId.value)
  localStorage.setItem('tg-api-hash', apiHash.value)
  localStorage.setItem('tg-setup-done', '1')
  router.push('/login')
}
</script>

<style scoped>
.setup-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  background: #1a1a2e;
}
.setup-card {
  background: #16213e;
  padding: 40px;
  border-radius: 12px;
  max-width: 480px;
  width: 90%;
  color: #e0e0e0;
}
h1 {
  margin: 0 0 4px;
  font-size: 24px;
  color: #fff;
}
.subtitle {
  color: #888;
  margin: 0 0 24px;
  font-size: 14px;
}
.guide {
  background: #0f3460;
  padding: 16px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.8;
  margin-bottom: 24px;
}
.guide a {
  color: #4fc3f7;
}
.form label {
  display: block;
  margin-bottom: 16px;
}
.form label span {
  display: block;
  font-size: 13px;
  margin-bottom: 4px;
  color: #aaa;
}
.form input {
  width: 100%;
  padding: 10px 12px;
  background: #0f3460;
  border: 1px solid #1a3a6a;
  border-radius: 6px;
  color: #fff;
  font-size: 14px;
  box-sizing: border-box;
}
.form input:focus {
  outline: none;
  border-color: #4fc3f7;
}
.error {
  color: #ff5252;
  font-size: 13px;
  margin: 0 0 12px;
}
button {
  width: 100%;
  padding: 12px;
  background: #4fc3f7;
  border: none;
  border-radius: 6px;
  color: #16213e;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
