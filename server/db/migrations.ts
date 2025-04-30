/* eslint-disable no-console */
import { Connection } from '@lancedb/lancedb'
import { Field, Schema, Utf8, Float32, FixedSizeList } from 'apache-arrow'

/**
 * Константы для работы с таблицами БД
 */
export const DB_CONFIG = {
  TABLES: {
    MINDLOG: 'mindlog',
  },
  VECTOR_DIMENSION: 1536,
}

/**
 * Инициализация базы данных при старте приложения
 * Создаёт необходимые таблицы, если они не существуют
 */
export async function initDatabase(connection: Connection): Promise<void> {
  try {
    console.log('Initializing database...')

    // Проверяем и инициализируем таблицу mindlog
    await initMindLogTable(connection)

    console.log('Database initialization completed successfully.')
  } catch (error) {
    console.error('Error initializing database:', error)
    throw error
  }
}

/**
 * Инициализация таблицы mindlog
 */
async function initMindLogTable(connection: Connection): Promise<void> {
  const tableName = DB_CONFIG.TABLES.MINDLOG

  try {
    // Проверяем, существует ли таблица
    const tables = await connection.tableNames()

    if (tables.includes(tableName)) {
      console.log(`Table ${tableName} already exists, skipping creation.`)
      return
    }

    console.log(`Creating table ${tableName}...`)

    // Создаем поля для схемы
    const fields = [
      new Field('id', new Utf8()),
      new Field('type', new Utf8()),
      new Field('content', new Utf8()),
      new Field(
        'vector',
        new FixedSizeList(
          DB_CONFIG.VECTOR_DIMENSION,
          new Field('item', new Float32()),
        ),
      ),
      new Field('createdAt', new Utf8()),
    ]

    // Создаем схему используя класс Schema из apache-arrow
    const schema = new Schema(fields)

    // Создаем пустую таблицу с определенной схемой
    await connection.createEmptyTable(tableName, schema, { mode: 'create' })

    console.log(`Table ${tableName} created successfully.`)
  } catch (error) {
    console.error(`Error creating table ${tableName}:`, error)
    throw error
  }
}
