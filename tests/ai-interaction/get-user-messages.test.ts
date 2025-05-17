/* eslint-disable no-console */
import { describe, beforeEach, test, expect } from 'vitest'
import { createTestContext, getAgent } from '../utils/testContext'
import { ApolloContext } from '../../server/nexus/context'
import { LowDbUser } from '../../server/lowdb/interfaces'
import { generateId } from '../../server/utils/id'
import { prepareSkillsSerializer } from '../../server/nexus/context/skills'
import { sendMessage } from '../../server/nexus/types/Message/resolvers/helpers/sendMessage'
import { createMessage } from '../../server/lowdb/helpers'

/**
 * Этот тест проверяет работу тулзы getUserMessages
 */
describe('AI Agent using getUserMessages tool', () => {
  let context: ApolloContext
  let currentUser: LowDbUser | undefined = undefined
  let agent: LowDbUser
  let aiAgentUser: LowDbUser

  // Уникальные тестовые сообщения
  const testMessage1 = 'Тестовое сообщение 1 для проверки тулзы getUserMessages'
  const testMessage2 = 'Тестовое сообщение 2 для проверки тулзы getUserMessages'

  beforeEach(async () => {
    // Создаем тестовый контекст перед каждым тестом
    const { context: apolloContext, defaultUser } = await createTestContext()

    context = apolloContext
    currentUser = defaultUser
    agent = getAgent(context)

    // Создаем тестового ИИ-агента
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

    // Создаем тестовые сообщения для пользователя
    if (currentUser) {
      createMessage({
        text: testMessage1,
        fromUser: currentUser,
        toUser: agent,
      })

      createMessage({
        text: testMessage2,
        fromUser: currentUser,
        toUser: agent,
      })
    }

    await context.lowDb.write()
  })

  test('AI должен получить сообщения пользователя при запросе через getUserMessages', async () => {
    expect(currentUser).not.toBeUndefined()

    if (currentUser) {
      // Отправляем запрос на получение сообщений пользователя
      const response = await sendMessage({
        ctx: context,
        args: {
          text: `Покажи мне сообщения пользователя с ID ${currentUser.id}`,
          fromUser: aiAgentUser,
          toUser: agent,
        },
      })

      // Проверяем, что получен ответ
      expect(response).not.toBeNull()
      if (response) {
        console.log('Ответ ИИ на запрос сообщений:', response.text)
        expect(response.text).toBeTruthy()

        // Проверяем, что в ответе содержатся тестовые сообщения
        expect(response.text).toContain(testMessage1)
        expect(response.text).toContain(testMessage2)
      }
    }
  })
})
