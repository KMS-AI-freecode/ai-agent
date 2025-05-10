import React, { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Text,
  // Html,
  Stats,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei'
import Gun, { IGunInstance } from 'gun'
import * as THREE from 'three'
import {
  WorldCanvasContainerStyled,
  WorldChatCanvasContainerStyled,
  WorldStyled,
} from './styles'
import { Chat } from '../Chat'

type Connection = {
  id: string
  position?: {
    x: number
    y: number
    z: number
  }
}

// Интерфейс для объектов мира
interface WorldObject {
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

// Компонент для отображения объекта мира
const WorldObjectMesh: React.FC<{ object: WorldObject }> = ({ object }) => {
  const { position, type, data } = object

  if (!data || !type || !position) {
    return null
  }

  // Определяем цвет в зависимости от типа
  const getColor = () => {
    switch (type) {
      case 'THINKING':
        return 'lightblue'
      case 'OBSERVATION':
        return 'green'
      case 'MESSAGE':
        return 'yellow'
      default:
        return 'white'
    }
  }

  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={getColor()} />
      </mesh>
      <Text
        position={[0, 0.3, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
      >
        {data && data.length > 50 ? data.substring(0, 50) + '...' : data}
      </Text>
    </group>
  )
}

// Компонент для отображения соединения
const ConnectionMesh: React.FC<{
  position: [number, number, number]
  id: string
}> = ({ position, id }) => {
  return (
    <group position={position}>
      <mesh>
        <boxGeometry args={[0.5, 0.5, 0.5]} />
        <meshStandardMaterial color="purple" />
      </mesh>
      <Text
        position={[0, 0.5, 0]}
        fontSize={0.1}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        Connection: {id.substring(0, 8)}
      </Text>
    </group>
  )
}

// Главный компонент мира
export const World: React.FC = () => {
  const [objects, setObjects] = useState<WorldObject[]>([])
  const [connections, setConnections] = useState<Connection[]>([])
  const gunRef = useRef<IGunInstance | null>(null)
  const cameraPositionRef = useRef<[number, number, number]>([0, 5, 10])
  const cameraTargetRef = useRef<[number, number, number]>([0, 0, 0])

  useEffect(() => {
    // Инициализируем Gun.js
    const gun = Gun({
      peers: ['/gun'], // WebSocket-соединение на сервер
      localStorage: false, // Отключаем localStorage
      radisk: false, // Отключаем Radisk на клиенте
      axe: false, // Отключаем Axe (необязательно, если ты его не используешь)
    })

    gunRef.current = gun

    // Подписываемся на объекты мира
    const world = gun.get('world')
    world.map().on((data: WorldObject | null, id: string) => {
      if (data && id !== '_') {
        // Учитываем особенности Gun.js форматирования данных
        const validData: WorldObject = Object.keys(data).reduce((acc, key) => {
          // Игнорируем служебные поля Gun.js, начинающиеся с '_'
          if (!key.startsWith('_')) {
            // @ts-expect-error types
            acc[key] = data[key]
          }
          return acc
        }, {} as unknown) as WorldObject

        if (Object.keys(validData).length > 0) {
          setObjects((prevObjects) => {
            // Проверяем, есть ли уже такой объект
            const exists = prevObjects.some(
              (obj) => obj.id === validData.id || obj.id === id,
            )
            if (exists) {
              // Обновляем существующий объект
              return prevObjects.map((obj) =>
                obj.id === validData.id || obj.id === id
                  ? { ...validData, id: validData.id || id }
                  : obj,
              )
            } else {
              // Добавляем новый объект
              return [...prevObjects, { ...validData, id: validData.id || id }]
            }
          })
        }
      }
    })

    // Подписываемся на соединения
    const conns = gun.get('connections')
    conns.map().on<Connection>((data) => {
      if (data && typeof data === 'object') {
        // Извлекаем ID из данных или используем свойство _['#']
        const id = data.id || data._?.['#']

        // Учитываем особенности Gun.js форматирования данных
        const validData: WorldObject = Object.keys(data).reduce((acc, key) => {
          // Игнорируем служебные поля Gun.js, начинающиеся с '_'
          if (!key.startsWith('_')) {
            // @ts-expect-error types
            acc[key] = data[key]
          }
          return acc
        }, {} as unknown) as WorldObject

        if (Object.keys(validData).length > 0 && id && id !== '_') {
          setConnections((prevConns) => {
            const exists = prevConns.some((conn) => conn.id === id)
            if (exists) {
              return prevConns.map((conn) =>
                conn.id === id ? { ...validData, id } : conn,
              )
            } else {
              return [...prevConns, { ...validData, id }]
            }
          })
        }
      }
    })

    return () => {
      // Отписываемся при размонтировании
      world.off()
      conns.off()
    }
  }, [])

  // Рассчитываем начальное положение камеры исходя из текущего времени
  useEffect(() => {
    const now = Date.now()
    const STEP_X = 1000 // Шаг времени по оси X в миллисекундах (должен совпадать с сервером)

    // Рассчитываем позицию по X на основе текущего времени
    const xPos = Math.floor(now / STEP_X) * STEP_X

    // Устанавливаем камеру немного в стороне от текущей позиции времени
    cameraPositionRef.current = [xPos, 5, 20]
    // Смотрим на текущую позицию времени
    cameraTargetRef.current = [xPos, 0, 0]
  }, [])

  return (
    <WorldStyled>
      <WorldCanvasContainerStyled>
        <Canvas
          camera={{ position: cameraPositionRef.current, fov: 75 }}
          shadows
        >
          {/* Показываем статистику производительности */}
          <Stats />

          {/* Помощник для навигации в 3D пространстве */}
          <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
            <GizmoViewport
              labelColor="white"
              axisColors={['#ff3653', '#0aad8c', '#2e83f2']}
            />
          </GizmoHelper>

          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} castShadow />

          {/* Ось времени (X) */}
          <group position={[cameraTargetRef.current[0], 0, 0]}>
            <line>
              <bufferGeometry
                attach="geometry"
                attributes={{
                  position: new THREE.BufferAttribute(
                    new Float32Array([-100, 0, 0, 100, 0, 0]),
                    3,
                  ),
                }}
              />
              <lineBasicMaterial attach="material" color="red" />
            </line>
            <Text position={[10, 0.2, 0]} fontSize={0.3} color="red">
              X (Время)
            </Text>

            {/* Ось Y */}
            <line>
              <bufferGeometry
                attach="geometry"
                attributes={{
                  position: new THREE.BufferAttribute(
                    new Float32Array([0, -50, 0, 0, 50, 0]),
                    3,
                  ),
                }}
              />
              <lineBasicMaterial attach="material" color="green" />
            </line>
            <Text position={[0, 10, 0]} fontSize={0.3} color="green">
              Y (Пользователи)
            </Text>

            {/* Ось Z */}
            <line>
              <bufferGeometry
                attach="geometry"
                attributes={{
                  position: new THREE.BufferAttribute(
                    new Float32Array([0, 0, -50, 0, 0, 50]),
                    3,
                  ),
                }}
              />
              <lineBasicMaterial attach="material" color="blue" />
            </line>
            <Text position={[0, 0, 10]} fontSize={0.3} color="blue">
              Z
            </Text>
          </group>

          {/* Визуализация объектов мира */}
          {objects.map((object) => {
            // TODO Здесь не хватает типизации, так как притеть может и почти пустой объект
            return <WorldObjectMesh key={object.id} object={object} />
          })}

          {/* Визуализация соединений */}
          {connections.map((connection) => {
            // Расчет позиции соединения (если есть координаты)
            const position: [number, number, number] = connection.position
              ? [
                  connection.position.x,
                  connection.position.y,
                  connection.position.z,
                ]
              : [0, 0, 0]

            return (
              <ConnectionMesh
                key={connection.id}
                id={connection.id}
                position={position}
              />
            )
          })}

          {/* OrbitControls с начальной позицией на основе текущего времени */}
          <OrbitControls
            target={cameraTargetRef.current}
            enableDamping
            dampingFactor={0.3}
            // @ts-expect-error types
            position={cameraPositionRef.current}
          />
        </Canvas>
      </WorldCanvasContainerStyled>

      <WorldChatCanvasContainerStyled>
        <Chat />
      </WorldChatCanvasContainerStyled>
    </WorldStyled>
  )
}
