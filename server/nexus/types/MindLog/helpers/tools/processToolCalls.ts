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
  messages: ChatCompletionMessageParam[]

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
  messages,
  toolCalls,
}: processToolCallsProps) {
  console.log('toolCalls', toolCalls)

  for (const toolCall of toolCalls) {
    await handleToolCall({
      ctx: context,
      user,
      toolCall,
    })
      .then((r) => {
        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: r ?? '',
        })
      })
      .catch((error) => {
        console.error(error)

        let errorMessage = 'Неизвестная ошибка'

        if (error instanceof Error) {
          if (error.stack) {
            errorMessage = errorMessage + `\n\n## Stack ${error.stack}`
          }
        }

        messages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: `Во время выполнения возникла ошибка: ${errorMessage}`,
        })
      })
  }
}
