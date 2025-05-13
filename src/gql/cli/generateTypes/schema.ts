import * as codegen from '@graphql-codegen/cli'
import path from 'path'
import { OUTPUT_PATH } from './constants'

/** Функция генерирующая schema.json */
export const generateSchema = async () => {
  await codegen.generate(
    {
      schema: path.resolve(process.cwd(), 'server/nexus/index.ts'),
      generates: {
        [path.resolve(OUTPUT_PATH, 'schema.json')]: {
          plugins: [{ introspection: {} }],
        },
      },
    },
    true,
  )
}
