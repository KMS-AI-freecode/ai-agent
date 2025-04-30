import crypto from 'crypto'

// TODO Remove

import { DB_CONFIG } from '../../../../db/migrations'
import { ApolloContext } from '../../../context'
import { MindLog, MindLogInput, MindLogType } from '../interfaces'
import { getMindLogTable } from './helpers/getMindLogTable'

export * from './deleteMindLogs'

/**
 * Получение записи MindLog по ID
 */
export async function getMindLogById(
  _parent: unknown,
  { id }: { id: string },
  ctx: ApolloContext,
): Promise<MindLog | null> {
  const table = await getMindLogTable(ctx)
  const results = await table.query().where(`id = "${id}"`).limit(1).toArray()

  return results.length > 0 ? (results[0] as MindLog) : null
}

/**
 * Получение всех записей MindLog
 */
export async function getAllMindLogs(
  _parent: unknown,
  _args: Record<string, never>,
  ctx: ApolloContext,
): Promise<MindLog[]> {
  const table = await getMindLogTable(ctx)
  // В LanceDB не поддерживается select('*'), просто вызываем query() без параметров
  const results = await table.query().toArray()

  return results as MindLog[]
}

/**
 * Поиск записей по типу
 */
export async function findLogsByType(
  _parent: unknown,
  { type, limit = 10 }: { type: MindLogType; limit?: number },
  ctx: ApolloContext,
): Promise<MindLog[]> {
  const table = await getMindLogTable(ctx)
  const results = await table
    .query()
    .where(`type = "${type}"`)
    .limit(limit)
    .toArray()

  return results as MindLog[]
}

/**
 * Поиск похожих записей по вектору
 */
export async function findSimilarLogs(
  _parent: unknown,
  { vector, limit = 5 }: { vector: number[]; limit?: number },
  ctx: ApolloContext,
): Promise<MindLog[]> {
  const table = await getMindLogTable(ctx)

  // Векторный поиск с ограничением по количеству результатов
  const results = await table.search(vector).limit(limit).toArray()

  return results as MindLog[]
}

/**
 * Создание новой записи MindLog
 */
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

/**
 * Обновление векторного представления записи
 */
export async function updateVector(
  _parent: unknown,
  { id, vector }: { id: string; vector: number[] },
  ctx: ApolloContext,
): Promise<MindLog | null> {
  const table = await getMindLogTable(ctx)

  // Находим запись по ID
  const existingRecords = await table.query().where(`id = "${id}"`).toArray()

  if (existingRecords.length === 0) {
    return null
  }

  const existingRecord = existingRecords[0] as MindLog

  // Создаем обновленную запись
  const updatedRecord = {
    ...existingRecord,
    vector,
  } as MindLog

  // Обновляем запись (добавляем новую версию и удаляем старую не поддерживается напрямую в LanceDB)
  // В текущей реализации просто добавляем новую запись с тем же ID
  await table.add([updatedRecord])

  return updatedRecord
}
