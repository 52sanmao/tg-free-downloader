import { createRouter, createWebHashHistory } from 'vue-router'
import Setup from '../views/Setup.vue'
import Login from '../views/Login.vue'
import Chat from '../views/Chat.vue'
import Tasks from '../views/Tasks.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', redirect: '/setup' },
  { path: '/setup', name: 'Setup', component: Setup },
  { path: '/login', name: 'Login', component: Login },
  { path: '/chat', name: 'Chat', component: Chat },
  { path: '/tasks', name: 'Tasks', component: Tasks },
  { path: '/settings', name: 'Settings', component: Settings },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
