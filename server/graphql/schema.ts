import {
  GraphQLObjectType,
  GraphQLString,
  GraphQLList,
  GraphQLNonNull,
  GraphQLSchema,
  GraphQLEnumType,
  GraphQLScalarType,
  GraphQLInt,
  GraphQLInputObjectType,
  Kind,
} from 'graphql'
import { makeExecutableSchema } from '@graphql-tools/schema'
import { resolvers } from './resolvers'

// JSON скаляр
const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value) {
    return value
  },
  parseValue(value) {
    return value
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      try {
        return JSON.parse(ast.value)
      } catch (error) {
        return null
      }
    }
    return null
  },
})

// Enum для типов MindLog
const MindLogTypeEnum = new GraphQLEnumType({
  name: 'MindLogType',
  description: 'Типы записей в MindLog',
  values: {
    STIMULUS: { value: 'STIMULUS' },
    REACTION: { value: 'REACTION' },
    REASONING: { value: 'REASONING' },
    ACTION: { value: 'ACTION' },
    RESULT: { value: 'RESULT' },
  },
})

// Тип MindLog
const MindLogType = new GraphQLObjectType({
  name: 'MindLog',
  description: 'Запись в базе данных мыслей',
  fields: () => ({
    id: { type: new GraphQLNonNull(GraphQLString) },
    type: { type: new GraphQLNonNull(MindLogTypeEnum) },
    content: { type: new GraphQLNonNull(GraphQLString) },
    createdAt: { type: new GraphQLNonNull(GraphQLString) },
  }),
})

// Входные данные для MindLog
const MindLogInputType = new GraphQLInputObjectType({
  name: 'MindLogInput',
  description: 'Входные данные для создания записи MindLog',
  fields: {
    type: { type: new GraphQLNonNull(MindLogTypeEnum) },
    content: { type: new GraphQLNonNull(GraphQLString) },
  },
})

// Корневой тип Query
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
    },

    // Получение всех записей MindLog
    mindLogs: {
      type: new GraphQLNonNull(new GraphQLList(MindLogType)),
      description: 'Получение всех записей MindLog',
    },

    // Поиск записей по типу
    mindLogsByType: {
      type: new GraphQLNonNull(new GraphQLList(MindLogType)),
      description: 'Поиск записей по типу',
      args: {
        type: { type: new GraphQLNonNull(MindLogTypeEnum) },
        limit: { type: GraphQLInt },
      },
    },

    // Семантический поиск по вектору
    searchSimilarLogs: {
      type: new GraphQLNonNull(new GraphQLList(MindLogType)),
      description: 'Семантический поиск похожих записей по вектору',
      args: {
        vector: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
        limit: { type: GraphQLInt },
      },
    },
  }),
})

// Корневой тип Mutation
const MutationType = new GraphQLObjectType({
  name: 'Mutation',
  description: 'Корневые мутации',
  fields: () => ({
    // Создание новой записи MindLog
    createMindLog: {
      type: new GraphQLNonNull(MindLogType),
      description: 'Создание новой записи MindLog',
      args: {
        input: { type: new GraphQLNonNull(MindLogInputType) },
      },
    },

    // Обработка стимула и создание цепочки мышления
    processStimulus: {
      type: new GraphQLNonNull(MindLogType),
      description: 'Обработка стимула и создание цепочки мышления',
      args: {
        content: { type: new GraphQLNonNull(GraphQLString) },
      },
    },

    // Обновление векторного представления записи
    updateVector: {
      type: MindLogType,
      description: 'Обновление векторного представления записи',
      args: {
        id: { type: new GraphQLNonNull(GraphQLString) },
        vector: { type: new GraphQLNonNull(new GraphQLList(GraphQLInt)) },
      },
    },
  }),
})

// Создаем схему
const typeDefs = new GraphQLSchema({
  query: QueryType,
  mutation: MutationType,
})

// Создаем исполняемую схему с резолверами
export const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
})
