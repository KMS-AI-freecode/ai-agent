/* eslint-disable no-console */
import { GraphQLFieldResolver } from 'graphql'
import { ApolloContext } from '../../../context'
import { MindLog, MindLogType } from '../interfaces'
import { createMindLogEntry } from './createMindLog'
import { sendOpenAiRequest } from './processOpenAIRequest'
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { getSystemPrompt } from './prompts/systemPrompt'

/**
 * Main processor for stimuli using OpenAI and tools
 */
export const processStimulus: GraphQLFieldResolver<
  unknown,
  ApolloContext,
  {
    content: string
  }
> = async (
  _,
  data: { content: MindLog['data'] },
  context: ApolloContext,
): Promise<string> => {
  const agentId = context.aiAgent?.id || ''

  const message = data.content

  await createMindLogEntry({
    context,
    agentId,
    type: MindLogType.Stimulus,
    data: `### New stimulus
    
\`\`\`
${message}
\`\`\``,
  })

  // Generate the complete system prompt
  const systemPrompt = getSystemPrompt()

  // Create or use existing messages
  const messages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ]

  // Instead of a direct request to OpenAI, we use our abstraction
  const response = await sendOpenAiRequest({
    context,
    agentId,
    messages,
    // systemPrompt,
    recursionLevel: 0,
  })

  // Create final entry
  await createMindLogEntry({
    context,
    agentId,
    type: MindLogType.Result,
    data: `Final result: ${response.message}`,
    quality: 0.5,
  })

  // Return the message
  return response.message
}
