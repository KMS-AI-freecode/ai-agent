import { FieldResolver } from 'nexus'
import { createToken } from '../../../../utils/jwt'
import { LowDbUser } from '../../../../lowdb/interfaces'
import { generateId } from '../../../../utils/id'
import { prepareSkillsSerializer } from '../../../context/skills'

export const createAuthTokenResolver: FieldResolver<
  'Mutation',
  'createAuthToken'
> = async (_, _args, ctx) => {
  const { lowDb } = ctx

  const user: LowDbUser = {
    id: generateId(),
    createdAt: new Date(),
    type: 'Human',
    Messages: [],
    MindLogs: [],
    Skills: prepareSkillsSerializer([]),
  }

  lowDb.data.users.push(user)

  const token = createToken(user, ctx)

  lowDb.data.tokens.push(token)

  await lowDb.write()

  return {
    token: token.token,
  }
}
