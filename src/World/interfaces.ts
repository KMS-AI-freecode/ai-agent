export type Connection = {
  id: string
  position?: {
    x: number
    y: number
    z: number
  }
}

// Интерфейс для объектов мира
export interface WorldObject {
  id: string
  type: string
  data: string | undefined
  createdAt: string
  position: {
    x: number
    y: number
    z: number
  }
  parentId?: string
  belongsToPresent?: boolean
}
