/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { handleToolCall } from './handleToolCall'
import { ApolloContext } from '../../../../../nexus/context'
import { LowDbUser } from '../../../../../lowdb/interfaces'

/**
 * Асинхронная обработка вызовов инструментов OpenAI
 */

type processToolCallsProps = {
  context: ApolloContext
  // agentId: string
  toolCalls: ToolCall[]
  // messages: ChatCompletionMessageParam[]

  /**
   * Объект пользователя, от имени которого вызывается тулза.
   * По сути это будет пользователь внешнего ИИ-агента
   */
  user: LowDbUser
}

export async function processToolCalls({
  // agentId,
  user,
  context,
  // messages,
  toolCalls,
}: processToolCallsProps): Promise<{
  messages: ChatCompletionMessageParam[]
  // isFinished: boolean
  // finalResult?: string
}> {
  // let isFinished = false
  // let finalResult: string | undefined = undefined
  // const updatedMessages = [...messages]

  const messages: ChatCompletionMessageParam[] = []

  console.log('toolCalls', toolCalls)

  for (const toolCall of toolCalls) {
    const {
      result,
      // finished,
      // finalResult: toolResult,
    } = await handleToolCall({
      ctx: context,
      user,
      toolCall,
      // messages
    })

    // Добавляем результат вызова инструмента в историю сообщений
    // updatedMessages.push({
    //   role: 'tool',
    //   tool_call_id: toolCall.id,
    //   content: result,
    // })

    messages.push({
      role: 'tool',
      tool_call_id: toolCall.id,
      content: result,
    })

    // Если это завершение обработки, сохраняем результат
    // if (finished) {
    //   isFinished = true
    //   finalResult = result
    // }
  }

  return {
    // updatedMessages,
    messages,
    // isFinished,
    // finalResult,
  }
}
