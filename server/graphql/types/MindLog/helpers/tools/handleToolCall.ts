/* eslint-disable no-console */
import { ChatCompletionMessageParam } from 'openai/resources/chat'
import { ToolCall } from '../interfaces'
import { createMindLogEntry } from '../createMindLog'
import { exec } from 'child_process'
import * as os from 'os'
import { MindLogType } from '../../interfaces'
import { ApolloContext } from '../../../../context'

/**
 * Обработчик вызовов инструментов
 */
export async function handleToolCall(
  context: ApolloContext,
  agentId: string,
  toolCall: ToolCall,
  _messages: ChatCompletionMessageParam[],
): Promise<{
  result: Record<string, unknown>
  finished?: boolean
  finalResult?: string
}> {
  const { name, arguments: argsString } = toolCall.function
  const args = JSON.parse(argsString)

  // Логируем вызов инструмента с аргументами
  console.log(`Tool Call: ${name}`, args)
  await createMindLogEntry(
    context,
    agentId,
    MindLogType.Progress,
    `Вызов инструмента: ${name}, аргументы: ${argsString}`,
    0.5,
  )

  switch (name) {
    case 'createMindLogEntry': {
      const { type, data, quality } = args
      const entry = await createMindLogEntry(
        context,
        agentId,
        type as MindLogType,
        data,
        quality,
      )
      return { result: { success: true, entryId: entry.id } }
    }

    case 'getAvailableModels': {
      try {
        const modelsResponse = await context.openai.models.list()
        const models = modelsResponse.data.map((model) => model.id)
        return { result: { models } }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // Логируем ошибку
        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `Ошибка при получении списка моделей: ${errorMessage}`,
          0.1,
        )
        return { result: { error: errorMessage } }
      }
    }

    case 'askModel': {
      const { model, question } = args
      try {
        // Логируем запрос
        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `Отправляю запрос модели ${model}: "${question}"`,
          0.5,
        )

        // Отправляем запрос модели
        const completion = await context.openai.chat.completions.create({
          model,
          messages: [
            {
              role: 'user',
              content: question,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        })

        const response = completion.choices[0]?.message?.content || ''

        // Логируем успешный ответ
        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `Получен ответ от модели ${model}: "${response}"`,
          0.8,
        )

        return { result: { response } }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error)
        // Логируем ошибку
        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `Ошибка при запросе к модели ${model}: ${errorMessage}`,
          0.2,
        )
        return { result: { error: errorMessage } }
      }
    }

    case 'finishProcessing': {
      const { result, quality = 0.9 } = args
      // Создаем итоговую запись
      await createMindLogEntry(
        context,
        agentId,
        MindLogType.Result,
        result,
        quality,
      )
      return {
        result: { finished: true, result },
        finished: true,
        finalResult: result,
      }
    }

    case 'getSystemConfig': {
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

      await createMindLogEntry(
        context,
        agentId,
        MindLogType.Progress,
        `### Получена системная конфигурация\n\n\`\`\`json\n${JSON.stringify(
          config,
          null,
          2,
        )}\n\`\`\``,
        0.7,
      )

      return { result: config }
    }

    case 'execCommand': {
      const { command } = args

      await createMindLogEntry(
        context,
        agentId,
        MindLogType.Action,
        `### Выполнение команды\n\n\`\`\`bash\n${command}\n\`\`\``,
        0.7,
      )

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

        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `### Результат выполнения команды\n\n\`\`\`\n${output}\n\`\`\``,
          0.8,
        )

        return { result: { output } }
      } catch (error) {
        const errorOutput = String(error)

        await createMindLogEntry(
          context,
          agentId,
          MindLogType.Progress,
          `### Ошибка выполнения команды\n\n\`\`\`\n${errorOutput}\n\`\`\``,
          0.3,
        )

        return { result: { error: errorOutput } }
      }
    }

    default:
      return { result: { error: `Неизвестный инструмент: ${name}` } }
  }
}
