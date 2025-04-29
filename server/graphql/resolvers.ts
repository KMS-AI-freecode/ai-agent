import { GraphQLScalarType, Kind } from 'graphql'
import { ApolloContext } from '../types/context'
import { MindLogInput, MindLogType } from '../services/mindLogService'

// Определение скалярного типа JSON
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

// Резолверы для GraphQL
export const resolvers = {
  // Скалярный тип JSON
  JSON: JSONScalar,

  // Запросы
  Query: {
    // Получение записи MindLog по ID
    mindLog: async (
      _parent: unknown,
      { id }: { id: string },
      context: ApolloContext,
    ) => {
      return await context.services.mindLogService.getMindLogById(id)
    },

    // Получение всех записей MindLog
    mindLogs: async (
      _parent: unknown,
      _args: Record<string, never>,
      context: ApolloContext,
    ) => {
      return await context.services.mindLogService.getAllMindLogs()
    },

    // Поиск записей по типу
    mindLogsByType: async (
      _parent: unknown,
      { type, limit }: { type: MindLogType; limit?: number },
      context: ApolloContext,
    ) => {
      return await context.services.mindLogService.findLogsByType(type, limit)
    },

    // Семантический поиск по вектору
    searchSimilarLogs: async (
      _parent: unknown,
      { vector, limit }: { vector: number[]; limit?: number },
      context: ApolloContext,
    ) => {
      return await context.services.mindLogService.findSimilarLogs(
        vector,
        limit,
      )
    },
  },

  // Мутации
  Mutation: {
    // Создание новой записи MindLog
    createMindLog: async (
      _parent: unknown,
      { input }: { input: MindLogInput },
      context: ApolloContext,
    ) => {
      return await context.services.mindLogService.createMindLog(input)
    },

    // Обновление векторного представления записи
    updateVector: async (
      _parent: unknown,
      { id, vector }: { id: string; vector: number[] },
      context: ApolloContext,
    ) => {
      await context.services.mindLogService.updateVector(id, vector)
      return await context.services.mindLogService.getMindLogById(id)
    },
  },
}
