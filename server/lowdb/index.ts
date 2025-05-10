import { JSONFilePreset } from 'lowdb/node'
import { LowDbAgent, LowDbData, LowDbUser } from './interfaces'
import { mkdir, access } from 'fs/promises'
import { generateId } from '../utils/id'

// type DbData = {
//   posts: {
//     id: number
//     title: string
//   }[]
// }

export async function createLowDb() {
  const dataPath = 'data/lowdb'

  // const AI_AGENT_ID = process.env.AI_AGENT_ID
  const AI_AGENT_NAME = process.env.AI_AGENT_NAME

  // if (!AI_AGENT_ID) {
  //   throw new Error('AI_AGENT_ID env empty')
  // }

  if (!AI_AGENT_NAME) {
    throw new Error('AI_AGENT_NAME env empty')
  }

  // Проверка и создание директории, если она не существует
  try {
    await access(dataPath)
  } catch (error) {
    // Директория не существует, создаём её
    await mkdir(dataPath, { recursive: true })
  }

  // Инициализация базы данных с начальными данными
  const db = await JSONFilePreset<LowDbData>(`${dataPath}/db.json`, {
    agent: null,
    users: [],
    tokens: [],
    // mindLogs: [],
  })

  if (!db.data.agent) {
    const agentUser: LowDbUser = {
      id: generateId(),
      createdAt: new Date(),
      name: AI_AGENT_NAME,
      type: 'Agent',
      Messages: [],
      MindLogs: [],
    }

    const agent: LowDbAgent = {
      id: generateId(),
      createdAt: new Date(),
      userId: agentUser.id,
    }

    db.data.agent = agent

    db.data.users.push(agentUser)
  }

  // Сохранение изменений в файл
  await db.write()

  return db
}
