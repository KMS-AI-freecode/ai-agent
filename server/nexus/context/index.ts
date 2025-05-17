/* eslint-disable no-console */
import { ContextFunction } from '@apollo/server'
import { ExpressContextFunctionArgument } from '@apollo/server/dist/esm/express4'
import OpenAI from 'openai'
import jwt from 'jsonwebtoken'
import { openaiClient } from '../../openaiClient'
// import { WorldManager } from '../../world'
import { Low } from 'lowdb/lib'
import { LowDbData, LowDbUser } from '../../lowdb/interfaces'
import { pubsub } from './PubSub'
import { getUser } from '../../lowdb/helpers'
// import { skills } from './skills'

const APP_SECRET = process.env.APP_SECRET

if (!APP_SECRET) {
  throw new Error('APP_SECRET env is not defined')
}

const OPENAI_API_BASE_URL = process.env.OPENAI_API_BASE_URL

if (!OPENAI_API_BASE_URL) {
  throw new Error('OPENAI_API_BASE_URL env is not defined')
}

export interface ApolloContext {
  APP_SECRET: string
  services: Record<string, unknown>
  openai: OpenAI
  // aiAgent?: { id: string }
  // connection: { id: string } | undefined
  // worldManager: WorldManager
  lowDb: Low<LowDbData>
  Agent: LowDbUser

  // Authorized user
  currentUser: LowDbUser | undefined | null
  OPENAI_API_BASE_URL: string

  pubsub: typeof pubsub

  // skills: typeof skills
}

export const createContext: ContextFunction<
  [
    // ExpressContextFunctionArgument &
    {
      // worldManager: ApolloContext['worldManager']
      lowDb: ApolloContext['lowDb']
      req: ExpressContextFunctionArgument['req'] | undefined
    },
  ],
  ApolloContext
> = async ({ req, lowDb }) => {
  let currentUser: ApolloContext['currentUser'] = undefined

  const agent = lowDb.data.agent

  if (!agent) {
    throw new Error('Have no agent')
  }

  const Agent: ApolloContext['Agent'] = getUser(agent.userId, lowDb)

  /**
   * Если есть токен, пытаемся получить текущего пользователя
   */
  if (req?.headers.authorization) {
    try {
      const token = req.headers.authorization.replace('Bearer ', '')
      const tokenData = jwt.verify(token, APP_SECRET)

      console.log('tokenData', tokenData)

      if (typeof tokenData === 'object' && tokenData.userId) {
        const userId: string = tokenData.userId

        currentUser = lowDb.data.users.find((n) => n.id === userId)
      }
    } catch (error) {
      console.error(error)
    }
  }

  const context: ApolloContext = {
    APP_SECRET,
    services: {},
    openai: openaiClient,
    // connection: { id: connection.id }
    // connection: undefined,
    // worldManager,
    lowDb,
    Agent,
    currentUser,
    OPENAI_API_BASE_URL,
    pubsub,
    // skills,
  }

  return context
}
