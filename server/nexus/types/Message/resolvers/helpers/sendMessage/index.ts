/* eslint-disable no-console */
// import { forwardMessageToAi } from '../../../../MindLog/helpers/processStimulus'
import {
  LowDbAgentData,
  LowDbMessage,
  LowDbUser,
} from '../../../../../../lowdb/interfaces'
import { generateId } from '../../../../../../utils/id'
// import { NexusGenObjects } from '../../../generated/nexus'
import { PUBSUB_ACTIVITY_ADDED } from '../../../interfaces'
import { processMessageBySkills } from '../../helpers/processMessageBySkills'
import { prepareSkillsSerializer } from '../../../../../context/skills'
import { ApolloContext } from '../../../../../context'
import { NexusGenArgTypes } from '../../../../../generated/nexus'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { sendOpenAiRequest } from '../../../../MindLog/helpers/processOpenAIRequest'
import { createMessage } from '../../../../../../lowdb/helpers'

type sendMessageProps = {
  ctx: ApolloContext
  args: NexusGenArgTypes['Mutation']['sendMessage'] & {
    fromUser: LowDbUser
    toUser: LowDbUser
  }
}

// TODO Надо доработать эту функцию
/**
 * Сейчас проблема в том, что эта функция не универсальная и не позволяет отправлять сообщение
 * кому угодно. Сейчас она рассчитана только на то, что внешний пользователь отправляет
 * сообщение агенту, а тот или сам отвечает, или пересылает ИИ агенту. Сам же напрямую он
 * не может слать ИИ агенту.
 */

export const sendMessage = async ({
  args,
  ctx,
}: sendMessageProps): Promise<LowDbMessage | null> => {
  const { text, fromUser, toUser } = args

  // const { lowDb, Agent, currentUser } = ctx
  const { lowDb, Agent } = ctx

  console.log('sendMessage fromUser', fromUser)
  console.log('sendMessage toUser', toUser)

  /**
   * Сохраняем сообщение в бд
   */
  // const message: LowDbMessage = {
  //   id: generateId(),
  //   createdAt: new Date(),
  //   text,
  //   userId: fromUser.id,
  // }

  // fromUser.Messages.push(message)

  const message = createMessage({
    fromUser,
    text,
  })

  // Публикуем сообщение для подписок
  ctx.pubsub.publish(PUBSUB_ACTIVITY_ADDED, message)

  // TODO Move to processStimulus
  const response = await processMessageBySkills({ user: toUser, message, ctx })

  let reply: LowDbMessage | null = null

  if (response !== undefined) {
    console.log('response', response)

    if (response.result) {
      // reply = {
      //   id: generateId(),
      //   createdAt: new Date(),
      //   text: response.result,
      //   userId: toUser.id,
      // }

      reply = createMessage({
        text: response.result,
        fromUser: toUser,
      })
    }
  } else {
    /**
     * Если сообщение не удалось обработать и если целевой пользователь -
     * главный агент приложения, то он запрашивает помощь в ИИ-агента
     */

    if (toUser === Agent) {
      // reply = await processStimulus(
      //   source,
      //   {
      //     content: message.text,
      //     agent: Agent,
      //   },
      //   ctx,
      //   info,
      // )

      const { lowDb, OPENAI_API_BASE_URL } = ctx

      const agentData: LowDbAgentData = {
        model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4.1-mini',
        endpoint: OPENAI_API_BASE_URL,
      } as const

      /**
       * Здесь надо получить или создать пользователя агента
       */
      let aiAgentUser: LowDbUser | undefined = lowDb.data.users.find((n) => {
        return n.type === 'Agent' && n.data?.model === agentData.model
      })

      if (!aiAgentUser) {
        aiAgentUser = {
          id: generateId(),
          createdAt: new Date(),
          type: 'Agent',
          name: agentData.model,
          Messages: [],
          MindLogs: [],
          Skills: prepareSkillsSerializer([]),
          Knowledges: [],
          Experiences: [],
          data: agentData,
        }

        lowDb.data.users.push(aiAgentUser)
      }

      // await forwardMessageToAi({
      //   args: {
      //     content: message.text,
      //     agent: toUser,
      //     // fromUser: currentUser,
      //     fromUser,
      //     aiAgentUser,
      //   },
      //   ctx,
      // })

      // const message: LowDbMessage = {
      //   id: generateId(),
      //   // userId: agent.userId,
      //   createdAt: new Date(),
      //   userId: toUser.id,
      // }

      const message = createMessage({
        fromUser: toUser,
        text: `## Пользователь с ID "${fromUser.id}" написал сообщение:

${text}

### Я не понял, что он имеет в виду. Обработай сообщение ты и отправь ему ответ.

### Правила обработки сообщения пользователя

В случае чего используй tools. Так же через тулзу ты можешь отправить сообщение ему, или мне, или себе, или другому известному пользователю. Если надо найти какую-то информацию и не получается это сделать, попробуй получить Knowledges через тулзу, там может быть подсказка. Система работает рекурсивно и ты можешь выполнить сразу несколько итераций до формирования конечного ответа.
`,
      })

      // toUser.Messages.push(message)

      const messages: ChatCompletionMessageParam[] = [
        // { role: 'system', content: systemPrompt },
        { role: 'user', content: message.text, name: toUser.id },
      ]

      // Instead of a direct request to OpenAI, we use our abstraction
      const aiAgentResponse = await sendOpenAiRequest({
        context: ctx,
        fromUser: toUser,
        toUser: aiAgentUser,
        messages,
      })

      console.log('aiAgentResponse', aiAgentResponse)

      let responseText = `Я не смог понять, что ты сказал и переслал твое сообщение ИИ-агенту "${aiAgentUser.id}".`

      if (aiAgentResponse) {
        responseText += `\n\nВот, что он ответил: ${aiAgentResponse}`
      }

      // reply = {
      //   id: generateId(),
      //   createdAt: new Date(),
      //   text: responseText,
      //   userId: toUser.id,
      // }

      reply = createMessage({
        text: responseText,
        fromUser: toUser,
      })

      // console.log('sendMessageResolver reply', reply)
    }
  }

  // if (reply) {
  //   toUser.Messages.push(reply)
  // }

  await lowDb.write()

  return reply
}
