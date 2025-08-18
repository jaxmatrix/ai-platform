import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [preact()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://backend-dev:5000',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '')
          console.log(path, newPath)
          return newPath
        }
      }
    }
  },
  preview: {
    port: 4000,
    proxy: {
      '/api': {
        target: 'http://backend-prod:5000',
        changeOrigin: true,
        rewrite: (path) => {
          const newPath = path.replace(/^\/api/, '')
          console.log(path, newPath)
          return newPath
        }
      }
    }
  }
})
