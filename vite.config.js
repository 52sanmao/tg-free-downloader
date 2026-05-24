import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'fix-gramjs-inspect',
      resolveId(id) {
        if (id === 'util' || id.endsWith('/telegram/inspect.js') || id.endsWith('\\telegram\\inspect.js')) {
          return '\0util-shim'
        }
      },
      load(id) {
        if (id === '\0util-shim') {
          return 'export const inspect = { custom: Symbol.for("nodejs.util.inspect.custom") }; export default { inspect }'
        }
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
    target: 'esnext',
    rollupOptions: {
      external: ['electron'],
    },
  },
  server: {
    port: 5173
  }
})
