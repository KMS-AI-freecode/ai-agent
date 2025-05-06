import Gun from 'gun'
import { Server } from 'http'
import { Connection, GunData, GunInstance, WorldObject } from './interfaces'

export class WorldManager {
  private gun: GunInstance
  private world: GunData
  private connections: GunData
  private httpServer: Server
  // private static instance: WorldManager
  private connectionCount = 0

  constructor(server: Server) {
    // Инициализация произойдет в методе initializeServer
    // Заглушки для свойств до инициализации
    // this.gun = null as unknown as GunInstance
    // this.world = null as unknown as GunData
    // this.connections = null as unknown as GunData

    this.httpServer = server

    // Инициализация Gun с сервером
    this.gun = Gun({
      web: server,
      // localStorage: false,
      file: 'data', // Файл для сохранения данных
      radisk: true, // Включаем сохранение на диск
      // radname: 'data/gundata', // Путь для хранения данных (вместо radata)
    })

    // Определяем корневые узлы
    this.world = this.gun.get('world')
    this.connections = this.gun.get('connections')

    // eslint-disable-next-line no-console
    console.log('World server initialized with Gun.js')

    return this
  }

  // public static getInstance(): WorldManager {
  //   if (!WorldManager.instance) {
  //     WorldManager.instance = new WorldManager()
  //   }
  //   return WorldManager.instance
  // }

  // public initializeServer(server: http.Server): void {
  //   this.httpServer = server

  //   // Инициализация Gun с сервером
  //   const gun = Gun({
  //     web: server,
  //     localStorage: false,
  //     // file: 'data.json', // Файл для сохранения данных
  //     radisk: true, // Включаем сохранение на диск
  //     radname: 'data/gundata', // Путь для хранения данных (вместо radata)
  //   })

  //   // Определяем корневые узлы
  //   this.world = this.gun.get('world')
  //   this.connections = this.gun.get('connections')

  //   // eslint-disable-next-line no-console
  //   console.log('World server initialized with Gun.js')
  // }

  public createConnection(
    isAuthorized: boolean = false,
    userId?: string,
  ): Connection {
    const connectionId = crypto.randomUUID()
    const timestamp = Date.now()
    const connection: Connection = {
      id: connectionId,
      createdAt: new Date(timestamp).toISOString(),
      lastActivity: new Date(timestamp).toISOString(),
      isAuthorized,
      userId,
    }

    // Увеличиваем счетчик соединений
    this.connectionCount++

    // Сохраняем соединение в Gun
    this.connections.get(connectionId).put(connection)

    // eslint-disable-next-line no-console
    console.log(`Created new connection: ${connectionId}`)

    return connection
  }

  public calculateInitialPosition({
    // connectionId,
    isAuthorized,
    timestamp,
    userId,
  }: {
    timestamp: number
    // connectionId: string
    isAuthorized: boolean
    userId?: string
  }): { x: number; y: number; z: number } {
    const STEP_X = 1000 // шаг в миллисекундах по оси X
    const STEP_Y = 10 // шаг для соединений по оси Y
    const USER_STEP = 100 // шаг для пользователей
    const userIdNum = userId
      ? parseInt(userId.replace(/\D/g, ''), 10) % 1000
      : 0
    const sign = isAuthorized ? 1 : -1

    return {
      x: timestamp / STEP_X,
      y: this.connectionCount * STEP_Y + userIdNum * USER_STEP * sign,
      z: 0,
    }
  }

  public addMindLogToWorld({
    // connectionId,
    data,
    mindLogId,
    type,
  }: {
    mindLogId: string
    data: string
    type: string
    // connectionId: string
  }): WorldObject {
    const timestamp = Date.now()

    // Для простоты используем значения по умолчанию без получения данных о соединении
    // так как Gun.js имеет асинхронный API, а с ним есть проблемы типизации
    const isAuthorized = false
    const userId = undefined

    // Рассчитываем позицию объекта
    const position = this.calculateInitialPosition({
      timestamp,
      // connectionId,
      isAuthorized,
      userId,
    })

    // Создаем объект мира
    const worldObject: WorldObject = {
      id: mindLogId,
      // parentId: connectionId,
      type: type,
      data: data,
      createdAt: new Date(timestamp).toISOString(),
      position,
      belongsToPresent: false, // Этот объект не следует за "настоящим"
    }

    // Добавляем объект в мир
    this.world.get(mindLogId).put(worldObject)

    // eslint-disable-next-line no-console
    console.log(`Added mind log ${mindLogId} to world at position`, position)

    return worldObject
  }

  public getGun(): GunInstance {
    return this.gun
  }
}

// export const worldManager = WorldManager.getInstance()
