import { MindLogType } from '../types/MindLog/interfaces'
import {
  getMindLogById,
  getAllMindLogs,
  findLogsByType,
  findSimilarLogs,
  createMindLog,
  updateVector,
  deleteMindLogs,
} from '../types/MindLog/resolvers'

import { JSONScalar } from '../scalars/json'
import { processStimulus } from '../types/MindLog/helpers/processStimulus'

export const resolvers = {
  // GraphQL Scalars
  JSON: JSONScalar,

  // Enum для типов MindLog
  MindLogType: {
    Stimulus: MindLogType.Stimulus,
    Reaction: MindLogType.Reaction,
    Reasoning: MindLogType.Reasoning,
    Intention: MindLogType.Intention,
    Action: MindLogType.Action,
    Progress: MindLogType.Progress,
    Conclusion: MindLogType.Conclusion,
    Result: MindLogType.Result,
    Confirmation: MindLogType.Confirmation,
    Refutation: MindLogType.Refutation,
    Correction: MindLogType.Correction,
    Evaluation: MindLogType.Evaluation,
    Suggestion: MindLogType.Suggestion,
    OptimizedMemory: MindLogType.OptimizedMemory,
    ForgottenMemory: MindLogType.ForgottenMemory,
    ChunkedKnowledge: MindLogType.ChunkedKnowledge,
    ReinforcedAction: MindLogType.ReinforcedAction,
    Mentoring: MindLogType.Mentoring,
    Guidance: MindLogType.Guidance,
    ProcessSummary: MindLogType.ProcessSummary,
  },

  // Разрешители запросов
  Query: {
    mindLog: getMindLogById,
    mindLogs: getAllMindLogs,
    mindLogsByType: findLogsByType,
    searchSimilarLogs: findSimilarLogs,
  },

  // Разрешители мутаций
  Mutation: {
    createMindLog,
    updateVector,
    processStimulus,
    deleteMindLogs,
  },
}
