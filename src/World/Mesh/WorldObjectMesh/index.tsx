import { Text } from '@react-three/drei'
import { WorldObject } from '../../interfaces'

// Компонент для отображения объекта мира
export const WorldObjectMesh: React.FC<{ object: WorldObject }> = ({
  object,
}) => {
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
