/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ApolloContext } from '../../../context'
import { mindLogTools } from './tools/mindLogTools'
import { createMindLogEntry } from './createMindLog'
import { processToolCalls } from './tools/processToolCalls'
import { MindLogType } from '../interfaces'

/**
 * Интерфейс для результата запроса к OpenAI
 */
export interface OpenAIRequestResponse {
  message: string
  final: boolean
  quality: number
  history?: ChatCompletionMessageParam[] // Добавляем историю для отладки
}

/**
 * Отправляет запрос к OpenAI и обрабатывает ответ
 * @param context Контекст Prisma
 * @param agentId ID агента
 * @param message Сообщение для обработки
 * @param systemPrompt Системный промпт для модели
 * @param messages Опциональная история сообщений (если не предоставлена, будет создана новая)
 * @param recursionLevel Уровень рекурсии для предотвращения бесконечных циклов
 */
export async function sendOpenAiRequest(
  context: ApolloContext,
  agentId: string,
  message: string,
  systemPrompt: string,
  existingMessages?: ChatCompletionMessageParam[],
  recursionLevel: number = 0,
): Promise<OpenAIRequestResponse> {
  // Ограничение глубины рекурсии для безопасности
  const MAX_RECURSION = process.env.PROCESS_SMIMULUS_MAX_RECURSION
    ? parseInt(process.env.PROCESS_SMIMULUS_MAX_RECURSION)
    : 30
  if (recursionLevel > MAX_RECURSION) {
    await createMindLogEntry(
      context,
      agentId,
      MindLogType.Progress,
      `## Внимание
        
Превышена максимальная глубина рекурсии (${MAX_RECURSION}), принудительное завершение`,
      0.1,
    )
    return {
      message: `Превышена максимальная глубина рекурсии (${MAX_RECURSION})`,
      final: true,
      quality: 0.3,
    }
  }

  // Создаем или используем существующие сообщения
  const messages: ChatCompletionMessageParam[] = existingMessages || [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: message },
  ]

  try {
    // Отправляем запрос к OpenAI
    const completion = await context.openai.chat.completions.create({
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4.1-mini',
      messages,
      tools: mindLogTools,
      tool_choice: 'required',
      temperature: 0.7,
    })

    console.log(
      `[Recursion level ${recursionLevel}] OpenAI response received`,
      completion.choices[0]?.message,
    )

    const responseMessage = completion.choices[0].message

    // Обрабатываем инструменты, если они есть
    if (responseMessage.tool_calls && responseMessage.tool_calls.length > 0) {
      // Логируем вызов инструментов
      await createMindLogEntry(
        context,
        agentId,
        MindLogType.Progress,
        `### Вызов инструментов
        
Модель вызвала **${responseMessage.tool_calls.length}** инструмент(ов):

${responseMessage.tool_calls
  .map((t, index) => `${index + 1}. \`${t.function.name}\``)
  .join('\n')}`,
        0.6,
      )

      // Добавляем сообщение от модели в историю сообщений
      const updatedMessages = [
        ...messages,
        responseMessage as ChatCompletionMessageParam,
      ]

      try {
        // Обрабатываем инструменты с ожиданием результата
        const toolCallsResult = await processToolCalls(
          context,
          agentId,
          responseMessage.tool_calls,
          updatedMessages,
        )

        console.log(
          `[Recursion level ${recursionLevel}] Tool calls processing complete:`,
          toolCallsResult,
        )

        // Если обработка инструментов завершена и есть финальный результат
        if (toolCallsResult.isFinished && toolCallsResult.finalResult) {
          // Создаем суммирующий лог, если это корневой уровень рекурсии
          // if (recursionLevel === 0) {
          //   // Запускаем асинхронно, чтобы не блокировать основной поток
          //   createSummaryLog(context, agentId, message, toolCallsResult.updatedMessages)
          //     .catch(err => console.error('Error in summary creation:', err))
          // }

          return {
            message: toolCallsResult.finalResult,
            final: true,
            quality: 0.8,
            history: toolCallsResult.updatedMessages,
          }
        }

        // Продолжаем цикл рекурсивно, передавая обновленные сообщения
        console.log(
          `[Recursion level ${recursionLevel}] Continue recursion with updated messages...`,
        )
        return await sendOpenAiRequest(
          context,
          agentId,
          message, // Исходное сообщение остаётся тем же
          systemPrompt, // Системный промпт тоже не меняется
          toolCallsResult.updatedMessages, // Передаём обновлённую историю
          recursionLevel + 1, // Увеличиваем уровень рекурсии
        )
      } catch (toolError) {
        console.error(
          `[Recursion level ${recursionLevel}] Error processing tool calls:`,
          toolError,
        )
        const errorMessage =
          toolError instanceof Error ? toolError.message : String(toolError)

        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `### Ошибка обработки инструментов
          
\`\`\`
${errorMessage}
\`\`\``,
          0.2,
        )

        return {
          message: `Произошла ошибка при обработке инструментов: ${errorMessage}`,
          final: true,
          quality: 0.3,
          history: messages,
        }
      }
    }

    // Если обычный ответ без инструментов
    const content = responseMessage.content || ''

    // Логируем результат
    await createMindLogEntry(
      context,
      agentId,
      MindLogType.Result,
      `### Результат
      
${content}`,
      0.8,
    )

    // // Создаем суммирующий лог, если это корневой уровень рекурсии
    // if (recursionLevel === 0) {
    //   // Запускаем асинхронно, чтобы не блокировать основной поток
    //   createSummaryLog(context, agentId, message, [
    //     ...messages,
    //     responseMessage as ChatCompletionMessageParam
    //   ]).catch(err => console.error('Error in summary creation:', err))
    // }

    return {
      message: content,
      final: true,
      quality: 0.8,
      history: [...messages, responseMessage as ChatCompletionMessageParam],
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)

    // Логируем ошибку
    await createMindLogEntry(
      context,
      agentId,
      MindLogType.Progress,
      `### Ошибка запроса к OpenAI
      
\`\`\`
${errorMessage}
\`\`\``,
      0.1,
    )

    return {
      message: `Произошла ошибка при обработке: ${errorMessage}`,
      final: true,
      quality: 0.1,
      history: messages,
    }
  }
}
