/* eslint-disable no-console */
// import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { createMindLogEntry } from '../createMindLog'
import { exec } from 'child_process'
import * as os from 'os'
import { MindLogType } from '../../interfaces'
import { toolName } from './interfaces'
import { ApolloContext } from '../../../../../nexus/context'
import {
  LowDbKnowledge,
  LowDbMessage,
  LowDbUser,
} from '../../../../../lowdb/interfaces'
import { Skill } from '../../../../context/skills'
import { generateId } from '../../../../../utils/id'
import { getUser } from '../../../../../lowdb/helpers'
import { sendMessage } from '../../../Message/resolvers/helpers/sendMessage'
// import { getUser } from '../../../../../lowdb/helpers'

/**
 * Обработчик вызовов инструментов
 */

type handleToolCallProps = {
  ctx: ApolloContext
  // agentId: string
  user: LowDbUser
  toolCall: ToolCall
  // _messages: ChatCompletionMessageParam[],
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

  const message: LowDbMessage = {
    id: generateId(),
    text: `Вызови тулзу "${name}" с такими аргументами: ${argsString}`,
    createdAt: new Date(),
    userId: user.id,
  }

  user.Messages.push(message)

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

    // case toolName.finishProcessing: {
    //   const { result, quality = 0.9 }: { result: string; quality: number } =
    //     args
    //   // Создаем итоговую запись
    //   await createMindLogEntry(
    //     ctx,
    //     agentId,
    //     MindLogType.Result,
    //     result,
    //     quality,
    //   )

    //   return {
    //     result,
    //     finished: true,
    //   }
    // }

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

      // await createMindLogEntry({
      //   ctx,
      //   agentId,
      //   type: MindLogType.Progress,
      //   data: result,
      //   quality: 0.7,
      // })

      return result
    }

    case toolName.execCommand: {
      const { command } = args

      // await createMindLogEntry({
      //   ctx,
      //   agentId,
      //   type: MindLogType.Action,
      //   data: `### Выполнение команды

      // \`\`\`bash
      // ${command}
      // \`\`\``,
      //   quality: 0.7,
      // })

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

        // await createMindLogEntry({
        //   ctx,
        //   agentId,
        //   type: MindLogType.Progress,
        //   data: `### Результат выполнения команды

        // \`\`\`
        // ${output}
        // \`\`\``,
        //   quality: 0.8,
        // })

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

    //     case toolName.updateSkill: {
    //       const { index, description, pattern, functionBody } = args

    //       if (index < 0 || index >= skills.length) {
    //         return {
    //           result: `Ошибка: Знание с индексом ${index} не найдено`,
    //         }
    //       }

    //       try {
    //         // Обновляем поля знания, если они были предоставлены
    //         if (description) {
    //           skills[index].description = description
    //         }

    //         if (pattern) {
    //           skills[index].query = new RegExp(pattern)
    //         }

    //         if (functionBody) {
    //           // eslint-disable-next-line no-new-func
    //           skills[index].fn = new Function(functionBody)()
    //         }

    //         return {
    //           result: `Знание с индексом ${index} успешно обновлено`,
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           ctx,
    //           userId: user.id,
    //           type: MindLogType.Error,
    //           data: `### Ошибка обновления знания

    // \`\`\`
    // ${errorMessage}
    // \`\`\``,
    //           quality: 0.3,
    //         })

    //         return {
    //           result: `Ошибка при обновлении знания: ${errorMessage}`,
    //         }
    //       }
    //     }

    //     case toolName.deleteSkill: {
    //       const { index } = args

    //       if (index < 0 || index >= skills.length) {
    //         return {
    //           result: `Ошибка: Знание с индексом ${index} не найдено`,
    //         }
    //       }

    //       // Удаляем знание из массива
    //       skills.splice(index, 1)

    //       return {
    //         result: `Знание с индексом ${index} успешно удалено`,
    //       }
    //     }

    //     // Инструменты для работы с майндлогами
    //     case toolName.getAllMindLogs: {
    //       const { userId, limit = 100, offset = 0 } = args

    //       try {
    //         // Получаем пользователя
    //         const targetUser = getUser(userId, ctx)

    //         if (!targetUser) {
    //           return {
    //             result: `Пользователь с ID ${userId} не найден`,
    //           }
    //         }

    //         // Получаем логи майндлогов пользователя, отсортированные по дате создания (от новых к старым)
    //         const mindLogs = [...targetUser.MindLogs]
    //           .sort((a, b) => {
    //             const dateA = new Date(a.createdAt).getTime()
    //             const dateB = new Date(b.createdAt).getTime()
    //             return dateB - dateA
    //           })
    //           .slice(offset, offset + limit)

    //         return {
    //           result: JSON.stringify(mindLogs, null, 2),
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           ctx,
    //           userId: user.id,
    //           type: MindLogType.Error,
    //           data: `### Ошибка получения майндлогов

    // \`\`\`
    // ${errorMessage}
    // \`\`\``,
    //           quality: 0.3,
    //         })

    //         return {
    //           result: `Ошибка при получении майндлогов: ${errorMessage}`,
    //         }
    //       }
    //     }

    //     case toolName.getMindLog: {
    //       const { userId, mindLogId } = args

    //       try {
    //         // Получаем пользователя
    //         const targetUser = getUser(userId, ctx)

    //         if (!targetUser) {
    //           return {
    //             result: `Пользователь с ID ${userId} не найден`,
    //           }
    //         }

    //         // Ищем майндлог по ID
    //         const mindLog = targetUser.MindLogs.find((log) => log.id === mindLogId)

    //         if (!mindLog) {
    //           return {
    //             result: `Майндлог с ID ${mindLogId} не найден`,
    //           }
    //         }

    //         return {
    //           result: JSON.stringify(mindLog, null, 2),
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           ctx,
    //           userId: user.id,
    //           type: MindLogType.Error,
    //           data: `### Ошибка получения майндлога

    // \`\`\`
    // ${errorMessage}
    // \`\`\``,
    //           quality: 0.3,
    //         })

    //         return {
    //           result: `Ошибка при получении майндлога: ${errorMessage}`,
    //         }
    //       }
    //     }

    //     case toolName.updateMindLog: {
    //       const { userId, mindLogId, data: newData, type: newType } = args

    //       try {
    //         // Получаем пользователя
    //         const targetUser = getUser(userId, ctx)

    //         if (!targetUser) {
    //           return {
    //             result: `Пользователь с ID ${userId} не найден`,
    //           }
    //         }

    //         // Ищем индекс майндлога по ID
    //         const mindLogIndex = targetUser.MindLogs.findIndex(
    //           (log) => log.id === mindLogId,
    //         )

    //         if (mindLogIndex === -1) {
    //           return {
    //             result: `Майндлог с ID ${mindLogId} не найден`,
    //           }
    //         }

    //         // Обновляем данные майндлога
    //         if (newData) {
    //           targetUser.MindLogs[mindLogIndex].data = newData
    //         }

    //         if (newType) {
    //           targetUser.MindLogs[mindLogIndex].type = newType as MindLogType
    //         }

    //         // Обновляем дату обновления
    //         targetUser.MindLogs[mindLogIndex].updatedAt = new Date()

    //         return {
    //           result: `Майндлог с ID ${mindLogId} успешно обновлен`,
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           ctx,
    //           userId: user.id,
    //           type: MindLogType.Error,
    //           data: `### Ошибка обновления майндлога

    // \`\`\`
    // ${errorMessage}
    // \`\`\``,
    //           quality: 0.3,
    //         })

    //         return {
    //           result: `Ошибка при обновлении майндлога: ${errorMessage}`,
    //         }
    //       }
    //     }

    //     case toolName.deleteMindLog: {
    //       const { userId, mindLogId } = args

    //       try {
    //         // Получаем пользователя
    //         const targetUser = getUser(userId, ctx)

    //         if (!targetUser) {
    //           return {
    //             result: `Пользователь с ID ${userId} не найден`,
    //           }
    //         }

    //         // Ищем индекс майндлога по ID
    //         const mindLogIndex = targetUser.MindLogs.findIndex(
    //           (log) => log.id === mindLogId,
    //         )

    //         if (mindLogIndex === -1) {
    //           return {
    //             result: `Майндлог с ID ${mindLogId} не найден`,
    //           }
    //         }

    //         // Удаляем майндлог
    //         targetUser.MindLogs.splice(mindLogIndex, 1)

    //         return {
    //           result: `Майндлог с ID ${mindLogId} успешно удален`,
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           ctx,
    //           userId: user.id,
    //           type: MindLogType.Error,
    //           data: `### Ошибка удаления майндлога

    // \`\`\`
    // ${errorMessage}
    // \`\`\``,
    //           quality: 0.3,
    //         })

    //         return {
    //           result: `Ошибка при удалении майндлога: ${errorMessage}`,
    //         }
    //       }
    //     }

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
