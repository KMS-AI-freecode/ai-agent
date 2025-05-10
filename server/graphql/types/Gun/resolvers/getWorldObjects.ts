import { WorldObject } from '../../../../world/interfaces'
import { ApolloContext } from '../../../context'
import { GunInstance } from '../../../../world/interfaces'
import { GraphQLFieldResolver } from 'graphql'

/**
 * Функция получения данных из Gun.js
 */
const fetchGunWorldObjects = (
  gun: GunInstance,
): Promise<Array<WorldObject | null>> => {
  return new Promise<Array<WorldObject | null>>((resolve) => {
    const worldObjects: Array<WorldObject | null> = []

    // Используем Gun map для обхода всех объектов в мире
    gun
      .get('world')
      .map()
      .once((data, _id: string) => {
        worldObjects.push(data as WorldObject | null)
      })

    // Ждем небольшую задержку для сбора всех данных
    setTimeout(() => {
      resolve(worldObjects)
    }, 300)
  })
}

/**
 * Резолвер для получения всех объектов из мира Gun.js
 */
export const getWorldObjectsResolver: GraphQLFieldResolver<
  'Query',
  ApolloContext,
  unknown,
  Promise<WorldObject[]>
> = async (_parent, _args, { worldManager }) => {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('Access denied')
  }

  // Максимальное количество попыток
  const MAX_ATTEMPTS = 5
  const gun = worldManager.getGun()

  // Функция для получения данных с повторными попытками
  const fetchDataWithRetries = async (attempts = 0): Promise<WorldObject[]> => {
    // Получаем данные
    const data = await fetchGunWorldObjects(gun)

    if (!data.length) {
      return []
    }

    // Проверяем полноту данных
    const lastItem = data[data.length - 1]

    // Если последний элемент null или массив пуст, то данные неполные

    // Если данные неполные и не превышен лимит попыток
    if (lastItem === null) {
      if (attempts >= MAX_ATTEMPTS - 1) {
        throw new Error('Достигнуто максимальное количество попыток')
      }

      // Ждем немного перед следующей попыткой
      await new Promise((resolve) => setTimeout(resolve, 200))

      // Рекурсивно пытаемся снова
      return fetchDataWithRetries(attempts + 1)
    }

    // Удаляем нулевые элементы из массива
    return data.filter((item) => item !== null)
  }

  // Запускаем получение данных с повторными попытками
  const result = await fetchDataWithRetries()

  return result
}
