/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { createMindLogEntry } from './createMindLog'
import { MindLogType } from '../interfaces'
import { ApolloContext } from '../../../context'

/**
 * Пока не вызываем эту функцию, она заготовка.
 * Предполагается, что ИИ сама будет записывать саммари
 */

/**
 * Создает суммирующий лог на основе анализа цепочки сообщений
 * @param context Контекст Prisma
 * @param agentId ID агента
 * @param originalMessage Исходное сообщение пользователя
 * @param messageHistory История сообщений
 */
export async function createSummaryLog(
  context: ApolloContext,
  agentId: string,
  originalMessage: string,
  messageHistory: ChatCompletionMessageParam[],
): Promise<void> {
  try {
    console.log(
      `Creating process summary for message: ${originalMessage.substring(
        0,
        50,
      )}...`,
    )

    // Создаем системный промпт для анализа
    const systemPrompt = `Ты аналитический модуль ИИ-агента. Твоя задача - проанализировать цепочку рассуждений и действий, выполненных агентом при обработке запроса пользователя.
    
Проанализируй всю историю сообщений, включая вызовы инструментов и их результаты, и создай структурированное резюме процесса обработки со следующими разделами:

1. **Исходная задача**: краткое описание того, что запросил пользователь
2. **Ключевые этапы обработки**: основные шаги рассуждений и действий агента
3. **Использованные инструменты**: какие инструменты были вызваны и зачем
4. **Сложности и решения**: какие проблемы возникли в процессе и как они были решены
5. **Выводы и оптимизация**: как можно было бы оптимизировать процесс обработки в будущем

Твой анализ должен быть глубоким, но лаконичным. Используй маркдаун для форматирования.`

    // Подготовка сообщений для анализирующей модели
    // Отфильтруем технические сообщения и чисто системные сообщения
    const relevantMessages = messageHistory.filter(
      (msg) =>
        msg.role !== 'system' &&
        (msg.role !== 'tool' || (msg.content && msg.content.length < 500)),
    )

    // Выполняем запрос к аналитической модели
    const analysisCompletion = await context.openai.chat.completions.create({
      model: process.env.OPENAI_DEFAULT_MODEL || 'gpt-4.1-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Проанализируй следующую цепочку обработки запроса: "${originalMessage}"\n\n${JSON.stringify(
            relevantMessages,
            null,
            2,
          )}`,
        },
      ],
      temperature: 0.7,
    })

    const analysisResult =
      analysisCompletion.choices[0]?.message?.content ||
      'Не удалось создать анализ процесса обработки.'

    // Создаем запись с типом ProcessSummary
    await createMindLogEntry(
      context,
      agentId,
      MindLogType.ProcessSummary,
      `## Анализ процесса обработки запроса
      
${analysisResult}`,
      0.9,
    )

    console.log('Process summary created successfully')
  } catch (error) {
    console.error('Error creating process summary:', error)
    // Не даем ошибке прервать основной процесс
    await createMindLogEntry(
      context,
      agentId,
      MindLogType.Progress,
      `### Ошибка при создании аналитического резюме\n\n\`\`\`\n${
        error instanceof Error ? error.message : String(error)
      }\n\`\`\``,
      0.2,
    )
  }
}
