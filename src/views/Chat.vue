<template>
  <div class="chat-view">
    <div class="chat-panel">
      <div class="chat-panel-header">
        <h2>对话</h2>
        <div class="header-actions">
          <button class="btn-icon" @click="showSearch = !showSearch" :class="{ active: showSearch }" title="搜索">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </button>
          <button class="btn-icon" @click="chatStore.loadDialogs()" title="刷新">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
          </button>
        </div>
      </div>

      <div v-if="showSearch" class="search-bar">
        <input v-model="searchQuery" type="text" placeholder="搜索对话..." @input="filterDialogs" />
      </div>

      <div class="chat-list">
        <div v-if="chatStore.loading" class="loading">加载中...</div>
        <div v-for="chat in filteredDialogs" :key="chat.id"
          class="chat-item"
          :class="{ active: chatStore.currentChat?.id === chat.id }"
          @click="selectChat(chat)">
          <div class="chat-avatar" :style="{ background: stringToColor(chat.id) }">
            {{ chat.name[0].toUpperCase() }}
          </div>
          <div class="chat-info">
            <div class="chat-name">{{ chat.name }}</div>
            <div class="chat-preview">{{ chat.lastMessage || '暂无消息' }}</div>
          </div>
          <div class="chat-meta">
            <div v-if="chat.date" class="chat-date">{{ formatTime(chat.date) }}</div>
            <div v-if="chat.unreadCount" class="unread-badge">{{ chat.unreadCount }}</div>
          </div>
        </div>
        <div v-if="!chatStore.loading && filteredDialogs.length === 0" class="empty-list">
          无匹配对话
        </div>
      </div>
    </div>

    <div class="message-panel">
      <template v-if="chatStore.currentChat">
        <div class="message-panel-header">
          <div class="header-left">
            <h2>{{ chatStore.currentChat.name }}</h2>
            <span class="header-subtitle">{{ selectedMessages.length > 0 ? `已选 ${selectedMessages.length} 条` : '' }}</span>
          </div>
          <div class="header-actions">
            <input v-model="msgSearchQuery" type="text" class="msg-search-input"
              placeholder="搜索消息..." @keyup.enter="searchMessages" v-if="showMsgSearch" />
            <button class="btn-icon" @click="showMsgSearch = !showMsgSearch" title="搜索消息">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
            <button class="btn-icon" @click="toggleSelectMode" :class="{ active: selectMode }" title="多选">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </button>
            <button v-if="selectedMessages.length > 0" class="btn-primary btn-sm" @click="downloadSelected">
              下载已选 ({{ selectedMessages.length }})
            </button>
            <button v-if="selectedMessages.length > 0" class="btn-icon" @click="selectedMessages = []" title="取消选择">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        </div>

        <div v-if="msgSearchResults.length > 0" class="search-results-bar">
          搜索到 {{ msgSearchResults.length }} 条结果
          <button class="btn-icon-sm" @click="msgSearchResults = []; msgSearchQuery = ''">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div class="messages" ref="messagesRef" @scroll="onScroll">
          <div v-if="chatStore.messagesLoading" class="loading">加载中...</div>
          <div v-for="msg in displayMessages" :key="msg.id"
            class="message-item"
            :class="{ 'has-media': msg.hasMedia, 'selected': selectedMessages.includes(msg.id), 'search-match': msgSearchResults.find(s => s.id === msg.id) }"
            @click="handleMsgClick(msg)">
            <div v-if="selectMode" class="msg-checkbox">
              <div class="checkbox" :class="{ checked: selectedMessages.includes(msg.id) }"></div>
            </div>
            <div class="msg-body">
              <div class="msg-text">{{ msg.message || (msg.hasMedia ? getMediaLabel(msg) : '') }}</div>
              <div class="msg-meta">
                <span class="msg-date">{{ formatTime(msg.date) }}</span>
                <div class="msg-tags">
                  <span v-if="msg.hasMedia" class="tag tag-media">{{ getMediaType(msg) }}</span>
                  <span v-if="msg.fileSize" class="tag tag-size">{{ formatSize(msg.fileSize) }}</span>
                </div>
                <div class="msg-actions" v-if="!selectMode">
                  <button v-if="msg.hasMedia" class="btn-icon-sm" @click.stop="downloadSingle(msg)" title="下载">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div v-if="!chatStore.messagesLoading && chatStore.messages.length === 0" class="empty-msg">
            暂无消息
          </div>
        </div>

        <div class="message-footer" v-if="taskStore.activeCount > 0">
          <div class="footer-progress">
            <span>下载中: {{ taskStore.activeCount }} 个任务</span>
            <router-link to="/tasks" class="footer-link">查看任务</router-link>
          </div>
        </div>
      </template>

      <div v-else class="no-chat-selected">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="64" height="64">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
        <p>选择一个对话开始</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useChatStore } from '../stores/chat'
