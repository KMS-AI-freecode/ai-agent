import { ApolloContext } from '../../../context'
import { getMindLogTable } from './helpers/getMindLogTable'

/**
 * Удаляет все записи MindLog из таблицы
 */
export async function deleteMindLogs(
  _parent: unknown,
  _args: unknown,
  ctx: ApolloContext,
): Promise<boolean> {
  const table = await getMindLogTable(ctx)
  // LanceDB не поддерживает массовое удаление, поэтому делаем через перебор
  const all = await table.query().toArray()
  if (all.length > 0) {
    const ids = all.map((item: { id: string }) => item.id)

    // for (const id of ids) {
    //   await table.delete(`id = '${id}'`)
    // }
    const predicate = `id IN (${ids.map((id) => `'${id}'`).join(', ')})`
    await table.delete(predicate)
  }
  return true
}
