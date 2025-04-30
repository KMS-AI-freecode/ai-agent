import { Request } from 'express'
import * as lancedb from '@lancedb/lancedb'
import OpenAI from 'openai'

export interface ApolloContext {
  req: Request
  lanceDb: lancedb.Connection
  services: Record<string, unknown>
  openai: OpenAI
  aiAgent?: { id: string }
}
