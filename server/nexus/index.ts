import { asNexusMethod, makeSchema } from 'nexus'

import * as types from './types'

import { DateTimeResolver } from 'graphql-scalars'

export const DateTime = asNexusMethod(DateTimeResolver, 'date', 'Date')

export const schema = makeSchema({
  plugins: [],
  types: {
    ...types,
    DateTime,
  },
  outputs: {
    schema: __dirname + '/generated/schema.graphql',
    typegen: __dirname + '/generated/nexus.ts',
  },
  contextType: {
    module: require.resolve('./context'),
    export: 'ApolloContext',
  },
  sourceTypes: {
    debug: process.env.NODE_ENV === 'development',
    modules: [],
  },
  prettierConfig:
    process.env.NODE_ENV === 'development'
      ? require.resolve(process.cwd() + '/.prettierrc')
      : undefined,
})
