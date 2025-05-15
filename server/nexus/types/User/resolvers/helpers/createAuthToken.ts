import { LowDbUser } from '../../../../../lowdb/interfaces'
import { generateId } from '../../../../../utils/id'
import { createToken } from '../../../../../utils/jwt'
import { ApolloContext } from '../../../../context'
import { prepareSkillsSerializer } from '../../../../context/skills'

export const createAuthToken = async (ctx: ApolloContext) => {
  const { lowDb } = ctx

  const user: LowDbUser = {
    id: generateId(),
    createdAt: new Date(),
    type: 'Human',
    Messages: [],
    MindLogs: [],
    Skills: prepareSkillsSerializer([]),
    Knowledges: [],
    Experiences: [],
  }

  lowDb.data.users.push(user)

  const token = createToken(user, ctx)

  lowDb.data.tokens.push(token)

  await lowDb.write()

  return {
    token: token.token,
    user,
  }
}
