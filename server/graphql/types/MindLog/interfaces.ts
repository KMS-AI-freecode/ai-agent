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
}

/**
 * Входные данные для создания записи MindLog
 */
export interface MindLogInput {
  type: MindLogType
  content: string
}

/**
 * Модель записи MindLog
 */
export interface MindLog extends MindLogInput {
  id: string
  vector?: number[]
  createdAt: string
  data: string
  [key: string]: unknown // Индексная сигнатура для совместимости с Record<string, unknown>
}
