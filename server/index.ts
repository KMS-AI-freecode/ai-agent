/* eslint-disable no-console */
import './config'

import express from 'express'
import { createServer } from 'http'
import { expressMiddleware } from '@apollo/server/express4'
import { json } from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { renderGraphiQL } from 'graphql-helix'
import fs from 'fs'

// Импорт интеграции с Vite
import { setupViteServer } from './viteServer'

// Импорт сервисов и модулей
import { createApolloServer } from './apolloServer'
import { createLowDb } from './lowdb'
import { createContext } from './nexus/context'

// Загрузка переменных окружения
dotenv.config()

// Загрузка шаблонов GraphQL запросов
const graphiqlTemplatesPath = path.join(
  __dirname,
  'graphql',
  'templates',
  'graphiql-examples.graphql',
)
const defaultQuery = fs.readFileSync(graphiqlTemplatesPath, 'utf8')

// Определение порта и режима
const port = parseInt(process.env.PORT || '3000', 10)
const isProd = process.env.NODE_ENV === 'production'

const withPlayground = process.env.GRAPHQL_DISABLE_PLAYGROUND !== 'true'
const enableIntrospection = process.env.GRAPHQL_DISABLE_INTROSPECTION !== 'true'

// Асинхронная функция для запуска сервера
async function startServer() {
  // Создание Express приложения
  const expressApp = express()
  const httpServer = createServer(expressApp)

  const lowDb = await createLowDb()

  // Инициализация Apollo Server с поддержкой WebSocket подписок
  const { server: apolloServer } = createApolloServer({
    httpServer,
    enableIntrospection,
    lowDb,
  })

  // Запуск Apollo Server
  await apolloServer.start()

  if (withPlayground) {
    // Добавляем GraphiQL интерфейс для тестирования GraphQL API
    expressApp.get('/graphiql', (req, res) => {
      res.send(
        renderGraphiQL({
          endpoint: '/api',
          defaultQuery,
        }),
      )
    })
  }

  // Применение Apollo middleware для Express
  expressApp.use(
    '/api',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async (args) => {
        // Создаем соединение для каждого запроса
        // const connection = worldManager.createConnection(false)

        return createContext({
          ...args,
          // worldManager
          lowDb,
        })
      },
    }),
  )

  // expressApp.all('*', (req, res) => {
  //   return handle(req, res)
  // })

  // Интеграция с Vite (разработка) или раздача статики (production)
  await setupViteServer(expressApp, isProd)

  // Запуск сервера
  const serverInstance = httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port}`)
    console.log(`> GraphQL API available at http://localhost:${port}/api`)
    console.log(
      `> GraphQL Subscriptions available at ws://localhost:${port}/api`,
    )
    withPlayground &&
      console.log(
        `> GraphiQL interface available at http://localhost:${port}/graphiql`,
      )
  })

  // Обработка остановки сервера
  const gracefulShutdown = async () => {
    console.log('Получен сигнал остановки, завершаю работу...')

    try {
      // Остановка Apollo Server
      await apolloServer.stop()
      console.log('Apollo Server остановлен')

      // Закрытие HTTP сервера
      serverInstance.close(() => {
        console.log('HTTP сервер остановлен')

        // Дополнительная очистка ресурсов
        // Например, закрытие соединений с базой данных

        console.log('Сервер корректно завершил работу')
        process.exit(0)
      })

      /**
       * Перед закрытием надо записать текущее состояние базы данных
       */
      await lowDb.write()

      // Установка таймаута для принудительного завершения, если что-то зависнет
      setTimeout(() => {
        console.error(
          'Не удалось корректно завершить работу за отведенное время, принудительное завершение',
        )
        process.exit(1)
      }, 10000) // 10 секунд таймаут
    } catch (error) {
      console.error('Ошибка при остановке сервера:', error)
      process.exit(1)
    }
  }

  // Регистрация обработчиков сигналов остановки
  process.on('SIGTERM', gracefulShutdown)
  process.on('SIGINT', gracefulShutdown)
}

// Обработка ошибок при запуске сервера
startServer().catch((err) => {
  console.error('Error starting server:', err)
  process.exit(1)
})
