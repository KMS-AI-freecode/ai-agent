/* eslint-disable no-console */
import {
  LowDbExperience,
  LowDbMessage,
  LowDbUser,
} from '../../../../../../lowdb/interfaces'
import { generateId } from '../../../../../../utils/id'
import { ApolloContext } from '../../../../../context'
import { Skill } from '../../../../../context/skills'

type processMessageProps = {
  user: LowDbUser
  message: LowDbMessage
  ctx: ApolloContext
}

/**
 * Попытка применения скилов к обрабатываемому сообщению.
 * Сейчас это реализуемо пока только к самому агенту приложения,
 * но в дальнейшем такую логику надо расширить для любого пользователя в системе,
 * так как у любого пользователя могут быть накоплены свои знания и скилы.
 */
export async function processMessageBySkills({
  user,
  message,
  ctx,
}: processMessageProps): Promise<
  | {
      result: string
    }
  | undefined
> {
  const { lowDb } = ctx

  const { Skills, Experiences, Knowledges } = user

  console.log('processMessage message', message)

  let result: string | undefined = undefined

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

    return {
      result,
    }
  }

  return
}
