/* eslint-disable no-console */
import { extendType, interfaceType } from 'nexus'
import { NexusGenObjects } from '../../generated/nexus'
import { PUBSUB_ACTIVITY_ADDED } from '../Message/interfaces'

export const Activity = interfaceType({
  name: 'Activity',
  definition(t) {
    t.nonNull.id('id')
  },
  resolveType(object) {
    console.log('object', object)

    if ('name' in object) {
      return 'User'
    } else {
      return 'Message'
    }
  },
})

// export const ActivityUser = objectType({
//   name: 'ActivityUser',
//   definition(t) {
//     t.implements('Activity')
//     t.nonNull.field('User', {
//       type: 'User',
//     })
//   },
// })

// export const ActivityMessage = objectType({
//   name: 'ActivityMessage',
//   definition(t) {
//     t.implements('Activity')
//     t.nonNull.field('Message', {
//       type: 'Message',
//     })
//   },
// })

export const ActivityExtendsQuery = extendType({
  type: 'Query',
  definition(t) {
    t.nonNull.list.nonNull.field('acivities', {
      type: 'Activity',
      resolve: async (_, _args, ctx) => {
        const {
          lowDb: {
            data: { users },
          },
        } = ctx

        return [...users]
      },
    })
  },
})

export const ActivityExtendsSubscription = extendType({
  type: 'Subscription',
  definition(t) {
    t.field<
      'activityAdded',
      NexusGenObjects['Message'] | NexusGenObjects['User']
    >('activityAdded', {
      type: 'Activity',
      subscribe(_, _args, ctx) {
        return ctx.pubsub.asyncIterableIterator([PUBSUB_ACTIVITY_ADDED])
      },
      resolve(messageData) {
        return messageData
      },
    })
  },
})
