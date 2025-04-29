import crypto from 'crypto'
import * as lancedb from '@lancedb/lancedb'
import dotenv from 'dotenv'

// Загрузка переменных окружения
dotenv.config()

// Типы для MindLog
export enum MindLogType {
  STIMULUS = 'STIMULUS',
  REACTION = 'REACTION',
  REASONING = 'REASONING',
  ACTION = 'ACTION',
  RESULT = 'RESULT',
}

export interface MindLogInput {
  type: MindLogType
  content: string
  metadata?: Record<string, unknown>
}

export interface MindLog extends MindLogInput {
  id: string
  vector?: number[]
  createdAt: string
}

export class MindLogService {
  private tableName = 'mindlog'
  private vectorDimension = 1536 // Стандартная размерность для OpenAI Ada
  private connection: Awaited<ReturnType<typeof lancedb.connect>>

  constructor(connection: Awaited<ReturnType<typeof lancedb.connect>>) {
    this.connection = connection
  }

  // Получение таблицы MindLog
  private async getTable() {
    let table

    try {
      // Проверяем, существует ли таблица
      const tables = await this.connection.tableNames()
      if (tables.includes(this.tableName)) {
        table = await this.connection.openTable(this.tableName)
      } else {
        // Создаем схему для новой таблицы
        table = await this.connection.createTable(
          this.tableName,
          [], // Пустые начальные данные
          {
            mode: 'create', // создаем только если таблица не существует
          },
        )
      }
      return table
    } catch (error) {
      console.error('Failed to get or create table:', error)
      throw error
    }
  }

  // Создание записи MindLog
  async createMindLog(input: MindLogInput): Promise<MindLog> {
    const table = await this.getTable()

    const id = crypto.randomUUID()
    const createdAt = new Date().toISOString()

    // Создаем временный вектор нулей (позже заменится на реальный эмбеддинг)
    const tempVector = Array(this.vectorDimension).fill(0)

    const record: MindLog & Record<string, unknown> = {
      ...input,
      id,
      vector: tempVector,
      createdAt,
    }

    // Добавляем запись в таблицу
    await table.add([record])

    return record
  }

  // Получение записи MindLog по ID
  async getMindLogById(id: string): Promise<MindLog | null> {
    const table = await this.getTable()

    const results = await table.query().where(`id = "${id}"`).limit(1).toArray()

    return results.length > 0 ? (results[0] as unknown as MindLog) : null
  }

  // Получение всех записей MindLog
  async getAllMindLogs(): Promise<MindLog[]> {
    const table = await this.getTable()

    const results = await table.query().toArray()

    return results as unknown as MindLog[]
  }

  // Поиск похожих записей по вектору
  async findSimilarLogs(vector: number[], limit = 5): Promise<MindLog[]> {
    const table = await this.getTable()

    const results = await table.vectorSearch(vector).limit(limit).toArray()

    return results as unknown as MindLog[]
  }

  // Поиск записей по типу
  async findLogsByType(type: MindLogType, limit = 10): Promise<MindLog[]> {
    const table = await this.getTable()

    const results = await table
      .query()
      .where(`type = "${type}"`)
      .limit(limit)
      .toArray()

    return results as unknown as MindLog[]
  }

  // Обновление векторного представления записи
  async updateVector(id: string, vector: number[]): Promise<void> {
    // Пока нет прямого API для обновления одного поля в LanceDB,
    // поэтому получаем запись, обновляем и записываем обратно
    const record = await this.getMindLogById(id)

    if (!record) {
      throw new Error(`MindLog with id ${id} not found`)
    }

    const updatedRecord: MindLog & Record<string, unknown> = {
      ...record,
      vector,
    }

    const table = await this.getTable()

    try {
      // Добавляем обновленную запись
      // В новой версии LanceDB не требуется явно удалять старую запись
      // при добавлении с тем же id, она будет заменена
      await table.add([updatedRecord])
    } catch (error) {
      console.error('Failed to update vector:', error)
      throw error
    }
  }
}
