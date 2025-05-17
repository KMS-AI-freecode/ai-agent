import { NexusGenObjects } from '../../generated/nexus'

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
  ChunkedSkill = 'ChunkedSkill',
  ReinforcedAction = 'ReinforcedAction',
  Mentoring = 'Mentoring',
  Guidance = 'Guidance',
  ProcessSummary = 'ProcessSummary',
  SecurityViolation = 'SecurityViolation',
}
