/* eslint-disable no-console */
import { GraphQLFieldResolver } from 'graphql'
import { MindLogType } from '../interfaces'
import { createMindLogEntry } from './createMindLog'
import { sendOpenAiRequest } from './processOpenAIRequest'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { getSystemPrompt } from './prompts/systemPrompt'
import { ApolloContext } from '../../../../nexus/context'
import { NexusGenObjects } from '../../../generated/nexus'
import { generateId } from '../../../../utils/id'
import {
  LowDbAgentData,
  LowDbMessage,
  LowDbUser,
} from '../../../../lowdb/interfaces'
import { prepareSkillsSerializer } from '../../../context/skills'

/**
 * Main processor for stimuli using OpenAI and tools
 */
export const processStimulus: GraphQLFieldResolver<
  unknown,
  ApolloContext,
  {
    content: string
    agent: LowDbUser
  },
  Promise<NexusGenObjects['Message'] | null>
> = async (_, data, context) => {
  const { lowDb, OPENAI_API_BASE_URL } = context

  const { agent, content: text } = data

  // const agentId = agent.id

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

  const message: LowDbMessage = {
    id: generateId(),
    text,
    // userId: agent.userId,
    createdAt: new Date(),
    userId: agent.id,
  }

  /**
   * По хорошему, тут надо бы как-то корректировать сообщение, чтобы агент
      от своего имени обращался к агенту
   */
  agent.Messages.push(message)

  /**
   * Надо переделать тут все и создать отдельну. функцию формирования контекста.
   */

  // Generate the complete system prompt
  const systemPrompt = getSystemPrompt()

  // Create or use existing messages
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: text },
  ]

  // Instead of a direct request to OpenAI, we use our abstraction
  const response = await sendOpenAiRequest({
    context,
    // agentId,
    aiAgentUser,
    messages,
    // systemPrompt,
    recursionLevel: 0,
  })

  console.log('processStimulus response', response)

  // Create final entry
  await createMindLogEntry({
    ctx: context,
    userId: agent.id,
    type: MindLogType.Result,
    data: `Final result: ${response.message}`,
    quality: 0.5,
  })

  // Return the message
  return message
}
