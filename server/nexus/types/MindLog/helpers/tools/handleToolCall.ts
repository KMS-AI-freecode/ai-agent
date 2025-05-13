/* eslint-disable no-console */
// import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { createMindLogEntry } from '../createMindLog'
import { exec } from 'child_process'
import * as os from 'os'
import { MindLogType } from '../../interfaces'
import { toolName } from './interfaces'
import { ApolloContext } from '../../../../../nexus/context'
import { LowDbUser } from '../../../../../lowdb/interfaces'
import { Knowledge, knowledges } from '../../../../context/knowledges'
// import { getUser } from '../../../../../lowdb/helpers'

/**
 * Обработчик вызовов инструментов
 */

type handleToolCallProps = {
  context: ApolloContext
  // agentId: string
  user: LowDbUser
  toolCall: ToolCall
  // _messages: ChatCompletionMessageParam[],
}

export async function handleToolCall({
  // agentId,
  user,
  context,
  toolCall,
}: handleToolCallProps): Promise<{
  result: string
  // finished?: boolean
}> {
  const { name, arguments: argsString } = toolCall.function
  const args = JSON.parse(argsString)

  // Логируем вызов инструмента с аргументами
  console.log(`Tool Call: ${name}`, args)
  await createMindLogEntry({
    context,
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
        context,
        userId: user.id,
        type: type as MindLogType,
        data,
        quality,
      })
      return { result: `Создана запись с id "${entry.id}"` }
    }

    // case toolName.finishProcessing: {
    //   const { result, quality = 0.9 }: { result: string; quality: number } =
    //     args
    //   // Создаем итоговую запись
    //   await createMindLogEntry(
    //     context,
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
      //   context,
      //   agentId,
      //   type: MindLogType.Progress,
      //   data: result,
      //   quality: 0.7,
      // })

      return { result }
    }

    case toolName.execCommand: {
      const { command } = args

      // await createMindLogEntry({
      //   context,
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
        //   context,
        //   agentId,
        //   type: MindLogType.Progress,
        //   data: `### Результат выполнения команды

        // \`\`\`
        // ${output}
        // \`\`\``,
        //   quality: 0.8,
        // })

        return { result: output }
      } catch (error) {
        const errorOutput = String(error)

        await createMindLogEntry({
          context,
          userId: user.id,
          type: MindLogType.Error,
          data: `### Ошибка выполнения команды

\`\`\`
${errorOutput}
\`\`\``,
          quality: 0.3,
        })

        return { result: `Возникла ошибка: ${errorOutput}` }
      }
    }

    // Инструменты для работы со знаниями
    case toolName.getAllKnowledges: {
      // Формируем список знаний в удобном для вывода формате
      const knowledgeList = knowledges.map((knowledge, index) => ({
        index,
        description: knowledge.description,
        pattern: knowledge.query.toString(),
        functionBody: knowledge.fn.toString(),
      }))

      return {
        result: JSON.stringify(knowledgeList, null, 2),
      }
    }

    // case toolName.getKnowledge: {
    //   const { index } = args

    //   if (index < 0 || index >= knowledges.length) {
    //     return {
    //       result: `Ошибка: Знание с индексом ${index} не найдено`,
    //     }
    //   }

    //   // Получаем знание по индексу и форматируем его для вывода
    //   const knowledge = knowledges[index]
    //   const knowledgeInfo = {
    //     index,
    //     description: knowledge.description,
    //     pattern: knowledge.query.toString(),
    //     functionBody: knowledge.fn.toString(),
    //   }

    //   return {
    //     result: JSON.stringify(knowledgeInfo, null, 2),
    //   }
    // }

    case toolName.addKnowledge: {
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
        ]) as Knowledge['fn']

        // Добавляем новое знание в массив
        knowledges.push({
          description,
          query: regexPattern,
          fn,
        })

        return {
          result: `Знание успешно добавлено. Текущий индекс: ${knowledges.length - 1}`,
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        await createMindLogEntry({
          context,
          userId: user.id,
          type: MindLogType.Error,
          data: `### Ошибка добавления знания

\`\`\`
${errorMessage}
\`\`\``,
          quality: 0.3,
        })

        return {
          result: `Ошибка при добавлении знания: ${errorMessage}`,
        }
      }
    }

    //     case toolName.updateKnowledge: {
    //       const { index, description, pattern, functionBody } = args

    //       if (index < 0 || index >= knowledges.length) {
    //         return {
    //           result: `Ошибка: Знание с индексом ${index} не найдено`,
    //         }
    //       }

    //       try {
    //         // Обновляем поля знания, если они были предоставлены
    //         if (description) {
    //           knowledges[index].description = description
    //         }

    //         if (pattern) {
    //           knowledges[index].query = new RegExp(pattern)
    //         }

    //         if (functionBody) {
    //           // eslint-disable-next-line no-new-func
    //           knowledges[index].fn = new Function(functionBody)()
    //         }

    //         return {
    //           result: `Знание с индексом ${index} успешно обновлено`,
    //         }
    //       } catch (error) {
    //         const errorMessage =
    //           error instanceof Error ? error.message : String(error)
    //         await createMindLogEntry({
    //           context,
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

    //     case toolName.deleteKnowledge: {
    //       const { index } = args

    //       if (index < 0 || index >= knowledges.length) {
    //         return {
    //           result: `Ошибка: Знание с индексом ${index} не найдено`,
    //         }
    //       }

    //       // Удаляем знание из массива
    //       knowledges.splice(index, 1)

    //       return {
    //         result: `Знание с индексом ${index} успешно удалено`,
    //       }
    //     }

    //     // Инструменты для работы с майндлогами
    //     case toolName.getAllMindLogs: {
    //       const { userId, limit = 100, offset = 0 } = args

    //       try {
    //         // Получаем пользователя
    //         const targetUser = getUser(userId, context)

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
    //           context,
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
    //         const targetUser = getUser(userId, context)

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
    //           context,
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
    //         const targetUser = getUser(userId, context)

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
    //           context,
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
    //         const targetUser = getUser(userId, context)

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
    //           context,
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

    default:
      if (Object.values<string>(MindLogType).includes(name)) {
        return {
          result: `Ошибка вызова несуществующего тулза ${name}. Если вы хотели записать MindLog, то следует вызывать тулзу ${toolName.createMindLogEntry}`,
        }
      }

      return { result: `Неизвестный инструмент: ${name}` }
  }
}
