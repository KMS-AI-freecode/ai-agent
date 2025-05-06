// import { PUBSUB_MINDLOG_ADDED } from '../../Message/interfaces'

import { ApolloContext } from '../../../context'
import { MindLog, MindLogType } from '../interfaces'
// import { worldManager } from '../../../../world'

type createMindLogEntryProps = {
  context: ApolloContext
  agentId?: string
  type: MindLogType
  data: string
  quality?: number
}

export async function createMindLogEntry({
  context,
  data,
  type,
  agentId: _agentId,
  quality,
}: createMindLogEntryProps) {
  const { worldManager } = context

  quality

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const record: MindLog = {
    id,
    createdAt,
    data,
    type,
  }

  // Добавляем майндлог в мир, если есть соединение в контексте
  // if (_context.connection?.id) {
  worldManager.addMindLogToWorld({
    mindLogId: id,
    data,
    type,
    // context.connection?.id
  })
  // }

  return record
}