import { useTaskStore } from '../stores/task'
import { useUserStore } from '../stores/user'
import { downloadMedia, searchMessages as tgSearch } from '../services/telegram'
import dayjs from 'dayjs'

const chatStore = useChatStore()
const taskStore = useTaskStore()
const userStore = useUserStore()
const router = useRouter()

const showSearch = ref(false)
const showMsgSearch = ref(false)
const searchQuery = ref('')
const msgSearchQuery = ref('')
const msgSearchResults = ref([])
const selectMode = ref(false)
const selectedMessages = ref([])
const messagesRef = ref(null)

const filteredDialogs = computed(() => {
  if (!searchQuery.value) return chatStore.dialogs
  const q = searchQuery.value.toLowerCase()
  return chatStore.dialogs.filter(d => d.name.toLowerCase().includes(q))
})

const displayMessages = computed(() => {
  if (msgSearchResults.value.length > 0) {
    return msgSearchResults.value
  }
  return chatStore.messages
})

onMounted(() => {
  if (!userStore.isLoggedIn) {
    router.push('/login')
    return
  }
  chatStore.loadDialogs()
})

function selectChat(chat) {
  selectedMessages.value = []
  selectMode.value = false
  msgSearchResults.value = []
  msgSearchQuery.value = ''
  chatStore.selectChat(chat)
}

async function searchMessages() {
  if (!msgSearchQuery.value || !chatStore.currentChat) return
  const results = await tgSearch(chatStore.currentChat.id, msgSearchQuery.value, 50)
  msgSearchResults.value = results
}

function toggleSelectMode() {
  selectMode.value = !selectMode.value
  if (!selectMode.value) selectedMessages.value = []
}

function handleMsgClick(msg) {
  if (selectMode.value) {
    const idx = selectedMessages.value.indexOf(msg.id)
    if (idx >= 0) selectedMessages.value.splice(idx, 1)
    else selectedMessages.value.push(msg.id)
  }
}

async function downloadSingle(msg) {
  try {
    const path = await window.electronAPI.saveFile({
      defaultName: `media_${msg.id}${getExt(msg)}`,
      extensions: undefined
    })
    if (!path) return
    taskStore.addTask('单文件下载', { msgId: msg.id, chatId: chatStore.currentChat.id })
    await downloadMedia(msg, path, (p) => {
      taskStore.updateLastProgress(p)
    })
  } catch (e) {
    console.error('Download failed:', e)
  }
}

async function downloadSelected() {
  const dir = await window.electronAPI.selectFile({ isDir: true })
  if (!dir) return
  taskStore.addBatchTask(chatStore.currentChat.id, selectedMessages.value, dir)
  selectedMessages.value = []
  selectMode.value = false
  router.push('/tasks')
}

function getExt(msg) {
  if (msg.fileName) return '.' + msg.fileName.split('.').pop()
  if (msg.mediaType === 'MessageMediaPhoto') return '.jpg'
  if (msg.mediaType === 'MessageMediaDocument') return '.bin'
  return ''
}

function getMediaLabel(msg) {
  if (msg.mediaType === 'MessageMediaPhoto') return '[图片]'
  if (msg.mediaType === 'MessageMediaDocument') {
    return msg.fileName || '[文件]'
  }
  return '[媒体]'
}

function getMediaType(msg) {
  if (msg.mediaType === 'MessageMediaPhoto') return '图片'
  if (msg.mediaType === 'MessageMediaDocument') return msg.fileName ? msg.fileName.split('.').pop() : '文件'
  return '媒体'
}

function formatTime(ts) {
  if (!ts) return ''
  const d = dayjs.unix(ts)
  const now = dayjs()
  if (d.isSame(now, 'day')) return d.format('HH:mm')
  if (d.isSame(now, 'year')) return d.format('MM-DD HH:mm')
  return d.format('YYYY-MM-DD')
}

function formatSize(bytes) {
  if (!bytes) return ''
  if (bytes < 1024) return bytes + 'B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + 'KB'
  return (bytes / 1024 / 1024).toFixed(1) + 'MB'
}

function stringToColor(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash)
  const h = hash % 360
  return `hsl(${h}, 55%, 45%)`
}

function onScroll() {
  // Could implement infinite scroll here
}
</script>
