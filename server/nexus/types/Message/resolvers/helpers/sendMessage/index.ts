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

type sendMessageProps = {
  ctx: ApolloContext
  args: NexusGenArgTypes['Mutation']['sendMessage'] & {
    fromUser: LowDbUser
    toUser: LowDbUser
  }
}

export const sendMessage = async ({
  args,
  ctx,
}: sendMessageProps): Promise<LowDbMessage | null> => {
  const { text, fromUser, toUser } = args

  // const { lowDb, Agent, currentUser } = ctx
  const { lowDb, Agent } = ctx

  /**
   * Сохраняем сообщение в бд
   */
  const message: LowDbMessage = {
    id: generateId(),
    createdAt: new Date(),
    text,
    userId: fromUser.id,
  }

  fromUser.Messages.push(message)

  // Публикуем сообщение для подписок
  ctx.pubsub.publish(PUBSUB_ACTIVITY_ADDED, message)

  // TODO Move to processStimulus
  const response = await processMessageBySkills({ user: toUser, message, ctx })

  let reply: LowDbMessage | null = null

  if (response !== undefined) {
    console.log('response', response)

    if (response.result) {
      reply = {
        id: generateId(),
        createdAt: new Date(),
        text: response.result,
        userId: toUser.id,
      }
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

      const message: LowDbMessage = {
        id: generateId(),
        text: `## Пользователь с ID "${fromUser.id}" написал сообщение:

${text}

### Я не понял, что он имеет в виду. Обработай сообщение ты и отправь ему итоговое сообщение.

Там есть вспомогательные тулзы, они могут быть тебе полезны. Так же через тулзу ты можешь отправить сообщение ему, или мне, или себе, или другому известному пользователю.
`,
        // userId: agent.userId,
        createdAt: new Date(),
        userId: toUser.id,
      }

      toUser.Messages.push(message)

      const messages: ChatCompletionMessageParam[] = [
        // { role: 'system', content: systemPrompt },
        { role: 'user', content: text, name: fromUser.id },
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

        // reply = {
        //   id: generateId(),
        //   createdAt: new Date(),
        //   text: ,
        //   userId: toUser.id,
        // }
      }
      // else {
      //   reply = {
      //     id: generateId(),
      //     createdAt: new Date(),
      //     text: `Я не смог понять, что ты сказал и переслал твое сообщение ИИ-агенту "${aiAgentUser.id}"`,
      //     userId: toUser.id,
      //   }

      // }

      reply = {
        id: generateId(),
        createdAt: new Date(),
        text: responseText,
        userId: toUser.id,
      }

      // console.log('sendMessageResolver reply', reply)
    }
  }

  if (reply) {
    toUser.Messages.push(reply)
  }

  await lowDb.write()

  return reply
}
