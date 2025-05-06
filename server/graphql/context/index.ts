import { ContextFunction } from '@apollo/server'
import { ExpressContextFunctionArgument } from '@apollo/server/dist/esm/express4'
import { Request } from 'express'
import OpenAI from 'openai'
import { openaiClient } from '../../openaiClient'
import { WorldManager } from '../../world'

export interface ApolloContext {
  req: Request
  services: Record<string, unknown>
  openai: OpenAI
  aiAgent?: { id: string }
  // connection: { id: string } | undefined
  worldManager: WorldManager
}

export const createContext: ContextFunction<
  [
    ExpressContextFunctionArgument & {
      worldManager: ApolloContext['worldManager']
    },
  ],
  ApolloContext
> = async ({ req, worldManager }) => {
  const context: ApolloContext = {
    req,
    services: {},
    openai: openaiClient,
    // connection: { id: connection.id }
    // connection: undefined,
    worldManager,
  }

  return context
}
