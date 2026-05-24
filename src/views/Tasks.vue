<template>
  <div class="tasks-view">
    <div class="view-header">
      <h2>下载任务</h2>
      <div class="header-actions">
        <span class="task-stats">
          活跃: {{ taskStore.activeCount }}
          | 完成: {{ taskStore.completedCount }}
          | 失败: {{ taskStore.failedCount }}
        </span>
        <button v-if="taskStore.completedCount || taskStore.failedCount" class="btn-sm" @click="taskStore.clearCompleted()">
          清除已完成
        </button>
      </div>
    </div>

    <div v-if="!taskStore.hasTasks" class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48" style="opacity:0.3">
        <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
      </svg>
      <p>暂无下载任务</p>
      <p class="hint">在聊天页面选择消息后点击下载来创建任务</p>
    </div>

    <div v-for="task in taskStore.tasks" :key="task.id" class="task-card" :class="task.status">
      <div class="task-header">
        <div class="task-info">
          <span class="task-type">{{ task.type }}</span>
          <span class="task-status-badge" :class="task.status">{{ statusLabel(task.status) }}</span>
        </div>
        <div class="task-time">{{ formatTime(task.createdAt) }}</div>
      </div>

      <div v-if="task.params?.messageIds" class="task-detail">
        共 {{ task.params.messageIds.length }} 个文件
      </div>

      <div class="task-progress-area" v-if="task.status === 'running' || task.status === 'pending'">
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
        </div>
        <div class="progress-info">
          <span class="progress-text">{{ task.progress }}%</span>
          <span v-if="task.total" class="progress-count">{{ task.current }}/{{ task.total }}</span>
        </div>
      </div>

      <div v-if="task.results && task.results.length > 0" class="task-results">
        <div class="result-summary">
          <span class="result-ok">成功: {{ task.results.filter(r => r.status === 'done').length }}</span>
          <span class="result-skip">跳过: {{ task.results.filter(r => r.status === 'skipped').length }}</span>
          <span class="result-fail">失败: {{ task.results.filter(r => r.status === 'failed').length }}</span>
        </div>
      </div>

      <div v-if="task.error" class="task-error">{{ task.error }}</div>

      <div class="task-actions">
        <button v-if="task.status === 'failed'" class="btn-icon-sm" @click="taskStore.retryTask(task.id)" title="重试">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg>
        </button>
        <button class="btn-icon-sm" @click="taskStore.removeTask(task.id)" title="删除">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useTaskStore } from '../stores/task'
import dayjs from 'dayjs'

const taskStore = useTaskStore()

function formatTime(ts) {
  if (!ts) return ''
  return dayjs(ts).format('MM-DD HH:mm:ss')
}

function statusLabel(s) {
  return { running: '下载中', completed: '已完成', failed: '失败', pending: '等待中' }[s] || s
}
</script>
