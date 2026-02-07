'use client'

import { Canvas } from '@react-three/fiber'
import { Suspense, useEffect, useState } from 'react'
import { Preload } from '@react-three/drei'

interface SceneProps {
  children?: React.ReactNode
}

export default function Scene({ children }: SceneProps) {
  const [fov, setFov] = useState(45)

  useEffect(() => {
    const updateFov = () => {
      const width = window.innerWidth
      // Wider FOV on mobile for better visibility
      if (width < 640) {
        setFov(55)  // Mobile: wider view
      } else if (width < 1024) {
        setFov(50)  // Tablet
      } else {
        setFov(45)  // Desktop (original)
      }
    }

    updateFov()
    window.addEventListener('resize', updateFov)
    return () => window.removeEventListener('resize', updateFov)
  }, [])

  return (
    <Canvas
      camera={{ position: [0, 0, 1], fov }}
      style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh' }}
      gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
      dpr={[1, 2]}
    >
      <Suspense fallback={null}>
        {children}
        <Preload all />
      </Suspense>
    </Canvas>
  )
}
