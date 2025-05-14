/* eslint-disable no-console */
import { getUser } from '../../../../../../lowdb/helpers'
import {
  LowDbExperience,
  LowDbMessage,
} from '../../../../../../lowdb/interfaces'
import { generateId } from '../../../../../../utils/id'
import { ApolloContext } from '../../../../../context'
import { Skill } from '../../../../../context/skills'

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

  const agentUser = getUser(agent.userId, ctx)

  const { Skills, Experiences, Knowledges } = agentUser

  console.log('processMessage message', message)

  let result: string | undefined

  // for (const processor of Skills) {
  //   const match = message.text.match(processor.query)

  //   if (match) {
  //     console.log('processMessage match array', Array.from(match))
  //     console.log('processMessage match.slice(1)', match.slice(1))

  //     // console.log('processMessage match values', [...match.entries()])
  //     console.log('processMessage match values', match)

  //     result = processor.fn.apply(null, match.slice(1))

  //     console.log('processMessage result', result)

  //     break
  //   }
  // }

  /**
   * Находим все подходящие скиды
   */
  // const possibleSkills = Skills.filter((n) => {
  //   return message.text.match(n.query)
  // }).map((n) => {
  //   return { skill: n, Experiences: Experiences.filter((i) => i.skillId) }
  // })

  const possibleSkills: {
    skill: Skill
    Experiences: LowDbExperience[]
    args: string[]
  }[] = []

  Skills.forEach((n) => {
    const match = message.text.match(n.query)

    if (match) {
      possibleSkills.push({
        skill: n,
        Experiences: Experiences.filter((n) => n.skillId),
        args: match.slice(1),
      })
    }
  })
  // .map((n) => {
  //   return { skill: n, Experiences: Experiences.filter((i) => i.skillId) }
  // })
  // TODO Надо подумать будет на счет сортировки
  // .sort((a, b) => {
  //   const aAvg = a.Experiences.reduce((curr, next) => curr + next.knowledgeId ,0)
  // })

  console.log('possibleSkills', possibleSkills)

  /**
   * Здесь мы получаем еще подходящие скилы, которые в том числе могут содержать
   * в себе знания. То есть суметь понять что за сообщение пришло - это тоже скил.
   * Скил в свою очередь может вернуть знание.
   */

  const usedSkill = possibleSkills.at(0)

  if (usedSkill) {
    // usedSkill.skill.result = usedSkill?.skill.fn.apply(null, match.slice(1))

    const knowledge = Knowledges.find((n) => n.skillId === usedSkill.skill.id)

    const experience: LowDbExperience = {
      id: generateId(),
      createdAt: new Date(),
      skillId: usedSkill.skill.id,
      knowledgeId: knowledge?.id,
      quality: 0.5,
    }

    try {
      result = usedSkill.skill.fn.apply(null, usedSkill.args)
    } catch (error) {
      experience.error =
        error instanceof Error && 'message' in error && error.message
          ? error.message
          : 'Unknown error'

      experience.quality = 0

      throw error
    }

    Experiences.push(experience)

    if (process.env.NODE_ENV === 'development') {
      await lowDb.write()
    }
  }

  // for (const processor of Skills) {
  //   const match = message.text.match(processor.query)

  //   if (match) {
  //     console.log('processMessage match array', Array.from(match))
  //     console.log('processMessage match.slice(1)', match.slice(1))

  //     // console.log('processMessage match values', [...match.entries()])
  //     console.log('processMessage match values', match)

  //     result = processor.fn.apply(null, match.slice(1))

  //     console.log('processMessage result', result)

  //     break
  //   }
  // }

  // for (const processor of Skills) {
  //   const match = message.text.match(processor.query)

  //   if (match) {
  //     console.log('processMessage match array', Array.from(match))
  //     console.log('processMessage match.slice(1)', match.slice(1))

  //     // console.log('processMessage match values', [...match.entries()])
  //     console.log('processMessage match values', match)

  //     result = processor.fn.apply(null, match.slice(1))

  //     console.log('processMessage result', result)

  //     break
  //   }
  // }

  return result !== undefined
    ? {
        result,
      }
    : undefined
}
