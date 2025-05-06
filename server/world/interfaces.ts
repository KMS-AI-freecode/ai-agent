import { IGunInstance } from "gun"

export interface WorldObject {
  id: string
  type: string
  createdAt: string
  position: {
    x: number
    y: number
    z: number
  }
  [key: string]: any // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface Connection {
  id: string
  createdAt: string
  lastActivity: string
  isAuthorized: boolean
  userId?: string
}

// Минимальный интерфейс для Gun
export type  GunInstance = IGunInstance

export interface GunData {
  get: (key: string) => GunData
  put: (data: unknown) => void
  once: (callback: (data: any) => void) => void // eslint-disable-line @typescript-eslint/no-explicit-any
}

