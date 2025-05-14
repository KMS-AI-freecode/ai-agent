/* eslint-disable no-console */
import { FieldResolver } from 'nexus'
import { processStimulus } from '../../MindLog/helpers/processStimulus'
import { LowDbMessage } from '../../../../lowdb/interfaces'
import { generateId } from '../../../../utils/id'
import { NexusGenObjects } from '../../../generated/nexus'
import { PUBSUB_MESSAGE_ADDED } from '../interfaces'
import { processMessage } from './helpers/processMessage'

export const sendMessageResolver: FieldResolver<
  'Mutation',
  'sendMessage'
> = async (source, args, ctx, info) => {
  const { text } = args
  const { lowDb } = ctx

  // if (!currentUser) {
  //   throw new Error('Not authorized')
  // }

  const { agent } = lowDb.data

  if (!agent) {
    throw new Error('Have no agent')
  }

  // console.log('agent.functions', agent.functions)
  // console.log('agent.functions[0].fn', agent.functions[0].fn)
  // console.log('typeof agent.functions[0].fn', typeof agent.functions[0].fn)

  /**
   * Сохраняем сообщение в бд
   */

  const message: LowDbMessage = {
    id: generateId(),
    createdAt: new Date(),
    text,
  }

  // currentUser.Messages.push(message)

  // Публикуем сообщение для подписок
  ctx.pubsub.publish(PUBSUB_MESSAGE_ADDED, message)

  // TODO Move to processStimulus
  const response = await processMessage({ message, ctx })

  let reply: LowDbMessage | undefined

  if (response !== undefined) {
    console.log('response', response)
    reply = {
      id: generateId(),
      createdAt: new Date(),
      text: response.result,
    }
  } else {
    const reply: NexusGenObjects['Message'] | null = await processStimulus(
      source,
      {
        content: message.text,
      },
      ctx,
      info,
    )
    console.log('sendMessageResolver reply', reply)
  }

  await lowDb.write()

  return {
    reply,
  }
}
