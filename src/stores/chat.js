import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDialogs, getMessages } from '../services/telegram'

export const useChatStore = defineStore('chat', () => {
  const dialogs = ref([])
  const messages = ref([])
  const currentChat = ref(null)
  const loading = ref(false)
  const messagesLoading = ref(false)

  async function loadDialogs() {
    loading.value = true
    try {
      dialogs.value = await getDialogs()
    } catch (e) {
      console.error('Failed to load dialogs:', e)
    } finally {
      loading.value = false
    }
  }

  async function loadMessages(chatId, limit = 50) {
    messagesLoading.value = true
    try {
      messages.value = await getMessages(chatId, limit)
    } catch (e) {
      console.error('Failed to load messages:', e)
    } finally {
      messagesLoading.value = false
    }
  }

  function selectChat(chat) {
    currentChat.value = chat
    messages.value = []
    loadMessages(chat.id)
  }

  return { dialogs, messages, currentChat, loading, messagesLoading, loadDialogs, loadMessages, selectChat }
})
