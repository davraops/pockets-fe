/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api/core': {
          target: env.VITE_API_CORE_URL || 'http://localhost:7000',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/core/, ''),
        },
        '/api/financial': {
          target: env.VITE_API_FINANCIAL_URL || 'http://localhost:7001',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/financial/, ''),
        },
        '/api/lifestyle': {
          target: env.VITE_API_LIFESTYLE_URL || 'http://localhost:7002',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/lifestyle/, ''),
          timeout: 120_000,
          proxyTimeout: 120_000,
        },
      },
    },
    optimizeDeps: {
      include: [
        '@mui/icons-material',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
      ],
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.ts'],
    },
  }
})
