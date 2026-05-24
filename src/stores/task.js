import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { downloadBulk } from '../services/telegram'
import dayjs from 'dayjs'

let taskIdCounter = 0

export const useTaskStore = defineStore('task', () => {
  const tasks = ref([])

  const activeCount = computed(() => tasks.value.filter(t => t.status === 'running').length)
  const completedCount = computed(() => tasks.value.filter(t => t.status === 'completed').length)
  const failedCount = computed(() => tasks.value.filter(t => t.status === 'failed').length)
  const hasTasks = computed(() => tasks.value.length > 0)

  function addTask(type, params) {
    const task = {
      id: ++taskIdCounter,
      type, params,
      status: 'pending',
      progress: 0,
      total: params.total || 0,
      current: 0,
      createdAt: Date.now(),
      completedAt: null,
      error: null,
      results: [],
    }
    tasks.value.unshift(task)
    return task
  }

  function updateLastProgress(pct) {
    if (tasks.value.length > 0 && tasks.value[0].status === 'running') {
      tasks.value[0].progress = pct
    }
  }

  async function addBatchTask(chatId, messageIds, outputDir) {
    const task = {
      id: ++taskIdCounter,
      type: 'batch_download',
      params: { chatId, messageIds, outputDir },
      status: 'running',
      progress: 0,
      total: messageIds.length,
      current: 0,
      createdAt: Date.now(),
      completedAt: null,
      error: null,
      results: [],
    }
    tasks.value.unshift(task)

    try {
      const results = await downloadBulk(chatId, messageIds, outputDir, (current, total, pct) => {
        task.current = current
        task.progress = Math.round(((current + pct / 100) / total) * 100)
      })
      task.results = results
      task.status = 'completed'
      task.progress = 100
      task.completedAt = Date.now()
    } catch (e) {
      task.status = 'failed'
      task.error = e.message
    }
    return task
  }

  function removeTask(taskId) {
    tasks.value = tasks.value.filter(t => t.id !== taskId)
  }

  function clearCompleted() {
    tasks.value = tasks.value.filter(t => t.status !== 'completed')
  }

  function retryTask(taskId) {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return
    task.status = 'pending'
    task.error = null
  }

  return { tasks, activeCount, completedCount, failedCount, hasTasks,
    addTask, updateLastProgress, addBatchTask, removeTask, clearCompleted, retryTask }
})
