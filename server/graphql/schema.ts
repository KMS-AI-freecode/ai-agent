import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLString,
  // GraphQLList,
  GraphQLNonNull,
  // GraphQLInt,
  // GraphQLBoolean,
  // GraphQLInputObjectType,
} from 'graphql'
import { JSONScalar } from './scalars/json'
import { resolvers } from './resolvers'
import { MindLogType as MindLogTypeEnum } from './types/MindLog/interfaces'

const mindLogTypeValues: Record<
  MindLogTypeEnum,
  {
    value: MindLogTypeEnum
    description: string
  }
> = {
  Stimulus: {
    value: MindLogTypeEnum.Stimulus,
    description: 'Входящий раздражитель, запрос или сигнал',
  },
  Reaction: {
    value: MindLogTypeEnum.Reaction,
    description: 'Первичная реакция на раздражитель',
  },
  Reasoning: {
    value: MindLogTypeEnum.Reasoning,
    description: 'Логика рассуждения и анализ информации',
  },
  Intention: {
    value: MindLogTypeEnum.Intention,
    description: 'Намерение совершить действие',
  },
  Action: {
    value: MindLogTypeEnum.Action,
    description: 'Конкретное действие для решения задачи',
  },
  Progress: {
    value: MindLogTypeEnum.Progress,
    description: 'Промежуточные мысли и прогресс в выполнении',
  },
  Conclusion: {
    value: MindLogTypeEnum.Conclusion,
    description: 'Заключение на основе анализа',
  },
  Result: {
    value: MindLogTypeEnum.Result,
    description: 'Окончательный результат',
  },
  Confirmation: {
    value: MindLogTypeEnum.Confirmation,
    description: 'Подтверждение гипотезы или информации',
  },
  Refutation: {
    value: MindLogTypeEnum.Refutation,
    description: 'Опровержение неверной информации',
  },
  Correction: {
    value: MindLogTypeEnum.Correction,
    description: 'Исправление ошибки или неточности',
  },
  Evaluation: {
    value: MindLogTypeEnum.Evaluation,
    description: 'Оценка качества или полезности информации',
  },
  Suggestion: {
    value: MindLogTypeEnum.Suggestion,
    description: 'Предложение альтернативного подхода',
  },
  OptimizedMemory: {
    value: MindLogTypeEnum.OptimizedMemory,
    description: 'Оптимизированное знание или информация',
  },
  ForgottenMemory: {
    value: MindLogTypeEnum.ForgottenMemory,
    description: 'Информация, которая больше не актуальна',
  },
  ChunkedKnowledge: {
    value: MindLogTypeEnum.ChunkedKnowledge,
    description: 'Сгруппированная информация из разных источников',
  },
  ReinforcedAction: {
    value: MindLogTypeEnum.ReinforcedAction,
    description: 'Усиленное действие после положительного отклика',
  },
  Mentoring: {
    value: MindLogTypeEnum.Mentoring,
    description: 'Передача знаний от опытного агента',
  },
  Guidance: {
    value: MindLogTypeEnum.Guidance,
    description: 'Направление по решению будущих задач',
  },
  ProcessSummary: {
    value: MindLogTypeEnum.ProcessSummary,
    description: 'Краткое резюме всего процесса с выделением ключевых точек',
  },
  Error: {
    value: MindLogTypeEnum.Error,
    description: 'Ошибка',
  },
  SecurityViolation: {
    value: MindLogTypeEnum.SecurityViolation,
    description: 'Нарушение политик безопасности',
  },
}

// Определение перечисления MindLogType
const MindLogTypeEnumType = new GraphQLEnumType({
  name: 'MindLogType',
  description: 'Типы записей MindLog',
  values: mindLogTypeValues,
})

// Определение Query
const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Корневые запросы',
  fields: () => ({
    foo: {
      type: GraphQLString,
    },
    getWorldObjects: {
      // type: new GraphQLNonNull(new GraphQLList(new GraphQLNonNull(JSONScalar))),
      type: JSONScalar,
      description:
        'Получить все объекты из мира Gun.js. Доступен только в режиме разработки',
      resolve: resolvers.Query.getWorldObjects,
    },
  }),
})

// Определение Mutation
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Корневые мутации',
  fields: () => ({
    // Обработка стимула
    sendMessage: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Обработка стимула и создание цепочки мышления',
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolvers.Mutation.processStimulus,
    },
  }),
})

// Итоговая схема GraphQL
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
  types: [MindLogTypeEnumType, JSONScalar],
})
