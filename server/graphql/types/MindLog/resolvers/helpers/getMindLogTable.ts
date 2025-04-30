import { DB_CONFIG } from '../../../../../db/migrations'
import { ApolloContext } from '../../../../context'

/**
 * Получение таблицы mindlog
 */
export async function getMindLogTable(ctx: ApolloContext) {
  try {
    return await ctx.lanceDb.openTable(DB_CONFIG.TABLES.MINDLOG)
  } catch (error) {
    console.error('Failed to get mindlog table:', error)
    throw error
  }
}
