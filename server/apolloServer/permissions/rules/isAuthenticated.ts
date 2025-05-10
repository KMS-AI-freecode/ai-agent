import { rule } from 'graphql-shield'
import { ApolloContext } from '../../../nexus/context'

/**
 * Пользователь авторизован
 */
export const isAuthenticated = rule()((_parent, _args, ctx: ApolloContext) => {
  return Boolean(ctx.currentUser)
})
