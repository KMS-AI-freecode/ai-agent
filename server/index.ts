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
import { createContext } from './graphql/context'
import { WorldManager } from './world'

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

  // Инициализация worldManager и Gun.js
  // worldManager.initializeServer(httpServer)

  const worldManager = new WorldManager(httpServer)

  // Логируем успешную инициализацию
  console.log('Gun.js сервер инициализирован через worldManager')

  // Инициализация Apollo Server
  const apolloServer = createApolloServer(httpServer, enableIntrospection)

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

        return createContext({ ...args, worldManager })
      },
    }),
  )

  // expressApp.all('*', (req, res) => {
  //   return handle(req, res)
  // })

  // Интеграция с Vite (разработка) или раздача статики (production)
  await setupViteServer(expressApp, isProd)

  // Запуск сервера
  httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port}`)
    console.log(`> GraphQL API available at http://localhost:${port}/api`)
    console.log(`> Gun.js server available at http://localhost:${port}/gun`)
    withPlayground &&
      console.log(
        `> GraphiQL interface available at http://localhost:${port}/graphiql`,
      )
  })
}

// Обработка ошибок при запуске сервера
startServer().catch((err) => {
  console.error('Error starting server:', err)
  process.exit(1)
})
