import jwt from 'jsonwebtoken'
import { LowDbToken, LowDbUser } from '../../lowdb/interfaces'
import { ApolloContext } from '../../nexus/context'
import { TokenData } from './interfaces'

export const createToken = (
  user: LowDbUser,
  ctx: ApolloContext,
): LowDbToken => {
  const tokenData: TokenData = {
    userId: user.id,
  }

  const token = jwt.sign(tokenData, ctx.APP_SECRET)

  const lowDbToken: LowDbToken = {
    token,
    userId: tokenData.userId,
    createdAt: new Date(),
  }

  return lowDbToken
}
