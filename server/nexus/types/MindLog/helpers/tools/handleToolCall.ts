/* eslint-disable no-console */
import { ToolCall } from '../interfaces'
import { createMindLogEntry } from '../createMindLog'
import { exec } from 'child_process'
import * as os from 'os'
import { MindLogType } from '../../interfaces'
import { toolName } from './interfaces'
import { ApolloContext } from '../../../../../nexus/context'
import { LowDbKnowledge, LowDbUser } from '../../../../../lowdb/interfaces'
import { Skill } from '../../../../context/skills'
import { generateId } from '../../../../../utils/id'
import { createMessage, getUser } from '../../../../../lowdb/helpers'
import { sendMessage } from '../../../Message/resolvers/helpers/sendMessage'

/**
 * Обработчик вызовов инструментов
 */

type handleToolCallProps = {
  ctx: ApolloContext
  user: LowDbUser
  toolCall: ToolCall
}

export async function handleToolCall({
  // agentId,
  user,
  ctx,
  toolCall,
}: handleToolCallProps): Promise<string | undefined> {
  const { lowDb, Agent: localAgentUser } = ctx

  const { Skills: skills, Knowledges } = localAgentUser

  const { name, arguments: argsString } = toolCall.function
  const args = JSON.parse(argsString)

  createMessage({
    text: `Вызови тулзу "${name}" с такими аргументами: ${argsString}`,
    fromUser: user,
    toUser: undefined,
  })

  // Логируем вызов инструмента с аргументами
  console.log(`Tool Call: ${name}`, args)
  await createMindLogEntry({
    ctx,
    // agentId,
    userId: user.id,
    type: MindLogType.Progress,
    data: `Вызов инструмента: ${name}, аргументы: ${argsString}`,
    quality: 0.5,
  })

  switch (name) {
    case toolName.createMindLogEntry: {
      const { type, data, quality } = args
      const entry = await createMindLogEntry({
        ctx,
        userId: user.id,
        type: type as MindLogType,
        data,
        quality,
      })
      return `Создана запись с id "${entry.id}"`
    }

    case toolName.getSystemConfig: {
      // Получаем системную информацию
      const config = {
        workingDirectory: process.cwd(),
        cacheDirectory: '/tmp/agent-cache',
        permanentStorage: '/data/agent-storage',
        os: {
          type: os.type(),
          platform: os.platform(),
          release: os.release(),
          arch: os.arch(),
        },
        env: {
          nodeVersion: process.version,
          path: process.env.PATH,
        },
      }

      const result = `### Получена системная конфигурация

\`\`\`json
${JSON.stringify(config, null, 2)}
\`\`\``

      return result
    }

    case toolName.execCommand: {
      const { command } = args

      try {
        // Простой интерфейс - только строка на вход и строка на выход
        const output = await new Promise<string>((resolve, reject) => {
          exec(command, (error, stdout, stderr) => {
            if (error) {
              reject(stderr || error.message)
            } else {
              resolve(stdout || stderr)
            }
          })
        })

        return output
      } catch (error) {
        const errorOutput = String(error)

        await createMindLogEntry({
          ctx,
          userId: user.id,
          type: MindLogType.Error,
          data: `### Ошибка выполнения команды

\`\`\`
${errorOutput}
\`\`\``,
          quality: 0.3,
        })

        return `Возникла ошибка: ${errorOutput}`
      }
    }

    case toolName.getKnowledges: {
      const { ids, skillId } = args as {
        ids?: string[]
        skillId?: string
      }

      try {
        // Фильтрация по skillId, если указан
        let filteredKnowledges = [...Knowledges]

        if (skillId) {
          filteredKnowledges = filteredKnowledges.filter(
            (knowledge) => knowledge.skillId === skillId,
          )
        }

        // Фильтрация по IDs, если указаны
        if (ids?.length) {
          filteredKnowledges = filteredKnowledges.filter((knowledge) =>
            ids.includes(knowledge.id),
          )
        }

        if (!filteredKnowledges.length) {
          return 'Не найдено ни одного знания по указанным критериям'
        }

        let result = `Найдено ${filteredKnowledges.length} знаний`

        result += '\n\n' + JSON.stringify(filteredKnowledges, null, 2)

        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return JSON.stringify({ error: errorMessage }, null, 2)
      }
    }

    case toolName.getSkills: {
      const { ids } = args as {
        ids?: string[]
      }

      try {
        // Если ids не указаны, возвращаем все умения
        const filteredSkills = ids?.length
          ? skills.filter((skill) => ids.includes(skill.id))
          : skills

        if (!filteredSkills.length) {
          return 'Не найдено ни одного умения'
        }

        // else

        let result = `Найдено ${filteredSkills.length} умений`

        result += `\n\n ${JSON.stringify(filteredSkills, null, 2)}`

        return result
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return JSON.stringify({ error: errorMessage }, null, 2)
      }
    }

    case toolName.addKnowledge: {
      const {
        description,
        data,
        skillId,
        quality = 0.5,
      }: {
        description: string
        data: string
        skillId?: string
        quality?: number
      } = args

      try {
        // Проверка существования skillId, если он указан
        if (skillId && !skills.find((skill) => skill.id === skillId)) {
          throw new Error(`Навык с ID ${skillId} не найден`)
        }

        if (quality < 0) {
          throw new Error('Качество не должно быть ниже 0')
        }

        if (quality > 1) {
          throw new Error('Качество не должно быть выше 1')
        }

        // Создаем новое знание
        const knowledge: LowDbKnowledge = {
          id: generateId(),
          createdAt: new Date(),
          description,
          data,
          skillId,
          quality,
        }

        // Добавляем знание в массив знаний агента
        Knowledges.push(knowledge)

        // Сохраняем изменения в БД
        await lowDb.write()

        return `Знание успешно добавлено. ID: ${knowledge.id}`
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        await createMindLogEntry({
          ctx,
          userId: user.id,
          type: MindLogType.Error,
          data: `### Ошибка добавления знания

\`\`\`
${errorMessage}
\`\`\``,
          quality: 0.3,
        })

        return `Ошибка при добавлении знания: ${errorMessage}`
      }
    }

    case toolName.addSkill: {
      const {
        description,
        pattern,
        functionBody,
        functionArguments = [],
      }: {
        description: string
        pattern: string
        functionBody: string
        functionArguments: string[]
      } = args

      try {
        // Преобразуем строку шаблона в RegExp
        const regexPattern = new RegExp(pattern)

        // Создаем функцию из строки
        // eslint-disable-next-line no-new-func
        const fn = Function.apply(null, [
          ...functionArguments,
          functionBody,
        ]) as Skill['fn']

        const skill: Skill = {
          id: generateId(),
          createdAt: new Date(),
          description,
          query: regexPattern,
          fn,
        }

        // Добавляем новое знание в массив
        skills.push(skill)

        const knowledge: LowDbKnowledge = {
          id: generateId(),
          skillId: skill.id,
          description: skill.description,
          createdAt: skill.createdAt,
          data: undefined,
          quality: 0.5,
        }

        console.log('skills', user.Skills)

        Knowledges.push(knowledge)

        await lowDb.write()

        return `Знание успешно добавлено. ID: ${knowledge.id}`
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        await createMindLogEntry({
          ctx,
          userId: user.id,
          type: MindLogType.Error,
          data: `### Ошибка добавления знания

\`\`\`
${errorMessage}
\`\`\``,
          quality: 0.3,
        })

        return `Ошибка при добавлении знания: ${errorMessage}`
      }
    }

    case toolName.getUsers: {
      const { type, ids } = args as {
        type?: string
        ids?: string[]
      }

      try {
        // Получаем всех пользователей из БД
        let filteredUsers = lowDb.data.users

        // Фильтруем по типу, если указан
        if (type) {
          filteredUsers = filteredUsers.filter((user) => user.type === type)
        }

        // Фильтруем по ID, если указаны
        if (ids?.length) {
          filteredUsers = filteredUsers.filter((user) => ids.includes(user.id))
        }

        if (!filteredUsers.length) {
          return `Не найдено пользователей по указанным фильтрам`
        }

        // Формируем сокращенный вариант пользователя для вывода
        const summarizedUsers = filteredUsers.map((user) => ({
          id: user.id,
          name: user.name,
          type: user.type,
          createdAt: user.createdAt,
          messagesCount: user.Messages.length,
          mindLogsCount: user.MindLogs.length,
          skillsCount: user.Skills.length,
          knowledgesCount: user.Knowledges.length,
          experiencesCount: user.Experiences.length,
        }))

        return `Найдено ${summarizedUsers.length} пользователей

${JSON.stringify(summarizedUsers, null, 2)}`
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return `Ошибка при получении пользователей: ${errorMessage}`
      }
    }

    case toolName.getUserMessages: {
      const { userId } = args as {
        userId: string
      }

      try {
        // Получаем пользователя по ID
        const targetUser = getUser(userId, ctx.lowDb)

        if (!targetUser) {
          return `Пользователь с ID ${userId} не найден`
        }

        // Получаем сообщения пользователя
        const messages = targetUser.Messages

        if (!messages.length) {
          return `У пользователя с ID ${userId} нет сообщений`
        }

        return `Найдено ${messages.length} сообщений пользователя ${targetUser.name} (${targetUser.id})

${JSON.stringify(messages, null, 2)}`
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        return `Ошибка при получении сообщений пользователя: ${errorMessage}`
      }
    }

    case toolName.sendMessage: {
      const {
        userId,
        messageText,
      }: {
        userId: string
        messageText: string
      } = args

      // Получаем пользователя
      const targetUser = getUser(userId, ctx.lowDb)

      // if (!targetUser) {
      //   return {
      //     result: `Пользователь с ID ${userId} не найден`,
      //   }
      // }

      return await sendMessage({
        args: {
          text: messageText,
          fromUser: user,
          toUser: targetUser,
        },
        ctx,
      }).then((r) => r?.text)
    }

    default:
      if (Object.values<string>(MindLogType).includes(name)) {
        return `Ошибка вызова несуществующего тулза ${name}. Если вы хотели записать MindLog, то следует вызывать тулзу ${toolName.createMindLogEntry}`
      }

      return `Неизвестный инструмент: ${name}`
  }
}
