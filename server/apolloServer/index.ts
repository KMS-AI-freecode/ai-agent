import { ApolloServer } from '@apollo/server'
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer'
import { Server } from 'http'
import { applyMiddleware } from 'graphql-middleware'
import { schema } from '../nexus'
import { ApolloContext } from '../nexus/context'
import { permissions } from './permissions'
// import { schema } from '../graphql/schema'

/**
 * Создает и настраивает экземпляр Apollo Server
 *
 * @param httpServer HTTP сервер для плагина drain
 * @param enableIntrospection Флаг включения/отключения интроспекции схемы
 * @returns Инстанс Apollo Server
 */
export const createApolloServer = (
  httpServer: Server,
  enableIntrospection: boolean = true,
): ApolloServer<ApolloContext> => {
  const apolloServer = new ApolloServer<ApolloContext>({
    schema: applyMiddleware(schema, permissions),
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
    introspection: enableIntrospection,
  })

  return apolloServer
}
