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
  // final: boolean
  quality: number
  history?: ChatCompletionMessageParam[] // Добавляем историю для отладки
}

type sendOpenAiRequestProps = {
  context: ApolloContext
  // agentId: string
  // message: string,
  // systemPrompt: string
  // existingMessages?: ChatCompletionMessageParam[],
  // recursionLevel: number
  messages: ChatCompletionMessageParam[]

  fromUser: LowDbUser
  toUser: LowDbUser

  /**
   * Локальная запись пользователя ии-агента
   */
  // aiAgentUser: LowDbUser
}

export async function sendOpenAiRequest({
  context,
  // agentId,
  // message: string,
  // systemPrompt,
  // existingMessages?: ChatCompletionMessageParam[],
  // recursionLevel,
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

  // Ограничение глубины рекурсии для безопасности
  // const MAX_RECURSION = process.env.PROCESS_SMIMULUS_MAX_RECURSION
  //   ? parseInt(process.env.PROCESS_SMIMULUS_MAX_RECURSION)
  //   : 100
  //   if (recursionLevel > MAX_RECURSION) {
  //     await createMindLogEntry({
  //       ctx: context,
  //       // agentId,
  //       userId: aiAgentUser.id,
  //       type: MindLogType.Error,
  //       data: `## Внимание

  // Превышена максимальная глубина рекурсии (${MAX_RECURSION}), принудительное завершение`,
  //       quality: 0.1,
  //     })
  //     return {
  //       message: `Превышена максимальная глубина рекурсии (${MAX_RECURSION})`,
  //       final: true,
  //       quality: 0.3,
  //     }
  //   }

  try {
    // console.log(
    //   `[Recursion level ${recursionLevel}] OpenAI request messages`,
    //   // messages,
    // )

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

      // Логируем вызов инструментов
      //       await createMindLogEntry(
      //         context,
      //         agentId,
      //         MindLogType.Progress,
      //         `### Вызов инструментов

      // Модель вызвала **${responseMessage.tool_calls.length}** инструмент(ов):

      // ${responseMessage.tool_calls
      //   .map((t, index) => `${index + 1}. \`${t.function.name}\``)
      //   .join('\n')}`,
      //         0.6,
      //       )

      // Добавляем сообщение от модели в историю сообщений
      // const updatedMessages = [...messages, responseMessage]

      // Обрабатываем инструменты с ожиданием результата
      // const toolCallsResult = await processToolCalls({

      // TODO Возможно тут вообзе надо убрать await,
      // так как вероятнее всего выполнение будет последовательное
      await processToolCalls({
        context,
        user: toUser,
        toolCalls: responseMessage.tool_calls,
        // messages: updatedMessages,
        messages,
      })

      return sendOpenAiRequest({
        messages,
        context,
        toUser,
        fromUser,
      })

      // console.log(
      //   `[Recursion level ${recursionLevel}] Tool calls processing complete:`,
      //   toolCallsResult,
      // )

      // Если обработка инструментов завершена и есть финальный результат
      // if (
      //   toolCallsResult.isFinished
      //   // && toolCallsResult.finalResult
      // ) {
      //   // Создаем суммирующий лог, если это корневой уровень рекурсии
      //   // if (recursionLevel === 0) {
      //   //   // Запускаем асинхронно, чтобы не блокировать основной поток
      //   //   createSummaryLog(context, agentId, message, toolCallsResult.updatedMessages)
      //   //     .catch(err => console.error('Error in summary creation:', err))
      //   // }

      //   return {
      //     message: toolCallsResult.finalResult || '',
      //     final: true,
      //     quality: 0.8,
      //     history: toolCallsResult.updatedMessages,
      //   }
      // }

      // Продолжаем цикл рекурсивно, передавая обновленные сообщения
      // console.log(
      //   `[Recursion level ${recursionLevel}] Continue recursion with updated messages...`,
      // )

      // return await sendOpenAiRequest(
      //   context,
      //   agentId,
      //   '', // message, // Исходное сообщение остаётся тем же
      //   systemPrompt, // Системный промпт тоже не меняется
      //   toolCallsResult.updatedMessages, // Передаём обновлённую историю
      //   recursionLevel + 1, // Увеличиваем уровень рекурсии
      // )

      /**
       * Вот тут надо это будет убрать.
       * Агент не должен сам просто так слать сообщения.
       * Сейчас это делается, чтобы ИИ мог получить результаты выполнения своих тулзов.
       * Но на самом деле надо дать ему тулзу, которая будет сама инициировать отправку
       * сообщения ему. Тогда ИИ сможет сама решать когда и какие данные для чего ей нужны
       * и надо ли ей опять чего-то отправлять или нет.
       */
      // return await sendOpenAiRequest({
      //   // agentId,
      //   aiAgentUser,
      //   context,
      //   messages: [
      //     ...messages,

      //     /**
      //      * Это сообщение обязательно, чтобы ИИ видел, какие тулзы он отправил на выполнение
      //      */
      //     responseMessage,

      //     ...toolCallsResult.messages,
      //   ],
      //   recursionLevel: recursionLevel + 1, // Увеличиваем уровень рекурсии
      // })
    }

    // Логируем результат
    //     await createMindLogEntry(
    //       context,
    //       agentId,
    //       MindLogType.Result,
    //       `### Результат

    // ${content}`,
    //       0.8,
    //     )

    // // Создаем суммирующий лог, если это корневой уровень рекурсии
    // if (recursionLevel === 0) {
    //   // Запускаем асинхронно, чтобы не блокировать основной поток
    //   createSummaryLog(context, agentId, message, [
    //     ...messages,
    //     responseMessage as ChatCompletionMessageParam
    //   ]).catch(err => console.error('Error in summary creation:', err))
    // }

    // Если обычный ответ без инструментов
    const content = responseMessage.content || ''

    /**
     * Ответ от ИИщки - это ответное сообщение
     */
    // content &&
    //   toUser.Messages.push({
    //     id: generateId(),
    //     createdAt: new Date(),
    //     text: content,
    //     userId: toUser.id,
    //   })

    createMessage({
      text: content,
      fromUser: toUser,
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
