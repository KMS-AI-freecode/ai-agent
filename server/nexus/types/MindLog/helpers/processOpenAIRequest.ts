/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { mindLogTools } from './tools/mindLogTools'
import { createMindLogEntry } from './createMindLog'
import { processToolCalls } from './tools/processToolCalls'
import { MindLogType } from '../interfaces'
import { ApolloContext } from '../../../../nexus/context'
import { LowDbAgentData, LowDbUser } from '../../../../lowdb/interfaces'
import { createMessage } from '../../../../lowdb/helpers'

/**
 * Интерфейс для результата запроса к OpenAI
 */
export interface OpenAIRequestResponse {
  message: string
  quality: number
  history?: ChatCompletionMessageParam[] // Добавляем историю для отладки
}

type sendOpenAiRequestProps = {
  context: ApolloContext
  messages: ChatCompletionMessageParam[]

  fromUser: LowDbUser
  toUser: LowDbUser
}

export async function sendOpenAiRequest({
  context,
  fromUser,
  toUser,
  messages,
}: sendOpenAiRequestProps): Promise<string | undefined> {
  const { endpoint, model } = toUser.data ?? {}

  if (!(typeof endpoint === 'string') || !endpoint) {
    throw new Error('endpoint is empty')
  }

  if (!(typeof model === 'string') || !model) {
    throw new Error('model is empty')
  }

  const aiAgentUserData: LowDbAgentData = {
    endpoint,
    model,
  }

  console.log('sendOpenAiRequest messages', messages)

  try {
    // Отправляем запрос к OpenAI
    const completion = await context.openai.chat.completions.create({
      model: aiAgentUserData.model,
      messages,
      tools: mindLogTools,
      /**
       * Требует
       */
      tool_choice: 'auto',
      temperature: 0.7,
      parallel_tool_calls: false,
    })

    console.log(
      `[Recursion OpenAI response received`,
      completion.choices[0]?.message,
    )

    const responseMessage = completion.choices[0].message

    // Обрабатываем инструменты, если они есть
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      /**
       * Перед вызовом тулзов надо добавить ответ ИИхи в историю сообщений
       */
      messages.push(responseMessage)

      // TODO Возможно тут вообзе надо убрать await,
      // так как вероятнее всего выполнение будет последовательное
      await processToolCalls({
        context,
        user: toUser,
        toolCalls: responseMessage.tool_calls,
        messages,
      })

      return sendOpenAiRequest({
        messages,
        context,
        toUser,
        fromUser,
      })
    }

    const content = responseMessage.content || ''

    createMessage({
      text: content,
      fromUser: toUser,
      toUser: fromUser,
    })

    return content
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Логируем ошибку
    await createMindLogEntry({
      ctx: context,
      // agentId,
      userId: toUser.id,
      type: MindLogType.Error,
      data: `### Ошибка запроса к OpenAI
      
\`\`\`
${errorMessage}
\`\`\``,
      quality: 0.1,
    })

    return `Произошла ошибка при обработке: ${errorMessage}`
  }
}
