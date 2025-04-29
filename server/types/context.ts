import { MindLogService } from '../services/mindLogService'
import * as lancedb from '@lancedb/lancedb'
import { Request } from 'express'

export interface ApolloContext {
  req: Request
  lanceDb: lancedb.Connection
  services: {
    mindLogService: MindLogService
  }
}
