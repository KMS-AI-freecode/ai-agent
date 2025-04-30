import {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLEnumType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLInt,
  GraphQLBoolean,
  GraphQLInputObjectType,
} from 'graphql'
import { JSONScalar } from './scalars/json'
import { resolvers } from './resolvers'
import { MindLogType as MindLogTypeEnum } from './types/MindLog/interfaces'

// Определение перечисления MindLogType
const MindLogTypeEnumType = new GraphQLEnumType({
  name: 'MindLogType',
  description: 'Типы записей MindLog',
  values: {
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
  },
})

// Определение типа MindLog
const MindLogType = new GraphQLObjectType({
  name: 'MindLog',
  description: 'Запись в логе мышления',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(MindLogTypeEnumType) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
})

// Входные данные для создания MindLog
const CreateMindLogInputType = new GraphQLInputObjectType({
  name: 'CreateMindLogInput',
  description: 'Входные данные для создания записи MindLog',
  fields: {
    type: { type: new GraphQLNonNull(MindLogTypeEnumType) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
})

// Определение Query
const QueryType = new GraphQLObjectType({
  name: 'Query',
  description: 'Корневые запросы',
  fields: () => ({
    foo: {
      type: JSONScalar,
      description: 'Заглушка, чтобы не потерять json',
    },

    // Получение записи MindLog по ID
    mindLog: {
      type: MindLogType,
      description: 'Получение записи MindLog по ID',
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolvers.Query.mindLog,
    },

    // Получение всех записей MindLog
    mindLogs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(MindLogType)),
      ),
      description: 'Получение всех записей MindLog',
      resolve: resolvers.Query.mindLogs,
    },

    // Поиск записей MindLog по типу
    mindLogsByType: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(MindLogType)),
      ),
      description: 'Получение записей MindLog по типу',
      args: {
        type: { type: new GraphQLNonNull(MindLogTypeEnumType) },
        limit: { type: GraphQLInt },
      },
      resolve: resolvers.Query.mindLogsByType,
    },

    // Векторный поиск похожих записей
    searchSimilarLogs: {
      type: new GraphQLNonNull(
        new GraphQLList(new GraphQLNonNull(MindLogType)),
      ),
      description: 'Векторный поиск похожих записей',
      args: {
        vector: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLInt)),
          ),
        },
        limit: { type: GraphQLInt },
      },
      resolve: resolvers.Query.searchSimilarLogs,
    },
  }),
})

// Определение Mutation
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Корневые мутации',
  fields: () => ({
    // Создание новой записи MindLog
    createMindLog: {
      type: MindLogType,
      description: 'Создание новой записи MindLog',
      args: {
        input: { type: new GraphQLNonNull(CreateMindLogInputType) },
      },
      resolve: resolvers.Mutation.createMindLog,
    },

    // Обновление векторного представления
    updateVector: {
      type: MindLogType,
      description: 'Обновление векторного представления записи MindLog',
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        vector: {
          type: new GraphQLNonNull(
            new GraphQLList(new GraphQLNonNull(GraphQLInt)),
          ),
        },
      },
      resolve: resolvers.Mutation.updateVector,
    },

    // Обработка стимула
    sendMessage: {
      type: new GraphQLNonNull(GraphQLString),
      description: 'Обработка стимула и создание цепочки мышления',
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
      resolve: resolvers.Mutation.processStimulus,
    },

    // Удаление всех записей MindLog
    deleteMindLogs: {
      type: new GraphQLNonNull(GraphQLBoolean),
      description: 'Удаление всех записей MindLog',
      resolve: resolvers.Mutation.deleteMindLogs,
    },
  }),
})

// Итоговая схема GraphQL
export const schema = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})
