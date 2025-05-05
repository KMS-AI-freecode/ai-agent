// import { PUBSUB_MINDLOG_ADDED } from '../../Message/interfaces'

import { ApolloContext } from '../../../context'
import { MindLog, MindLogType } from '../interfaces'

type createMindLogEntryProps = {
  context: ApolloContext
  agentId?: string
  type: MindLogType
  data: string
  quality?: number
}

export async function createMindLogEntry({
  context: _context,
  data,
  type,
  agentId: _agentId,
  quality,
}: createMindLogEntryProps) {
  quality

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  const record: MindLog = {
    id,
    createdAt,
    data,
    type,
  }

  return record
}
