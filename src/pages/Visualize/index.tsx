import React from 'react'
import dynamic from 'next/dynamic'

const World = dynamic(() => import('../../World').then((r) => r.World), {
  ssr: false,
})

export const VisualizePage: React.FC = () => {
  return <World />
}
