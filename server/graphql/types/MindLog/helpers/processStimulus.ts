/* eslint-disable no-console */
import { GraphQLFieldResolver } from 'graphql'
import { ApolloContext } from '../../../context'
import { MindLog, MindLogType } from '../interfaces'
import { createMindLogEntry } from './createMindLog'
import { sendOpenAiRequest } from './processOpenAIRequest'

/**
 * Основной обработчик раздражителей с использованием OpenAI и инструментов
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

  // if (!agentId) {
  //   throw new Error('agentId is empty')
  // }

  console.log('processStimulus context', context)
  console.log('processStimulus data', data)

  const message = data.content

  await createMindLogEntry(
    context,
    agentId,
    MindLogType.Stimulus,
    `### Новый раздражитель
    
\`\`\`
${message}
\`\`\``,
  )

  // Шаг 2: Логируем реакцию - планируем отправку запроса в OpenAI
  await createMindLogEntry(
    context,
    agentId,
    MindLogType.Reaction,
    `### Планирование обработки
    
Планирую обработать раздражитель:
\`\`\`
${message}
\`\`\``,
    0.7,
  )

  // Шаг 3: Логируем действие - отправка запроса в OpenAI
  await createMindLogEntry(
    context,
    agentId,
    MindLogType.Action,
    `### Отправка запроса в OpenAI
    
Отправляю запрос в OpenAI для анализа раздражителя`,
    0.8,
  )

  let logMindSamples = ''

  // Описания для каждого типа MindLog
  const mindLogDescriptions: Record<MindLogType, string> = {
    Stimulus: 'Входящий раздражитель, запрос или сигнал',
    Reaction: 'Первичная реакция на раздражитель',
    Reasoning: 'Логика рассуждения и анализ информации',
    Intention: 'Намерение совершить действие',
    Action: 'Конкретное действие для решения задачи',
    Progress: 'Промежуточные мысли и прогресс в выполнении',
    Conclusion: 'Заключение на основе анализа',
    Result: 'Окончательный результат',
    Confirmation: 'Подтверждение гипотезы или информации',
    Refutation: 'Опровержение неверной информации',
    Correction: 'Исправление ошибки или неточности',
    Evaluation: 'Оценка качества или полезности информации',
    Suggestion: 'Предложение альтернативного подхода',
    OptimizedMemory: 'Оптимизированное знание или информация',
    ForgottenMemory: 'Информация, которая больше не актуальна',
    ChunkedKnowledge: 'Сгруппированная информация из разных источников',
    ReinforcedAction: 'Усиленное действие после положительного отклика',
    Mentoring: 'Передача знаний от опытного агента',
    Guidance: 'Направление по решению будущих задач',
    ProcessSummary: 'Краткое резюме всего процесса с выделением ключевых точек',
  }

  // Формируем список из всех доступных типов MindLog
  Object.values(MindLogType).forEach((type) => {
    switch (type) {
      case MindLogType.Stimulus:
      case MindLogType.Reaction:
      case MindLogType.Reasoning:
      case MindLogType.Action:
      case MindLogType.Progress:
      case MindLogType.Conclusion:
        // case MindLogType.Intention:
        // case MindLogType.Refutation:
        // case MindLogType.Correction:
        // case MindLogType.Suggestion:
        // case MindLogType.OptimizedMemory:
        // case MindLogType.ForgottenMemory:
        // case MindLogType.ChunkedKnowledge:
        // case MindLogType.ReinforcedAction:
        // case MindLogType.Mentoring:
        // case MindLogType.Guidance:
        // case MindLogType.ProcessSummary:
        logMindSamples += `  - ${type}: ${mindLogDescriptions[type]}\n`
        break
    }
  })

  // Системный промпт для моделей
  const systemPrompt = `Ты помощник искусственного интеллекта, который анализирует входящие сообщения и выполняет необходимые действия.

  Твоя задача:
  1. Понять, что от тебя требуется в сообщении пользователя
  2. Спланировать и выполнить действия, необходимые для ответа
  3. Логировать каждый этап мышления через createMindLogEntry
  4. Завершить процесс с окончательным ответом через finishProcessing

  Доступные инструменты:
  - createMindLogEntry: создает запись в логе мышления с указанным типом и текстом
  - getAvailableModels: получить список доступных моделей
  - askModel: задать вопрос определенной модели
  - finishProcessing: завершить обработку с окончательным результатом

  Примеры типов записей:
  ${logMindSamples}

  Рекомендации по quality (оценка качества мысли от 0 до 1):
  - 0.1-0.3 для ошибок и неудачных попыток
  - 0.4-0.6 для промежуточных мыслей и вопросов
  - 0.7-0.9 для успешных действий и хороших результатов
  
  ВАЖНО: Ты должен осознанно вызвать finishProcessing в конце, иначе обработка будет продолжаться бесконечно!

  Так же перед возвратом конечного результата можно сформировать полезный саммари всей цепочки выполнения и записать в mindLog ProcessSummary
`

  // Вместо прямого запроса к OpenAI используем нашу абстракцию
  const response = await sendOpenAiRequest(
    context,
    agentId,
    message,
    systemPrompt,
  )

  // Возвращаем сообщение
  return response.message
}
