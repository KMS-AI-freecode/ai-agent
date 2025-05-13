/* eslint-disable no-console */
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
  const { knowledges } = ctx

  console.log('processMessage message', message)

  let result: string | undefined

  for (const processor of knowledges) {
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
