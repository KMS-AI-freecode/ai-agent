/* eslint-disable no-console */
import { describe, beforeEach, test, expect } from 'vitest'
import { createTestContext, getAgent } from '../utils/testContext'
import { ApolloContext } from '../../server/nexus/context'
import { LowDbUser } from '../../server/lowdb/interfaces'
import { generateId } from '../../server/utils/id'
import { prepareSkillsSerializer } from '../../server/nexus/context/skills'
import { sendMessage } from '../../server/nexus/types/Message/resolvers/helpers/sendMessage'

/**
 * Этот тест проверяет, способен ли ИИ самостоятельно принимать решение об использовании
 * инструмента, когда он получает запрос, требующий информации,
 * потенциально хранящейся в базе знаний.
 */
describe('AI Agent proactive tool usage', () => {
  let context: ApolloContext
  let currentUser: LowDbUser | undefined = undefined
  let agent: LowDbUser
  let aiAgentUser: LowDbUser

  // Переменные для тестовых данных
  const supportPhone = '+7 (495) 888-77-66'
  const supportEmail = 'help@test-company.com'
  const discountPercentage = '15%'
  const discountThreshold = '3000 рублей'

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

    // Создаем несколько знаний в базе с уникальными данными для проверки

    agent.Knowledges.push(
      {
        id: generateId(),
        createdAt: new Date(),
        description: 'Контакты службы поддержки',
        data: `Телефон службы поддержки: ${supportPhone}, Email: ${supportEmail}`,
        quality: 0.9,
      },
      {
        id: generateId(),
        createdAt: new Date(),
        description: 'Время доставки',
        data: 'Стандартная доставка занимает 2-3 рабочих дня',
        quality: 0.8,
      },
      {
        id: generateId(),
        createdAt: new Date(),
        description: 'Информация о скидках',
        data: `В нашем магазине действует скидка ${discountPercentage} при заказе от ${discountThreshold}`,
        quality: 0.85,
      },
    )

    await context.lowDb.write()
  })

  test('AI должен проактивно использовать инструмент при запросе информации о контактах', async () => {
    expect(currentUser).not.toBeUndefined()

    if (currentUser) {
      // Отправляем сообщение к агенту с конкретным запросом информации о контактах
      const response = await sendMessage({
        ctx: context,
        args: {
          text: 'Как мне связаться со службой поддержки? Мне нужен их телефон и email.',
          fromUser: currentUser,
          toUser: agent,
        },
      })

      // Проверяем, что получен ответ
      expect(response).not.toBeNull()
      if (response) {
        console.log('Ответ на запрос о контактах:', response.text)
        expect(response.text).toBeTruthy()

        // Проверяем, что в ответе содержится телефон из базы знаний
        expect(response.text).toContain(supportPhone)
        // Проверяем, что в ответе содержится email из базы знаний
        expect(response.text).toContain(supportEmail)
      }
    }
  })

  test('AI должен найти информацию о скидках по запросу', async () => {
    expect(currentUser).not.toBeUndefined()

    if (currentUser) {
      // Отправляем сообщение с конкретным запросом информации о скидках
      const response = await sendMessage({
        ctx: context,
        args: {
          text: 'Какие у вас есть скидки? Мне нужна точная информация о проценте скидки и пороге.',
          fromUser: currentUser,
          toUser: agent,
        },
      })

      // Проверяем, что получен ответ
      expect(response).not.toBeNull()
      if (response) {
        console.log('Ответ на запрос о скидках:', response.text)
        expect(response.text).toBeTruthy()

        // Проверяем, что в ответе содержится информация о проценте скидки
        expect(response.text).toContain(discountPercentage)
        // Проверяем, что в ответе содержится информация о пороге скидки
        expect(response.text).toContain(discountThreshold)
      }
    }
  })
})
