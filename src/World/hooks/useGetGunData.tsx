import { useEffect, useRef, useState } from 'react'
import { useWorldContext } from '../Context'
// import { Connection, WorldObject } from '../interfaces'
// import Gun, { IGunInstance } from 'gun'

export function useGetGunData() {
  const { gun, objects, dispatch } = useWorldContext()

  // const [objects] = useState<WorldObject[]>([])
  // const [connections, setConnections] = useState<Connection[]>([])
  // const gunRef = useRef<IGunInstance | null>(null)

  // console.log('useGetGunData recall')

  useEffect(() => {
    // // Инициализируем Gun.js
    // const gun = Gun({
    //   peers: ['/gun'], // WebSocket-соединение на сервер
    //   localStorage: false, // Отключаем localStorage
    //   radisk: false, // Отключаем Radisk на клиенте
    //   axe: false, // Отключаем Axe (необязательно, если ты его не используешь)
    // })

    // gunRef.current = gun

    // Подписываемся на объекты мира
    const world = gun.get('world')

    world
      .map()
      /**
       * Здесь каждый объект прилетает в цикле.
       * Соответственно, сколько объектов, столько и вызовов
       */
      .on((data: WorldObject | null, id: string) => {
        console.log('world data', id, data)

        if (data && id !== '_') {
          // Учитываем особенности Gun.js форматирования данных
          // const validData: WorldObject = Object.keys(data).reduce(
          //   (acc, key) => {
          //     // Игнорируем служебные поля Gun.js, начинающиеся с '_'
          //     if (!key.startsWith('_')) {
          //       // @ts-expect-error types
          //       acc[key] = data[key]
          //     }
          //     return acc
          //   },
          //   {} as unknown,
          // ) as WorldObject
          // if (Object.keys(validData).length > 0) {
          //   setObjects((prevObjects) => {
          //     // console.log('useGetGunData setObjects recall prevObjects', prevObjects)
          //     // Проверяем, есть ли уже такой объект
          //     const exists = prevObjects.some(
          //       (obj) => obj.id === validData.id || obj.id === id,
          //     )
          //     if (exists) {
          //       // Обновляем существующий объект
          //       return prevObjects.map((obj) =>
          //         obj.id === validData.id || obj.id === id
          //           ? { ...validData, id: validData.id || id }
          //           : obj,
          //       )
          //     } else {
          //       // Добавляем новый объект
          //       return [
          //         ...prevObjects,
          //         { ...validData, id: validData.id || id },
          //       ]
          //     }
          //   })
          // }
        }
      })

    // Подписываемся на соединения
    // const conns = gun.get('connections')
    // conns.map().on<Connection>((data) => {
    //   return

    //   if (data && typeof data === 'object') {
    //     // Извлекаем ID из данных или используем свойство _['#']
    //     const id = data.id || data._?.['#']

    //     // Учитываем особенности Gun.js форматирования данных
    //     const validData: WorldObject = Object.keys(data).reduce((acc, key) => {
    //       // Игнорируем служебные поля Gun.js, начинающиеся с '_'
    //       if (!key.startsWith('_')) {
    //         // @ts-expect-error types
    //         acc[key] = data[key]
    //       }
    //       return acc
    //     }, {} as unknown) as WorldObject

    //     if (Object.keys(validData).length > 0 && id && id !== '_') {
    //       setConnections((prevConns) => {
    //         const exists = prevConns.some((conn) => conn.id === id)
    //         if (exists) {
    //           return prevConns.map((conn) =>
    //             conn.id === id ? { ...validData, id } : conn,
    //           )
    //         } else {
    //           return [...prevConns, { ...validData, id }]
    //         }
    //       })
    //     }
    //   }
    // })

    return () => {
      // Отписываемся при размонтировании
      world.off()
      // conns.off()
    }
  }, [gun])

  return { objects }
}
