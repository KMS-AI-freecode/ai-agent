/* eslint-disable no-console */
// import fs from 'fs'
// import path from 'path'

import { LowDbUser } from '../../../lowdb/interfaces'
import { generateId } from '../../../utils/id'

// Типы для знаний
export type Skill = {
  id: string
  description: string
  query: RegExp
  createdAt: Date
  // eslint-disable-next-line @typescript-eslint/ban-types
  fn: (...args: string[]) => string
}

// Интерфейс для сериализованного представления знаний
export interface SerializedSkill {
  description: string
  query: {
    source: string
    flags: string
  }
  fn: string
}

// Путь к файлу для сохранения/загрузки знаний
// const skillsFilePath = path.resolve(process.cwd(), 'data/skills.json')

// Начальное значение знаний
// const initialSkills: Skill[] = []

// Функция для сериализации знаний в формат JSON
export const serializeSkills = (skills: Skill[]): SerializedSkill[] => {
  return skills.map((skill) => ({
    ...skill,
    description: skill.description,
    query: {
      source: skill.query.source,
      flags: skill.query.flags,
    },
    fn: skill.fn.toString(),
  }))
}

export function prepareSkillsSerializer(skills: Skill[]): LowDbUser['Skills'] {
  // @ts-expect-error types
  skills.toJSON = function () {
    return JSON.stringify(serializeSkills(this))
  }
  return skills as LowDbUser['Skills']
}

// Функция для десериализации знаний из JSON
export const deserializeSkills = (
  serializedSkills: SerializedSkill[],
): LowDbUser['Skills'] => {
  return prepareSkillsSerializer(
    serializedSkills.map((serialized) => ({
      id: generateId(),
      createdAt: new Date(),
      description: serialized.description,
      query: new RegExp(serialized.query.source, serialized.query.flags),
      fn: eval(`(${serialized.fn})`) as (...args: string[]) => string,
    })),
  )
}

// Функция для сохранения знаний в файл
// const saveSkills = (skills: Skill[]): void => {
//   try {
//     // Создаем директорию, если её нет
//     const dirPath = path.dirname(skillsFilePath)
//     if (!fs.existsSync(dirPath)) {
//       fs.mkdirSync(dirPath, { recursive: true })
//     }

//     // Сериализуем знания
//     const serialized = serializeSkills(skills)

//     // Записываем в файл в режиме w+ (перезапись или создание)
//     fs.writeFileSync(skillsFilePath, JSON.stringify(serialized, null, 2))
//     console.log('Skills saved successfully')
//   } catch (error) {
//     console.error('Error saving skills:', error)
//   }
// }

// Функция для загрузки знаний из файла
// export const loadSkills = (): Skill[] => {
//   try {
//     if (fs.existsSync(skillsFilePath)) {
//       const fileContent = fs.readFileSync(skillsFilePath, 'utf-8')
//       const serialized = JSON.parse(fileContent) as SerializedSkill[]
//       return deserializeSkills(serialized)
//     }
//   } catch (error) {
//     console.error('Error loading skills:', error)
//   }

//   // Если файл не существует или произошла ошибка, возвращаем начальные знания и создаем файл
//   console.log('Using initial skills and creating file')
//   // Создаем файл с начальными знаниями
//   saveSkills(initialSkills)
//   return initialSkills
// }

// Создаем прокси для автоматического сохранения при изменениях
// export const createSkillsProxy = (skillsArray: Skill[]): Skill[] => {
//   return new Proxy(skillsArray, {
//     set(target, property, value) {
//       const result = Reflect.set(target, property, value)
//       // Сохраняем только если изменилось числовое свойство (индекс массива)
//       if (typeof property === 'string' && !isNaN(parseInt(property))) {
//         saveSkills(target)
//       }
//       return result
//     },
//     deleteProperty(target, property) {
//       const result = Reflect.deleteProperty(target, property)
//       saveSkills(target)
//       return result
//     },
//   })
// }

// Загружаем знания и создаем прокси
// export const skills: Skill[] = createSkillsProxy(loadSkills())
