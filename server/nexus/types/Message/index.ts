import { extendType, nonNull, objectType } from 'nexus'
import { sendMessageResolver } from './resolvers/sendMessage'
import { resolve } from 'path'

export const Message = objectType({
  name: 'Message',
  sourceType: {
    module: resolve(__dirname, '../../../lowdb/interfaces.ts'),
    export: 'LowDbMessage',
  },
  definition(t) {
    t.implements('Activity')
    t.nonNull.string('text')
    t.nonNull.date('createdAt')
    t.date('updatedAt')
    t.nonNull.string('userId')
    t.string('toUserId')
  },
})

export const MessageExtendMutation = extendType({
  type: 'Mutation',
  definition(t) {
    t.nonNull.field('sendMessage', {
      type: 'MessageResponse',
      args: {
        text: nonNull('String'),
      },
      resolve: sendMessageResolver,
    })
  },
})

export const MessageResponse = objectType({
  name: 'MessageResponse',
  definition(t) {
    t.field('reply', {
      type: 'Message',
    })
  },
})
