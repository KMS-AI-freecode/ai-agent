/* eslint-disable no-console */
import { describe, beforeEach, test, expect } from 'vitest'
import { createTestContext, getAgent } from '../utils/testContext'
import { ApolloContext } from '../../server/nexus/context'
import {
  LowDbKnowledge,
  // LowDbMessage,
  LowDbUser,
} from '../../server/lowdb/interfaces'
import { generateId } from '../../server/utils/id'
import { prepareSkillsSerializer } from '../../server/nexus/context/skills'
import { sendMessage } from '../../server/nexus/types/Message/resolvers/helpers/sendMessage'

describe('AI Agent using getKnowledges tool', () => {
  let context: ApolloContext
  let currentUser: LowDbUser | undefined = undefined
  let agent: LowDbUser
  let aiAgentUser: LowDbUser

  beforeEach(async () => {
    // Создаем тестовый контекст перед каждым тестом
    const { context: apolloContext, defaultUser } = await createTestContext()

    context = apolloContext

    currentUser = defaultUser

    agent = getAgent(context)

    // Создаем тестового ИИ-агента, который будет выполнять запросы
    aiAgentUser = {
      id: generateId(),
      createdAt: new Date(),
      name: 'Test AI Agent',
      type: 'Agent',
      Messages: [],
      MindLogs: [],
      Skills: prepareSkillsSerializer([]),
      Knowledges: [],
      Experiences: [],
      data: {
        model: 'gpt-4.1-mini',
        endpoint: 'https://api.openai.com/v1',
      },
    }
    context.lowDb.data.users.push(aiAgentUser)

    // Создаем тестовые знания в базе
    const knowledge1: LowDbKnowledge = {
      id: generateId(),
      createdAt: new Date(),
      description: 'Тестовое знание 1',
      data: 'Данные тестового знания 1',
      quality: 0.8,
    }

    const knowledge2: LowDbKnowledge = {
      id: generateId(),
      createdAt: new Date(),
      description: 'Тестовое знание 2',
      data: 'Данные тестового знания 2',
      quality: 0.9,
    }

    agent.Knowledges.push(knowledge1, knowledge2)
    await context.lowDb.write()
  })

  test('AI должен получать знания при запросе информации', async () => {
    console.log('agent', agent)
    console.log('aiAgentUser', aiAgentUser)

    expect(currentUser).not.toBeUndefined()

    if (currentUser) {
      // Отправляем сообщение напрямую к агенту
      const response = await sendMessage({
        ctx: context,
        args: {
          text: 'Какие знания у тебя есть в системе?',
          fromUser: currentUser,
          toUser: agent,
        },
      })

      console.log('test 1 response', response)

      console.log(
        'context.lowDb.data',
        JSON.stringify(context.lowDb.data, null, 2),
      )

      // Проверяем, что получен ответ
      expect(response).not.toBeNull()
      if (response) {
        // В реальной ситуации ИИ должен получить знания и упомянуть их в ответе
        console.log('Ответ ИИ:', response.text)
        expect(response.text).toBeTruthy()
      }
    }
  })

  // test('AI должен найти информацию в базе знаний', async () => {
  //   // Добавляем знание с информацией о пользователе
  //   const knowledge: LowDbKnowledge = {
  //     id: generateId(),
  //     createdAt: new Date(),
  //     description: 'Информация о пользователе ID123',
  //     data: 'Пользователь ID123 зарегистрирован 15 мая 2025 года',
  //     quality: 0.9,
  //   }

  //   agent.Knowledges.push(knowledge)
  //   await context.lowDb.write()

  //   // Отправляем сообщение с запросом информации
  //   const response = await sendMessage({
  //     ctx: context,
  //     args: {
  //       text: 'Когда зарегистрирован пользователь ID123?',
  //       fromUser: aiAgentUser,
  //       toUser: aiAgentUser,
  //     },
  //   })

  //   // Проверяем, что получен ответ
  //   expect(response).not.toBeNull()
  //   if (response) {
  //     console.log('Ответ на запрос о пользователе:', response.text)
  //     expect(response.text).toBeTruthy()
  //     // В идеале ИИ найдет информацию и упомянет дату, но это зависит от реальной реализации
  //   }
  // })

  // test('AI should correctly use getKnowledges tool when prompted', async () => {
  //   // Устанавливаем, что должен вернуть мок OpenAI
  //   openaiMock.chat.completions.create.mockResolvedValueOnce({
  //     id: 'test-completion-id',
  //     choices: [
  //       {
  //         index: 0,
  //         message: {
  //           role: 'assistant',
  //           tool_calls: [
  //             {
  //               id: 'call-test-id',
  //               type: 'function',
  //               function: {
  //                 name: 'getKnowledges',
  //                 arguments: '{}',
  //               },
  //             },
  //           ],
  //         },
  //         finish_reason: 'tool_calls',
  //       },
  //     ],
  //   })

  //   // Запускаем запрос к OpenAI
  //   const response = await sendOpenAiRequest({
  //     context,
  //     fromUser: aiAgentUser, // пользователь, от которого идет запрос
  //     toUser: aiAgentUser, // пользователь-агент, который обрабатывает запрос
  //     messages: [
  //       { role: 'user', content: 'Какие знания у тебя есть в системе?' },
  //     ],
  //   })

  //   // Проверяем, что OpenAI был вызван
  //   expect(openaiMock.chat.completions.create).toHaveBeenCalled()

  //   // Проверяем, что в ответе есть вызов инструмента getKnowledges
  //   const toolCalls = response.toolCalls
  //   expect(toolCalls).toBeDefined()
  //   expect(toolCalls?.length).toBeGreaterThan(0)

  //   // Имитируем обработку вызова инструмента
  //   if (toolCalls && toolCalls.length > 0) {
  //     const toolCall = toolCalls[0] as ToolCall
  //     const result = await handleToolCall({
  //       ctx: context,
  //       user: aiAgentUser,
  //       toolCall,
  //     })

  //     // Проверяем, что результат содержит информацию о знаниях
  //     expect(result).toContain('Найдено')
  //     expect(result).toContain('знаний')

  //     // В результате должны быть оба тестовых знания
  //     expect(result).toContain('Тестовое знание 1')
  //     expect(result).toContain('Тестовое знание 2')
  //   }
  // })

  // test('AI should use getKnowledges when searching for information in knowledge base', async () => {
  //   // Добавляем знание с информацией, которую ИИ должен найти
  //   const knowledge: LowDbKnowledge = {
  //     id: generateId(),
  //     createdAt: new Date(),
  //     description: 'Важная информация о пользователе',
  //     data: 'Пользователь ID123 зарегистрирован 15 мая 2025 года',
  //     quality: 0.9,
  //   }
  //   agent.Knowledges.push(knowledge)
  //   await context.lowDb.write()

  //   // Устанавливаем, что должен вернуть мок OpenAI при первом вызове
  //   openaiMock.chat.completions.create.mockResolvedValueOnce({
  //     id: 'test-completion-id-1',
  //     choices: [
  //       {
  //         index: 0,
  //         message: {
  //           role: 'assistant',
  //           tool_calls: [
  //             {
  //               id: 'call-test-id-1',
  //               type: 'function',
  //               function: {
  //                 name: 'getKnowledges',
  //                 arguments: '{}',
  //               },
  //             },
  //           ],
  //         },
  //         finish_reason: 'tool_calls',
  //       },
  //     ],
  //   })

  //   // Устанавливаем, что должен вернуть мок OpenAI при втором вызове
  //   openaiMock.chat.completions.create.mockResolvedValueOnce({
  //     id: 'test-completion-id-2',
  //     choices: [
  //       {
  //         index: 0,
  //         message: {
  //           role: 'assistant',
  //           content:
  //             'Согласно нашей базе знаний, пользователь ID123 зарегистрирован 15 мая 2025 года.',
  //         },
  //         finish_reason: 'stop',
  //       },
  //     ],
  //   })

  //   // Запускаем запрос к OpenAI
  //   const initialResponse = await sendOpenAiRequest({
  //     context,
  //     fromUser: aiAgentUser,
  //     toUser: aiAgentUser,
  //     messages: [
  //       { role: 'user', content: 'Когда зарегистрирован пользователь ID123?' },
  //     ],
  //   })

  //   // Проверяем, что в ответе есть вызов инструмента getKnowledges
  //   const toolCalls = initialResponse.toolCalls
  //   expect(toolCalls).toBeDefined()
  //   expect(toolCalls?.length).toBeGreaterThan(0)

  //   // Имитируем обработку вызова инструмента
  //   if (toolCalls && toolCalls.length > 0) {
  //     const toolCall = toolCalls[0] as ToolCall
  //     const toolResult = await handleToolCall({
  //       ctx: context,
  //       user: aiAgentUser,
  //       toolCall,
  //     })

  //     // Подготавливаем сообщения для второго вызова OpenAI
  //     const updatedMessages = [
  //       { role: 'user', content: 'Когда зарегистрирован пользователь ID123?' },
  //       { role: 'assistant', tool_calls: [toolCall] },
  //       { role: 'tool', tool_call_id: toolCall.id, content: toolResult },
  //     ] as any

  //     // Запускаем второй запрос к OpenAI с результатами инструмента
  //     const finalResponse = await sendOpenAiRequest({
  //       context,
  //       fromUser: aiAgentUser,
  //       toUser: aiAgentUser,
  //       messages: updatedMessages,
  //     })

  //     // Проверяем, что финальный ответ содержит нужную информацию
  //     expect(finalResponse.message).toBeDefined()
  //     expect(finalResponse.message).toContain('15 мая 2025')
  //   }
  // })
})
