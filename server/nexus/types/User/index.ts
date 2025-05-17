import { enumType, extendType, objectType } from 'nexus'
import { createAuthTokenResolver } from './resolvers/createAuthToken'
import { getUsersResolver } from './resolvers/getUsers'

export const User = objectType({
  name: 'User',
  definition(t) {
    t.implements('Activity')
    t.string('name')
    t.nonNull.field('type', {
      type: 'UserTypeEnum',
    })
    t.field('data', {
      type: 'JSON',
    })
    t.nonNull.date('createdAt')
    t.date('updatedAt')

    t.nonNull.list.nonNull.field('MindLogs', {
      type: 'MindLog',
    })

    t.nonNull.list.nonNull.field('Messages', {
      type: 'Message',
    })
  },
})

export const UserQuery = extendType({
  type: 'Query',
  definition(t) {
    t.field('me', {
      type: 'User',
      resolve(_, _args, ctx) {
        return ctx.currentUser ?? null
      },
    })

    t.nonNull.list.nonNull.field('users', {
      type: 'User',
      resolve: getUsersResolver,
    })
  },
})

export const UserExtendsMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('createAuthToken', {
      type: 'AuthTokenPayload',
      description: 'Используется для идентификации соединения пользователя',
      resolve: createAuthTokenResolver,
    })
  },
})

export const UserTypeEnum = enumType({
  name: 'UserTypeEnum',
  members: ['Human', 'Agent'],
})

export const AuthTokenPayload = objectType({
  name: 'AuthTokenPayload',
  definition(t) {
    t.nonNull.string('token')
    t.nonNull.field('User', {
      type: 'User',
    })
  },
})
