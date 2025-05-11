/* eslint-disable no-console */
import { FieldResolver } from 'nexus'
import { processStimulus } from '../../MindLog/helpers/processStimulus'
import { LowDbMessage } from '../../../../lowdb/interfaces'
import { generateId } from '../../../../utils/id'
import { NexusGenObjects } from '../../../generated/nexus'
import { PUBSUB_MESSAGE_ADDED } from '../interfaces'

export const sendMessageResolver: FieldResolver<
  'Mutation',
  'sendMessage'
> = async (source, args, ctx, info) => {
  const { text } = args
  const { currentUser, lowDb } = ctx

  if (!currentUser) {
    throw new Error('Not authorized')
  }

  /**
   * Сохраняем сообщение в бд
   */

  const message: LowDbMessage = {
    id: generateId(),
    createdAt: new Date(),
    text,
  }

  currentUser.Messages.push(message)

  const reply: NexusGenObjects['Message'] | null = await processStimulus(
    source,
    {
      content: message.text,
    },
    ctx,
    info,
  )

  // console.log('sendMessageResolver reply', reply)

  await lowDb.write()

  // Публикуем сообщение для подписок
  ctx.pubsub.publish(PUBSUB_MESSAGE_ADDED, message)

  return {
    reply,
  }
}
