/* eslint-disable no-console */
import { getUser } from '../../../../../../lowdb/helpers'
import { LowDbMessage } from '../../../../../../lowdb/interfaces'
import { ApolloContext } from '../../../../../context'

type processMessageProps = {
  message: LowDbMessage
  ctx: ApolloContext
}

export async function processMessage({
  ctx,
  message,
}: processMessageProps): Promise<
  | {
      result: string
    }
  | undefined
> {
  const { lowDb } = ctx

  const { agent } = lowDb.data

  if (!agent) {
    throw new Error('Have no agent')
  }

  const skills = getUser(agent.userId, ctx).Skills

  console.log('processMessage message', message)

  let result: string | undefined

  for (const processor of skills) {
    const match = message.text.match(processor.query)

    if (match) {
      console.log('processMessage match array', Array.from(match))
      console.log('processMessage match.slice(1)', match.slice(1))

      // console.log('processMessage match values', [...match.entries()])
      console.log('processMessage match values', match)

      result = processor.fn.apply(null, match.slice(1))

      console.log('processMessage result', result)

      break
    }
  }

  return result !== undefined
    ? {
        result,
      }
    : undefined
}
