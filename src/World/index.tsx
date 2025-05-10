/* eslint-disable no-console */
import React, { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import {
  OrbitControls,
  Text,
  // Html,
  Stats,
  GizmoHelper,
  GizmoViewport,
} from '@react-three/drei'
import * as THREE from 'three'
import {
  WorldCanvasContainerStyled,
  WorldChatCanvasContainerStyled,
  WorldStyled,
} from './styles'
import { Chat } from '../Chat'
import { useGetGunData } from './hooks/useGetGunData'
import { WorldObjectMesh } from './Mesh/WorldObjectMesh'
import { ConnectionMesh } from './Mesh/ConnectionMesh'

// Главный компонент мира
export const World: React.FC = () => {
  const cameraPositionRef = useRef<[number, number, number]>([0, 5, 10])
  const cameraTargetRef = useRef<[number, number, number]>([0, 0, 0])

  // eslint-disable-next-line no-console
  console.log('World render')

  const { objects, connections } = useGetGunData()

  console.log('World objects', objects)
  // console.log('World connections', connections)

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
          {/* {objects.map((object) => {
            // TODO Здесь не хватает типизации, так как притеть может и почти пустой объект
            return <WorldObjectMesh key={object.id} object={object} />
          })} */}

          {/* Визуализация соединений */}
          {/* {connections.map((connection) => {
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
          })} */}

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
