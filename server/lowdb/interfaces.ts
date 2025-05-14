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
  Skills: Skill[]
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
