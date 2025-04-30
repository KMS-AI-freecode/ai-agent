import {
  ChatCompletionMessage,
  ChatCompletionMessageParam,
} from 'openai/resources/chat'
import { processToolCalls } from './tools/processToolCalls'
import { createMindLogEntry } from './createMindLog'
import { MindLogType } from '../interfaces'
import { ApolloContext } from '../../../context'

/**
 * Асинхронный обработчик ответов от OpenAI
 */
export async function processOpenAIResponse(
  context: ApolloContext,
  agentId: string,
  responseMessage: ChatCompletionMessage,
  messages: ChatCompletionMessageParam[],
): Promise<{
  updatedMessages: ChatCompletionMessageParam[]
  isFinished: boolean
  finalResult?: string
}> {
  let isFinished = false
  let finalResult: string | undefined = undefined
  let updatedMessages = [...messages]

  // Если есть ответное сообщение, добавляем его в историю
  if (responseMessage) {
    updatedMessages.push(responseMessage as ChatCompletionMessageParam)

    // Обрабатываем вызовы инструментов, если есть
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      const result = await processToolCalls(
        context,
        agentId,
        responseMessage.tool_calls,
        updatedMessages,
      )

      updatedMessages = result.updatedMessages
      isFinished = result.isFinished
      finalResult = result.finalResult
    }
    // Если модель вернула обычный ответ без вызова инструментов
    else if (responseMessage.content) {
      const content =
        typeof responseMessage.content === 'string'
          ? responseMessage.content
          : JSON.stringify(responseMessage.content)

      await createMindLogEntry(
        context,
        agentId,
        MindLogType.Result,
        content,
        0.8,
      )
      finalResult = content
      isFinished = true
    }
  }

  return { updatedMessages, isFinished, finalResult }
}
