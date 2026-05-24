import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
  ],
  root: '.',
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'util': path.resolve(__dirname, 'src/shims/util.js'),
      'events': path.resolve(__dirname, 'src/shims/events.js'),
      'crypto': path.resolve(__dirname, 'src/shims/crypto.js'),
      'fs': path.resolve(__dirname, 'src/shims/fs.js'),
      'path': path.resolve(__dirname, 'src/shims/path.js'),
      'net': path.resolve(__dirname, 'src/shims/net.js'),
      'os': path.resolve(__dirname, 'src/shims/os.js'),
      'stream': path.resolve(__dirname, 'src/shims/stream.js'),
      'assert': path.resolve(__dirname, 'src/shims/assert.js'),
      'constants': path.resolve(__dirname, 'src/shims/constants.js'),
    },
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
    port: 5173,
  },
})