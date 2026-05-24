import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'remove-crossorigin',
      transformIndexHtml(html) {
        return html.replace(/\bcrossorigin\b/g, '')
      }
    }
  ],
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: ['electron']
    }
  },
  server: {
    port: 5173
  }
})
