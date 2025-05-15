import { FieldResolver } from 'nexus'
import { createAuthToken } from './helpers/createAuthToken'

export const createAuthTokenResolver: FieldResolver<
  'Mutation',
  'createAuthToken'
> = async (_, _args, ctx) => {
  const response = await createAuthToken(ctx)

  return {
    token: response.token,
    User: response.user,
  }
}
