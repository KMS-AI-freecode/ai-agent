import { JSONFilePreset } from 'lowdb/node'
import { LowDbAgent, LowDbData, LowDbUser } from './interfaces'
import { mkdir, access } from 'fs/promises'
import { generateId } from '../utils/id'
import {
  deserializeSkills,
  prepareSkillsSerializer,
  SerializedSkill,
  // serializeSkills,
} from '../nexus/context/skills'

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

  /**
   * Надо десериализовать все данные
   */

  /**
   * Очень грязный хак.
   * Сейчас нет нормального механизма обработки на запись и на чтение базы,
   * поэтому вот так.
   */
  db.data.users.forEach((user) => {
    if (typeof user.Skills === 'string') {
      const serialized: SerializedSkill[] = JSON.parse(user.Skills)
      user.Skills = deserializeSkills(serialized)
    }
  })

  if (!db.data.agent) {
    const agentUser: LowDbUser = {
      id: generateId(),
      createdAt: new Date(),
      name: AI_AGENT_NAME,
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

  db.data.users.forEach((user) => {
    // user.Skills.toJSON = function () {
    //   return JSON.stringify(serializeSkills(this))
    // }

    user.Skills = prepareSkillsSerializer(user.Skills)
  })

  // Сохранение изменений в файл
  await db.write()

  return db
}
