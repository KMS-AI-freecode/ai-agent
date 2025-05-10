import { ApolloContext } from '../../nexus/context'

export function getUser(userId: string, ctx: ApolloContext) {
  const user = ctx.lowDb.data.users.find((n) => n.id === userId)

  if (!user) {
    throw new Error('Can not get user')
  }

  return user
}
