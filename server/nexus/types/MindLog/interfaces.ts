// import { NexusGenEnums } from '../../generated/nexus'

import { NexusGenObjects } from '../../generated/nexus'

// export type MindLogType = NexusGenEnums['MindLogTypeEnum']

export type MindLog = NexusGenObjects['MindLog']

/**
 * Типы записей в MindLog
 */
export enum MindLogType {
  Stimulus = 'Stimulus',
  Reaction = 'Reaction',
  Reasoning = 'Reasoning',
  Intention = 'Intention',
  Action = 'Action',
  Progress = 'Progress',
  Error = 'Error',
  Conclusion = 'Conclusion',
  Result = 'Result',
  Confirmation = 'Confirmation',
  Refutation = 'Refutation',
  Correction = 'Correction',
  Evaluation = 'Evaluation',
  Suggestion = 'Suggestion',
  OptimizedMemory = 'OptimizedMemory',
  ForgottenMemory = 'ForgottenMemory',
  ChunkedKnowledge = 'ChunkedKnowledge',
  ReinforcedAction = 'ReinforcedAction',
  Mentoring = 'Mentoring',
  Guidance = 'Guidance',
  ProcessSummary = 'ProcessSummary',
  SecurityViolation = 'SecurityViolation',
}

// /**
//  * Входные данные для создания записи MindLog
//  */
// export interface MindLogInput {
//   type: MindLogType
//   data: string
// }

// /**
//  * Модель записи MindLog
//  */
// export type MindLog = {
//   id: string
//   type: MindLogType
//   data: string
//   createdAt: string
// }
