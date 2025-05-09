import { createServer as createViteServer } from 'vite'
import type { Express } from 'express'
import express from 'express'
// import type { Server } from 'http'
import path from 'path'
import fs from 'fs'

/**
 * Интеграция Vite с Express
 */
export async function setupViteServer(
  app: Express,
  isProd: boolean,
): Promise<void> {
  // В production режиме просто отдаем статику
  if (isProd) {
    const distPath = path.resolve(__dirname, '../client')

    // Проверяем, существует ли директория
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath))

      // Отдаем index.html для всех остальных запросов (SPA)
      app.get('*', (req, res) => {
        res.sendFile(path.join(distPath, 'index.html'))
      })
    } else {
      console.warn(
        `Warning: Production build directory ${distPath} does not exist.`,
      )
    }
    return
  }

  // Создаем Vite сервер в режиме разработки
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: {
        port: 3001,
      },
    },
    appType: 'spa',
  })

  // Интегрируем vite middleware с express
  app.use(vite.middlewares)

  // Обрабатываем все остальные запросы через index.html
  app.use('*', async (req, res, next) => {
    const url = req.originalUrl

    try {
      // Загружаем index.html
      let template = fs.readFileSync(
        path.resolve(__dirname, '../src/index.html'),
        'utf-8',
      )

      // Применяем трансформации Vite
      template = await vite.transformIndexHtml(url, template)

      res.status(200).set({ 'Content-Type': 'text/html' }).end(template)
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      next(e)
    }
  })
}

// Функция для закрытия вите сервера, если потребуется
export async function closeViteServer(_server: Express): Promise<void> {
  // server
}
