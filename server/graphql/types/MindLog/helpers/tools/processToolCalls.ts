/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { handleToolCall } from './handleToolCall'
import { ApolloContext } from '../../../../context'

/**
 * Асинхронная обработка вызовов инструментов OpenAI
 */
export async function processToolCalls(
  context: ApolloContext,
  agentId: string,
  toolCalls: ToolCall[],
  messages: ChatCompletionMessageParam[],
): Promise<{
  updatedMessages: ChatCompletionMessageParam[]
  isFinished: boolean
  finalResult?: string
}> {
  let isFinished = false
  let finalResult: string | undefined = undefined
  const updatedMessages = [...messages]

  console.log('toolCalls', toolCalls)

  for (const toolCall of toolCalls) {
    const {
      result,
      finished,
      finalResult: toolResult,
    } = await handleToolCall(context, agentId, toolCall, messages)

    // Добавляем результат вызова инструмента в историю сообщений
    updatedMessages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: JSON.stringify(result),
    })

    // Если это завершение обработки, сохраняем результат
    if (finished) {
      isFinished = true
      finalResult = toolResult
    }
  }

  return { updatedMessages, isFinished, finalResult }
}
