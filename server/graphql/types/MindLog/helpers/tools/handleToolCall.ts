/* eslint-disable no-console */
// import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { createMindLogEntry } from '../createMindLog'
import { exec } from 'child_process'
import * as os from 'os'
import { MindLogType } from '../../interfaces'
import { ApolloContext } from '../../../../context'
import { toolName } from './interfaces'

/**
 * Обработчик вызовов инструментов
 */

type handleToolCallProps = {
  context: ApolloContext
  agentId: string
  toolCall: ToolCall
  // _messages: ChatCompletionMessageParam[],
}

export async function handleToolCall({
  agentId,
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
    agentId,
    type: MindLogType.Progress,
    data: `Вызов инструмента: ${name}, аргументы: ${argsString}`,
    quality: 0.5,
  })

  switch (name) {
    case toolName.createMindLogEntry: {
      const { type, data, quality } = args
      const entry = await createMindLogEntry({
        context,
        agentId,
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

      const result = `### Получена системная конфигурация\n\n\`\`\`json\n${JSON.stringify(
        config,
        null,
        2,
      )}\n\`\`\``

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
      //   data: `### Выполнение команды\n\n\`\`\`bash\n${command}\n\`\`\``,
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
        //   data: `### Результат выполнения команды\n\n\`\`\`\n${output}\n\`\`\``,
        //   quality: 0.8,
        // })

        return { result: output }
      } catch (error) {
        const errorOutput = String(error)

        await createMindLogEntry({
          context,
          agentId,
          type: MindLogType.Error,
          data: `### Ошибка выполнения команды\n\n\`\`\`\n${errorOutput}\n\`\`\``,
          quality: 0.3,
        })

        return { result: `Возникла ошибка: ${errorOutput}` }
      }
    }

    default:
      if (Object.values<string>(MindLogType).includes(name)) {
        return {
          result: `Ошибка вызова несуществующего тулза ${name}. Если вы хотели записать MindLog, то следует вызывать тулзу ${toolName.createMindLogEntry}`,
        }
      }

      return { result: `Неизвестный инструмент: ${name}` }
  }
}
