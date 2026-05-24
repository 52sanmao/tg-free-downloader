<template>
  <div class="app" :class="{ dark: isDark }">
    <div class="app-container">
      <Sidebar v-if="userStore.isLoggedIn" />
      <main class="main-content" :class="{ 'no-sidebar': !userStore.isLoggedIn }">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from './stores/user'
import Sidebar from './components/Sidebar.vue'

const userStore = useUserStore()
const router = useRouter()
const isDark = ref(true)

onMounted(async () => {
  const loggedIn = await userStore.tryAutoLogin()
  if (!loggedIn) {
    router.push('/login')
  }
})
</script>
