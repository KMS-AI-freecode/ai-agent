import { Text } from '@react-three/drei'

// Компонент для отображения соединения
export const ConnectionMesh: React.FC<{
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
