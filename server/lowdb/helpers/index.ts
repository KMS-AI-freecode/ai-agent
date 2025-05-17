import { ApolloContext } from '../../nexus/context'
import { generateId } from '../../utils/id'
import { LowDbMessage, LowDbUser } from '../interfaces'

export function getUser(userId: string, lowDb: ApolloContext['lowDb']) {
  const user = lowDb.data.users.find((n) => n.id === userId)

  if (!user) {
    throw new Error('Can not get user')
  }

  return user
}

type createMessageProps = {
  text: string
  fromUser: LowDbUser
  toUser?: LowDbUser
}

export function createMessage({
  text,
  fromUser,
  toUser,
}: createMessageProps): LowDbMessage {
  const message: LowDbMessage = {
    id: generateId(),
    text,
    createdAt: new Date(),
    userId: fromUser.id,
    toUserId: toUser?.id,
  }

  fromUser.Messages.push(message)

  return message
}
