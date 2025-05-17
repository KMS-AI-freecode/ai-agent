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
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.finishProcessing,
  //     description: 'Завершает обработку раздражителя с итоговым результатом',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         result: {
  //           type: 'string',
  //           description: 'Итоговый результат обработки. Формат markdown',
  //         },
  //         quality: {
  //           type: 'number',
  //           description: 'Оценка качества результата от 0 до 1',
  //         },
  //       },
  //       required: ['result'],
  //     },
  //   },
  // },
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
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.updateSkill,
  //     description: 'Обновляет существующее знание',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         index: {
  //           type: 'integer',
  //           description: 'Индекс знания в массиве',
  //         },
  //         description: {
  //           type: 'string',
  //           description: 'Новое описание знания',
  //         },
  //         pattern: {
  //           type: 'string',
  //           description: 'Новое регулярное выражение для распознавания запроса',
  //         },
  //         functionBody: {
  //           type: 'string',
  //           description: 'Новое тело функции',
  //         },
  //       },
  //       required: ['index'],
  //     },
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.deleteSkill,
  //     description: 'Удаляет знание по индексу',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         index: {
  //           type: 'integer',
  //           description: 'Индекс знания в массиве',
  //         },
  //       },
  //       required: ['index'],
  //     },
  //   },
  // },
  {
    type: 'function',
    function: {
      name: toolName.getKnowledges,
      description:
        'Получает знания. Если не указаны идентификаторы, возвращает все доступные знания.',
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
        'Получает умения (скиллы). Если не указаны идентификаторы, возвращает все доступные умения.',
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
  // // Инструмент для работы с майндлогами
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.getAllMindLogs,
  //     description: 'Возвращает список майндлогов пользователя',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         userId: {
  //           type: 'string',
  //           description: 'ID пользователя',
  //         },
  //         limit: {
  //           type: 'integer',
  //           description: 'Максимальное количество логов для возврата',
  //         },
  //         offset: {
  //           type: 'integer',
  //           description: 'Смещение для пагинации',
  //         },
  //       },
  //       required: ['userId'],
  //     },
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.getMindLog,
  //     description: 'Получает один майндлог по ID',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         userId: {
  //           type: 'string',
  //           description: 'ID пользователя',
  //         },
  //         mindLogId: {
  //           type: 'string',
  //           description: 'ID майндлога',
  //         },
  //       },
  //       required: ['userId', 'mindLogId'],
  //     },
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.updateMindLog,
  //     description: 'Обновляет существующий майндлог',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         userId: {
  //           type: 'string',
  //           description: 'ID пользователя',
  //         },
  //         mindLogId: {
  //           type: 'string',
  //           description: 'ID майндлога',
  //         },
  //         data: {
  //           type: 'string',
  //           description: 'Новое содержание записи в формате markdown',
  //         },
  //         type: {
  //           type: 'string',
  //           enum: Object.keys(MindLogType),
  //           description: 'Новый тип записи',
  //         },
  //       },
  //       required: ['userId', 'mindLogId'],
  //     },
  //   },
  // },
  // {
  //   type: 'function',
  //   function: {
  //     name: toolName.deleteMindLog,
  //     description: 'Удаляет майндлог по ID',
  //     parameters: {
  //       type: 'object',
  //       properties: {
  //         userId: {
  //           type: 'string',
  //           description: 'ID пользователя',
  //         },
  //         mindLogId: {
  //           type: 'string',
  //           description: 'ID майндлога',
  //         },
  //       },
  //       required: ['userId', 'mindLogId'],
  //     },
  //   },
  // },
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
          // availableTools: {
          //   type: 'array',
          //   description: 'Массив доступных инструментов, которые можно использовать в сообщении',
          //   items: {
          //     type: 'object',
          //     properties: {
          //       type: {
          //         type: 'string',
          //         enum: ['function']
          //       },
          //       function: {
          //         type: 'object',
          //         properties: {
          //           name: {
          //             type: 'string',
          //             enum: Object.values(toolName)
          //           },
          //           description: {
          //             type: 'string'
          //           },
          //           parameters: {
          //             type: 'object'
          //           }
          //         },
          //         required: ['name', 'description', 'parameters']
          //       }
          //     },
          //     required: ['type', 'function']
          //   }
          // },
        },
        /**
         * Пока делаю только текстовое сообщение, но потом доделаю возможность передачи тулзов
         */
        required: ['userId', 'messageText'],
      },
    },
  },
]
