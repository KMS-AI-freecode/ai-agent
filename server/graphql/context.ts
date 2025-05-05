import { Request } from 'express'
import OpenAI from 'openai'

export interface ApolloContext {
  req: Request
  services: Record<string, unknown>
  openai: OpenAI
  aiAgent?: { id: string }
}
