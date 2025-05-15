/* eslint-disable no-console */
import { FieldResolver } from 'nexus'
import { processStimulus } from '../../MindLog/helpers/processStimulus'
import { LowDbMessage } from '../../../../lowdb/interfaces'
import { generateId } from '../../../../utils/id'
import { NexusGenObjects } from '../../../generated/nexus'
import { PUBSUB_ACTIVITY_ADDED } from '../interfaces'
import { processMessage } from './helpers/processMessage'
import { createMindLogEntry } from '../../MindLog/helpers/createMindLog'
import { MindLogType } from '../../MindLog/interfaces'

export const sendMessageResolver: FieldResolver<
  'Mutation',
  'sendMessage'
> = async (source, args, ctx, info) => {
  const { text } = args
  const { lowDb, Agent, currentUser } = ctx

  await createMindLogEntry({
    ctx,
    userId: Agent.id,
    type: MindLogType.Stimulus,
    data: `Поступило новое сообщение
      
  \`\`\`
  ${text}
  \`\`\``,
  })

  if (!currentUser) {
    await createMindLogEntry({
      ctx,
      userId: Agent.id,
      data: `Пользователь не авторизован, поэтому я верну ему ошибку доступа`,
      type: 'Reaction',
    })

    await lowDb.write()

    throw new Error('Not authorized')
  }

  /**
   * Сохраняем сообщение в бд
   */
  const message: LowDbMessage = {
    id: generateId(),
    createdAt: new Date(),
    text,
    userId: currentUser.id,
  }

  currentUser.Messages.push(message)

  // Публикуем сообщение для подписок
  ctx.pubsub.publish(PUBSUB_ACTIVITY_ADDED, message)

  // TODO Move to processStimulus
  const response = await processMessage({ message, ctx })

  let reply: LowDbMessage | undefined

  if (response !== undefined) {
    console.log('response', response)
    reply = {
      id: generateId(),
      createdAt: new Date(),
      text: response.result,
      userId: Agent.id,
    }
  } else {
    const reply: NexusGenObjects['Message'] | null = await processStimulus(
      source,
      {
        content: message.text,
        agent: Agent,
      },
      ctx,
      info,
    )
    console.log('sendMessageResolver reply', reply)
  }

  if (reply) {
    Agent.Messages.push(reply)
  }

  await lowDb.write()

  return {
    reply,
  }
}
