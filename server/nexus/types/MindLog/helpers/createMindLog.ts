// import { PUBSUB_MINDLOG_ADDED } from '../../Message/interfaces'

type MindLogType = NexusGenEnums['MindLogTypeEnum']

import { getUser } from '../../../../lowdb/helpers'
import { LowDbMindlog } from '../../../../lowdb/interfaces'
import { ApolloContext } from '../../../../nexus/context'
import { generateId } from '../../../../utils/id'
import { NexusGenEnums } from '../../../generated/nexus'
// import { worldManager } from '../../../../world'

type createMindLogEntryProps = {
  ctx: ApolloContext
  // agentId?: string

  /**
   * Айди пользователя, от имени которого создается лог
   */
  userId: string
  type: MindLogType
  data: string
  quality?: number
}

export async function createMindLogEntry({
  ctx: context,
  data,
  type,
  // agentId: _agentId,
  userId,
  quality,
}: createMindLogEntryProps) {
  // const { lowDb } = context

  const mindLogUser = getUser(userId, context.lowDb)

  quality

  const id = generateId()
  const createdAt = new Date()

  const record: LowDbMindlog = {
    id,
    createdAt,
    data,
    type,
    messageId: undefined,
  }

  // Добавляем майндлог в мир, если есть соединение в контексте
  // if (_context.connection?.id) {
  // worldManager.addMindLogToWorld({
  //   mindLogId: id,
  //   data,
  //   type,
  //   // context.connection?.id
  // })
  // }

  mindLogUser.MindLogs.push(record)

  return record
}
