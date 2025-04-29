/* eslint-disable no-console */
import express from 'express'
import { createServer } from 'http'
import next from 'next'
import { ApolloServer } from '@apollo/server'
import { expressMiddleware } from '@apollo/server/express4'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { json } from 'body-parser'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import * as lancedb from '@lancedb/lancedb'

// Импорт GraphQL схемы
import { MindLogService } from './services/mindLogService'
import { ApolloContext } from './types/context'
import { schema } from './graphql/schema'

// Загрузка переменных окружения
dotenv.config()

// Определение порта и режима
const port = parseInt(process.env.PORT || '3000', 10)
const dev = process.env.NODE_ENV !== 'production'

// Инициализация Next.js
const app = next({ dev })
const handle = app.getRequestHandler()

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

  // Инициализация Apollo Server с нашей схемой
  const apolloServer = new ApolloServer<ApolloContext>({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: process.env.GRAPHQL_DISABLE_INTROSPECTION !== 'true',
  })

  // Запуск Apollo Server
  await apolloServer.start()

  // Применение Apollo middleware для Express
  expressApp.use(
    '/api',
    cors<cors.CorsRequest>(),
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => ({
        req,
        lancedbConnection,
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
  })
}

// Обработка ошибок при запуске сервера
startServer().catch((err) => {
  console.error('Error starting server:', err)
  process.exit(1)
})
