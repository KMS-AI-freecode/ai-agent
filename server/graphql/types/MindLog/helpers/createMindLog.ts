// import { PUBSUB_MINDLOG_ADDED } from '../../Message/interfaces'

import { DB_CONFIG } from '../../../../db/migrations'
import { ApolloContext } from '../../../context'
import { MindLog, MindLogInput, MindLogType } from '../interfaces'
import { getMindLogTable } from '../resolvers/helpers/getMindLogTable'

/**
 * Функция для создания записи в MindLog
 */
// export async function createMindLogEntry(
//   context: ApolloContext,
//   agentId: string,
//   type: MindLogType,
//   data: string,
//   quality?: number
// ) {
//   const entry = await context.prisma.mindLog.create({
//     data: {
//       type,
//       data,
//       quality,
//       Agent: {
//         connect: {
//           id: agentId,
//         },
//       },
//     },
//   })

//   // Публикуем событие для подписчиков
//   // if (context.pubsub) {
//   //   context.pubsub.publish(PUBSUB_MINDLOG_ADDED, {
//   //     mindLogCreated: entry,
//   //   })
//   // }

//   return entry
// }

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
  quality

  return await createMindLog(
    undefined,
    {
      input: {
        content: data,
        type,
      },
    },
    context,
  )
}

export async function createMindLog(
  _parent: unknown,
  { input }: { input: MindLogInput },
  ctx: ApolloContext,
): Promise<MindLog> {
  const table = await getMindLogTable(ctx)

  const id = crypto.randomUUID()
  const createdAt = new Date().toISOString()

  // Создаем временный вектор нулей
  const tempVector = Array(DB_CONFIG.VECTOR_DIMENSION).fill(0)

  const record = {
    ...input,
    id,
    vector: tempVector,
    createdAt,
  } as MindLog

  // Добавляем запись в таблицу
  await table.add([record])

  return record
}
