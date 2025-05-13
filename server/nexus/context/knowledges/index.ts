/* eslint-disable no-console */
import fs from 'fs'
import path from 'path'

// Типы для знаний
export type Knowledge = {
  description: string
  query: RegExp
  fn: (...args: string[]) => string
}

// Интерфейс для сериализованного представления знаний
interface SerializedKnowledge {
  description: string
  query: {
    source: string
    flags: string
  }
  fn: string
}

// Путь к файлу для сохранения/загрузки знаний
const knowledgesFilePath = path.resolve(process.cwd(), 'data/knowledges.json')

// Начальное значение знаний
const initialKnowledges: Knowledge[] = []

// Функция для сериализации знаний в формат JSON
const serializeKnowledges = (
  knowledges: Knowledge[],
): SerializedKnowledge[] => {
  return knowledges.map((knowledge) => ({
    description: knowledge.description,
    query: {
      source: knowledge.query.source,
      flags: knowledge.query.flags,
    },
    fn: knowledge.fn.toString(),
  }))
}

// Функция для десериализации знаний из JSON
const deserializeKnowledges = (
  serializedKnowledges: SerializedKnowledge[],
): Knowledge[] => {
  return serializedKnowledges.map((serialized) => ({
    description: serialized.description,
    query: new RegExp(serialized.query.source, serialized.query.flags),
    fn: eval(`(${serialized.fn})`) as (...args: string[]) => string,
  }))
}

// Функция для сохранения знаний в файл
const saveKnowledges = (knowledges: Knowledge[]): void => {
  try {
    // Создаем директорию, если её нет
    const dirPath = path.dirname(knowledgesFilePath)
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true })
    }

    // Сериализуем знания
    const serialized = serializeKnowledges(knowledges)

    // Записываем в файл в режиме w+ (перезапись или создание)
    fs.writeFileSync(knowledgesFilePath, JSON.stringify(serialized, null, 2))
    console.log('Knowledges saved successfully')
  } catch (error) {
    console.error('Error saving knowledges:', error)
  }
}

// Функция для загрузки знаний из файла
const loadKnowledges = (): Knowledge[] => {
  try {
    if (fs.existsSync(knowledgesFilePath)) {
      const fileContent = fs.readFileSync(knowledgesFilePath, 'utf-8')
      const serialized = JSON.parse(fileContent) as SerializedKnowledge[]
      return deserializeKnowledges(serialized)
    }
  } catch (error) {
    console.error('Error loading knowledges:', error)
  }

  // Если файл не существует или произошла ошибка, возвращаем начальные знания и создаем файл
  console.log('Using initial knowledges and creating file')
  // Создаем файл с начальными знаниями
  saveKnowledges(initialKnowledges)
  return initialKnowledges
}

// Создаем прокси для автоматического сохранения при изменениях
const createKnowledgesProxy = (knowledgesArray: Knowledge[]): Knowledge[] => {
  return new Proxy(knowledgesArray, {
    set(target, property, value) {
      const result = Reflect.set(target, property, value)
      // Сохраняем только если изменилось числовое свойство (индекс массива)
      if (typeof property === 'string' && !isNaN(parseInt(property))) {
        saveKnowledges(target)
      }
      return result
    },
    deleteProperty(target, property) {
      const result = Reflect.deleteProperty(target, property)
      saveKnowledges(target)
      return result
    },
  })
}

// Загружаем знания и создаем прокси
export const knowledges: Knowledge[] = createKnowledgesProxy(loadKnowledges())
