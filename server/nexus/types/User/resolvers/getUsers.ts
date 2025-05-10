import { FieldResolver } from 'nexus'

export const getUsersResolver: FieldResolver<'Query', 'users'> = (
  _,
  _args,
  ctx,
) => {
  return ctx.lowDb.data.users
}
