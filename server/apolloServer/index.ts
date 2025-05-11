import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { Server } from 'http'
import { applyMiddleware } from 'graphql-middleware'
import { WebSocketServer } from 'ws'
import { useServer } from 'graphql-ws/lib/use/ws'
import { schema } from '../nexus'
import { ApolloContext, createContext } from '../nexus/context'
import { permissions } from './permissions'

/**
 * Создает и настраивает экземпляр Apollo Server
 *
 * @param httpServer HTTP сервер для плагина drain
 * @param enableIntrospection Флаг включения/отключения интроспекции схемы
 * @returns Инстанс Apollo Server
 */

/**
 * Создает и настраивает экземпляр Apollo Server с поддержкой WebSocket для подписок
 *
 * @param httpServer HTTP сервер для плагина drain
 * @param enableIntrospection Флаг включения/отключения интроспекции схемы
 * @returns Объект с Apollo Server и функцией для очистки WebSocket сервера
 */
export const createApolloServer = ({
  httpServer,
  enableIntrospection = true,
  lowDb,
}: {
  httpServer: Server
  lowDb: ApolloContext['lowDb']
  enableIntrospection?: boolean
}): {
  server: ApolloServer<ApolloContext>
  // wsServerCleanup: { dispose: () => Promise<void> }
} => {
  // Создаем схему с применением middlewares
  const schemaWithMiddleware = applyMiddleware(schema, permissions)

  // Настраиваем WebSocket сервер
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/api',
  })

  // Интегрируем GraphQL с WebSocket сервером
  const wsServerCleanup = useServer(
    {
      schema: schemaWithMiddleware,
      // Добавляем функцию создания контекста для WebSocket соединений
      context: async (...args) => {
        const {
          extra: { request },
        } = args[0]

        request

        // Здесь мы можем получить информацию о соединении из ctx.connectionParams
        // и создать соответствующий контекст
        // const lowDb = await createLowDb() // Импортировать createLowDb

        // // Возвращаем контекст, который будет доступен в резолверах подписок
        // return createContext({
        //   req: {} as any, // WebSocket не имеет req/res как в HTTP, но можно добавить заглушку
        //   res: {} as any,
        //   lowDb,
        // })

        return createContext({
          lowDb,
          // TODO Пробросить объект запроса, чтобы получить пользователя.
          // Или как-то по-другому сделать, чтобы у нас пользователь
          // идентифицировался
          req: undefined,
        })
      },
    },
    wsServer,
  )

  // Создаем Apollo Server с поддержкой подписок
  const apolloServer = new ApolloServer<ApolloContext>({
    schema: schemaWithMiddleware,
    plugins: [
      // Корректное завершение работы HTTP сервера
      ApolloServerPluginDrainHttpServer({ httpServer }),

      // Корректное завершение работы WebSocket сервера
      {
        async serverWillStart() {
          return {
            async drainServer() {
              await wsServerCleanup.dispose()
            },
          }
        },
      },
    ],
    introspection: enableIntrospection,
  })

  return { server: apolloServer }
}
