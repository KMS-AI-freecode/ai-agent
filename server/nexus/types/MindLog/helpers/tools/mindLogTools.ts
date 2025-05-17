import { ChatCompletionTool } from 'openai/resources/chat'
import { MindLogType } from '../../interfaces'
import { toolName } from './interfaces'

/**
 * Определение инструментов для OpenAI
 */
export const mindLogTools: ChatCompletionTool[] = [
  // Инструмент для получения списка пользователей
  {
    type: 'function',
    function: {
      name: toolName.getUsers,
      description: 'Получает список пользователей системы',
      parameters: {
        type: 'object',
        properties: {
          type: {
            type: 'string',
            description:
              'Тип пользователя для фильтрации (возможные значения: "User", "Agent")',
          },
          ids: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'Список идентификаторов пользователей. Если не указано, будут возвращены все пользователи.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.createMindLogEntry,
      description:
        'Создает запись в лог мышления (MindLog) с определенным типом MindLogType и содержанием',
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
  {
    type: 'function',
    function: {
      name: toolName.addSkill,
      description: 'Добавляет новое умение',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Описание умения',
          },
          pattern: {
            type: 'string',
            description:
              'Регулярное выражение для распознавания запроса (строка, которая будет преобразована в RegExp через new RegExp(pattern)). Не должен быть чувствительным к регистру и учитывать строку целиком',
          },
          functionArguments: {
            type: 'array',
            description: 'Массив аргументов, передаваемых в функцию',
            items: {
              type: 'string',
            },
          },
          functionBody: {
            type: 'string',
            description:
              'Тело функции в виде строки. Функция должна принимать аргументы, соответствующие группам регулярного выражения. Функция должна возвращать строку. Будет присвоена через fn = Function.apply(null, [...functionArguments,functionBody,])',
          },
        },
        required: ['description', 'pattern', 'functionBody'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.addKnowledge,
      description:
        'Добавляет новое знание. Это может быть справочное знание (например, какая-то дата), или знание какое умение применить, или знание о каких-то пользователях и т.п. В общем, все то, что полезно запомнить',
      parameters: {
        type: 'object',
        properties: {
          description: {
            type: 'string',
            description: 'Описание знания',
          },
          data: {
            type: 'string',
            data: 'Знание',
          },
          skillId: {
            type: 'string',
            data: 'Если знание касается какого-то умения, указываем его id',
          },
          quality: {
            type: 'number',
            description: 'Качество знания от 0.0 до 1.0',
          },
        },
        required: ['description', 'data'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.getKnowledges,
      description:
        'Получает Знания (Knowledges). Если не указаны идентификаторы, возвращает все доступные знания. Знания очень полезны и могут дополнительно использоваться для поиска какой-то полезной информации. Если не получается что-то найти с помощью другого инструмента, имеет смысл заглянуть в знания, может там найдется подсказка.',
      parameters: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'Список идентификаторов знаний для получения. Если не указано, будут возвращены все знания.',
          },
          skillId: {
            type: 'string',
            description:
              'Идентификатор умения, для фильтрации знаний по конкретному умению.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.getSkills,
      description:
        'Получает Умения, Скилы (Skills). Если не указаны идентификаторы, возвращает все доступные умения.',
      parameters: {
        type: 'object',
        properties: {
          ids: {
            type: 'array',
            items: {
              type: 'string',
            },
            description:
              'Список идентификаторов умений для получения. Если не указано, будут возвращены все умения.',
          },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: toolName.sendMessage,
      description:
        'Отправить сообщение пользователю. Может быть использован в том числе для запроса отправики сообщения себе же, к примеру, чтобы получить результаты выполнения телзов. А можно попросить переслать какому-то пользователь результат',
      parameters: {
        type: 'object',
        properties: {
          userId: {
            type: 'string',
            description:
              'ID пользователя. Это именно UUID, а не имя или что-то такое',
          },
          messageText: {
            type: 'string',
            description: 'Текст сообщения',
          },
        },
        /**
         * Пока делаю только текстовое сообщение, но потом доделаю возможность передачи тулзов
         */
        required: ['userId', 'messageText'],
      },
    },
  },
]
