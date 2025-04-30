import { GraphQLScalarType, Kind } from 'graphql'

// JSON скаляр для работы со сложными типами данных
export const JSONScalar = new GraphQLScalarType({
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
