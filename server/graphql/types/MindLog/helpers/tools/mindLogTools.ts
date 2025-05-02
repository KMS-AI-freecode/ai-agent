import { ChatCompletionTool } from 'openai/resources/chat'
import { MindLogType } from '../../interfaces'
import { toolName } from './interfaces'

/**
 * Определение инструментов для OpenAI
 */
export const mindLogTools: ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: toolName.createMindLogEntry,
      description:
        'Создает запись в лог мышления (MindLog) с определенным типом и содержанием',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            enum: Object.keys(MindLogType),
            description: 'Тип записи в лог мышления',
          },
          data: {
            type: 'string',
            description: 'Содержание записи в лог мышления. Формат markdown',
          },
          quality: {
            type: 'number',
            description: 'Оценка качества мысли/действия/результата от 0 до 1',
          },
        },
        required: ['type', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.finishProcessing,
      description: 'Завершает обработку раздражителя с итоговым результатом',
      parameters: {
        type: 'object',
        properties: {
          result: {
            type: 'string',
            description: 'Итоговый результат обработки. Формат markdown',
          },
          quality: {
            type: 'number',
            description: 'Оценка качества результата от 0 до 1',
          },
        },
        required: ['result'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.getSystemConfig,
      description: 'Возвращает конфигурацию системы и рабочего окружения',
      parameters: {
        type: 'object',
        properties: {},
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.execCommand,
      description: 'Выполняет команду в системе и возвращает вывод',
      parameters: {
        type: 'object',
        properties: {
          command: {
            type: 'string',
            description: 'Команда для выполнения в системе',
          },
        },
        required: ['command'],
      },
    },
  },
]
