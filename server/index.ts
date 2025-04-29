/* eslint-disable no-console */
import express from 'express'
import { createServer } from 'http'
import next from 'next'
import { expressMiddleware } from '@apollo/server/express4'
import { json } from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import * as lancedb from '@lancedb/lancedb'
import { renderGraphiQL } from 'graphql-helix'
import fs from 'fs'

// Импорт сервисов и модулей
import { MindLogService } from './services/mindLogService'
import { createApolloServer } from './apolloServer'

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
const dev = process.env.NODE_ENV !== 'production'

const app = next({ dev })
const handle = app.getRequestHandler()

const withPlayground = process.env.GRAPHQL_DISABLE_PLAYGROUND !== 'true'
const enableIntrospection = process.env.GRAPHQL_DISABLE_INTROSPECTION !== 'true'

// Асинхронная функция для запуска сервера
async function startServer() {
  // Подготовка Next.js
  await app.prepare()

  // Создание Express приложения
  const expressApp = express()
  const httpServer = createServer(expressApp)

  // Инициализация LanceDB соединения
  const dbPath =
    process.env.LANCEDB_PATH || path.join(process.cwd(), 'data', 'lancedb')

  console.log(`Connecting to LanceDB at ${dbPath}`)

  const lancedbConnection = await lancedb.connect(dbPath)

  // Инициализация сервисов
  const mindLogService = new MindLogService(lancedbConnection)

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
          title: 'AI Agent GraphQL API',
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
      context: async ({ req }) => ({
        req,
        lanceDb: lancedbConnection,
        services: {
          mindLogService,
        },
      }),
    }),
  )

  // Обработка всех остальных запросов через Next.js
  expressApp.all('*', (req, res) => {
    return handle(req, res)
  })

  // Запуск сервера
  httpServer.listen(port, () => {
    console.log(`> Server listening at http://localhost:${port}`)
    console.log(`> GraphQL API available at http://localhost:${port}/api`)
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
