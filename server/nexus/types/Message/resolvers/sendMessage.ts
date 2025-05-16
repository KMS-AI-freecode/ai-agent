/* eslint-disable no-console */
import { FieldResolver } from 'nexus'
import { createMindLogEntry } from '../../MindLog/helpers/createMindLog'
import { MindLogType } from '../../MindLog/interfaces'
import { sendMessage } from './helpers/sendMessage'

export const sendMessageResolver: FieldResolver<
  'Mutation',
  'sendMessage'
> = async (_source, args, ctx) => {
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

  const reply = await sendMessage({
    args: {
      ...args,
      fromUser: currentUser,
      toUser: Agent,
    },
    ctx,
  })

  return {
    reply,
  }
}
