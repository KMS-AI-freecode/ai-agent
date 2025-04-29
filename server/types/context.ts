import { MindLogService } from '../services/mindLogService'
import * as lancedb from '@lancedb/lancedb'
import { Request } from 'express'

export interface ApolloContext {
  req: Request
  lancedbConnection: Awaited<ReturnType<typeof lancedb.connect>>
  services: {
    mindLogService: MindLogService
  }
}
