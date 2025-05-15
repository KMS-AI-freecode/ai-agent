// type LowDbMessage = {
//   createdAt: number
//   data: string
// }

import { Skill } from '../nexus/context/skills'
import { NexusGenEnums } from '../nexus/generated/nexus'

// type LowDbMessage = {
//   createdAt: number
//   data: string
// }

// type LowDbMindlog = {
//   createdAt: number
//   data: string
// }

export type LowDbAgentData = {
  endpoint: string
  model: string
}

export type LowDbMessage = {
  id: string
  createdAt: Date
  updatedAt?: Date
  text: string
  userId: string
}

/**
 * Знание.
 * Это может быть как статическое знание (например, какая-то справочная дата),
 * или знание какой скилл применить надо (какую функцию)
 */
export type LowDbKnowledge = {
  id: string
  createdAt: Date
  updatedAt?: Date
  /**
   * Описание знания
   */
  description: string

  /**
   * Непосредственно знание
   */
  data?: string
  /**
   * ID скила, если для выполнения требуется применить какой-то скилл
   */
  skillId?: string

  /**
   * Качество знания от 0.0 до 1.0
   */
  quality: number
}

/**
 * Опыт. То есть количество применения какого-то знания.
 */
export type LowDbExperience = {
  id: string
  createdAt: Date
  updatedAt?: Date
  knowledgeId: string | undefined
  skillId: string | undefined
  error?: string
  quality: number
}

export type LowDbUser = {
  id: string
  createdAt: Date
  updatedAt?: Date
  type: NexusGenEnums['UserTypeEnum']
  name?: string
  data?: Record<string, unknown>
  Messages: LowDbMessage[]
  MindLogs: LowDbMindlog[]
  Skills: Skill[] & {
    toJSON: () => string
  }
  Knowledges: LowDbKnowledge[]
  Experiences: LowDbExperience[]
}

export type LowDbMindlog = {
  id: string
  createdAt: Date
  updatedAt?: Date
  data: string
  type: NexusGenEnums['MindLogTypeEnum']

  // TODO Надо дописать логику, чтобы эти данные поступали
  messageId: string | undefined
}

export type LowDbAgent = {
  id: string
  createdAt: Date
  updatedAt?: Date
  userId: LowDbUser['id']
}

export type LowDbToken = {
  token: string
  createdAt: Date
  userId: string
}

export type LowDbData = {
  agent: LowDbAgent | null
  users: LowDbUser[]
  tokens: LowDbToken[]

  /**
   * Пока майндлоги оставим здесь, общие.
   * Но в будущем логи должны быть только у первоисточников и только они и могут
   * говорить что у них было в головах
   */
  // mindLogs: LowDbMindlog[]
}
