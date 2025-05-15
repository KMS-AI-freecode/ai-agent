import { ApolloContext } from '../../nexus/context'

export function getUser(userId: string, lowDb: ApolloContext['lowDb']) {
  const user = lowDb.data.users.find((n) => n.id === userId)

  if (!user) {
    throw new Error('Can not get user')
  }

  return user
}
