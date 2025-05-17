type MindLogType = NexusGenEnums['MindLogTypeEnum']

import { getUser } from '../../../../lowdb/helpers'
import { LowDbMindlog } from '../../../../lowdb/interfaces'
import { ApolloContext } from '../../../../nexus/context'
import { generateId } from '../../../../utils/id'
import { NexusGenEnums } from '../../../generated/nexus'

type createMindLogEntryProps = {
  ctx: ApolloContext

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
  userId,
  quality,
}: createMindLogEntryProps) {
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

  mindLogUser.MindLogs.push(record)

  return record
}
