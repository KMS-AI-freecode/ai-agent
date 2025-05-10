import { enumType, objectType } from 'nexus'
import { MindLogType } from './interfaces'
import { resolve } from 'path'

export const MindLog = objectType({
  name: 'MindLog',
  sourceType: {
    module: resolve(__dirname, '../../../lowdb/interfaces.ts'),
    export: 'LowDbMindlog',
  },
  definition(t) {
    t.nonNull.id('id')
    t.nonNull.field('type', {
      type: 'MindLogTypeEnum',
    })
    t.nonNull.string('data')
    t.nonNull.date('createdAt')
    t.date('updatedAt')
  },
})

export const MindLogTypeEnum = enumType({
  name: 'MindLogTypeEnum',
  members: Object.values(MindLogType),
})
