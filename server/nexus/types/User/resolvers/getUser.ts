import { FieldResolver } from 'nexus'
import { getUser } from '../../../../lowdb/helpers'

export const getUserResolver: FieldResolver<'Query', 'user'> = async (
  _,
  { id },
  ctx,
) => {
  try {
    return getUser(id, ctx.lowDb)
  } catch (error) {
    console.error(error)
    return null
  }
}
