import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

function resolveManualChunks(id: string) {
  if (!id.includes('/node_modules/')) {
    return undefined
  }

  if (id.includes('/react-dom/') || id.includes('/react/')) {
    return 'vendor-react'
  }

  if (id.includes('/react-router-dom/') || id.includes('/@remix-run/router/')) {
    return 'vendor-router'
  }

  if (id.includes('/@tanstack/react-query/')) {
    return 'vendor-query'
  }

  if (id.includes('/axios/')) {
    return 'vendor-axios'
  }

  if (id.includes('/tdesign-icons-react/')) {
    return 'vendor-tdesign-icons'
  }

  return undefined
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:8080'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/setupTests.ts',
      css: true,
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: resolveManualChunks,
        },
      },
    },
  }
})
