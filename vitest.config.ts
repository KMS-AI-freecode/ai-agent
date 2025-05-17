import { defineConfig } from 'vitest/config'
import { loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  // Загружаем переменные окружения из .env.test
  process.env = { ...process.env, ...loadEnv(mode, process.cwd(), '') }

  return {
    test: {
      globals: true,
      environment: 'node',
      include: ['tests/**/*.{test,spec}.{js,ts}'],
      testTimeout: 60 * 5 * 1000,
      env: {
        OPENAI_API_KEY: process.env.OPENAI_API_KEY,
        OPENAI_API_BASE_URL: process.env.OPENAI_API_BASE_URL,
      },
    },
  }
})
