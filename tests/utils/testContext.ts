import { Low } from 'lowdb'
import { ApolloContext, createContext } from '../../server/nexus/context'
import { LowDbAgent, LowDbData, LowDbUser } from '../../server/lowdb/interfaces'
import { generateId } from '../../server/utils/id'
import { prepareSkillsSerializer } from '../../server/nexus/context/skills'

// Создаем собственную реализацию MemoryAdapter для тестов
class MemoryAdapter<T> {
  #data: T | null = null

  constructor(initialData?: T) {
    if (initialData) {
      this.#data = initialData
    }
  }

  async read(): Promise<T | null> {
    return this.#data || null
  }

  async write(data: T): Promise<void> {
    this.#data = data
  }
}

/**
 * Создает тестовый контекст с in-memory LowDB
 */
export async function createTestContext(options?: {
  includeDefaultAgent?: boolean
  includeDefaultUser?: boolean
}): Promise<{
  context: ApolloContext
  defaultUser: LowDbUser | undefined
}> {
  let defaultUser: LowDbUser | undefined = undefined

  const { includeDefaultAgent = true, includeDefaultUser = true } =
    options || {}

  // Создаем in-memory адаптер для LowDB
  const adapter = new MemoryAdapter<LowDbData>()

  // Инициализируем БД с начальными данными
  const db = new Low<LowDbData>(adapter, {
    agent: null,
    users: [],
    tokens: [],
  })

  if (includeDefaultAgent) {
    // Создаем дефолтного агента
    const agentUser: LowDbUser = {
      id: generateId(),
      createdAt: new Date(),
      name: 'Test Agent',
      type: 'Agent',
      Messages: [],
      MindLogs: [],
      Skills: prepareSkillsSerializer([]),
      Knowledges: [],
      Experiences: [],
    }

    const agent: LowDbAgent = {
      id: generateId(),
      createdAt: new Date(),
      userId: agentUser.id,
    }

    db.data.agent = agent
    db.data.users.push(agentUser)
  }

  if (includeDefaultUser) {
    // Создаем дефолтного пользователя
    defaultUser = {
      id: generateId(),
      createdAt: new Date(),
      name: 'Test User',
      type: 'Human',
      Messages: [],
      MindLogs: [],
      Skills: prepareSkillsSerializer([]),
      Knowledges: [],
      Experiences: [],
    }

    db.data.users.push(defaultUser)
  }

  // Сохраняем изменения
  await db.write()

  // Создаем контекст с нашей тестовой БД
  const context = await createContext({
    lowDb: db,
    req: undefined,
  })

  return { context, defaultUser }
}

/**
 * Находит пользователя по типу
 */
export function findUserByType(
  context: ApolloContext,
  type: string,
): LowDbUser | undefined {
  return context.lowDb.data.users.find((user) => user.type === type)
}

/**
 * Получает агента из контекста
 */
export function getAgent(context: ApolloContext): LowDbUser {
  return context.Agent
}
