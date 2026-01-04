'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useSpring } from 'framer-motion'

import vertexShader from '@/shaders/fluidGradient.vert'
import fragmentShader from '@/shaders/fluidGradient.frag'

function FullscreenFluid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport, pointer, size } = useThree()

  // Mouse tracking for fluid interaction
  const mousePos = useRef({ x: 0.5, y: 0.5 })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uScrollProgress: { value: 0 },
    uMaterialProgress: { value: 0 },
  }), [size.width, size.height])

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
  }, [size, uniforms])

  // Framer Motion Spring
  // stiffness 90 (Softer/Slower), damping 5 (Low friction = wide, slow, visible bounces)
  const springProgress = useSpring(0, { stiffness: 90, damping: 5 })

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // 1600vh page: scrollable = 1500vh
      // scrollValue = 0 to 1.5 at bottom
      // Shape: 0-1.0 (first 1000vh), Material: 1.0-1.5 (next 500vh)
      const scrollableDistance = document.documentElement.scrollHeight - window.innerHeight
      const progress = (window.scrollY / scrollableDistance) * 1.5

      springProgress.set(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [springProgress])

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    const material = meshRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = clock.elapsedTime

    const scrollValue = springProgress.get()
    material.uniforms.uScrollProgress.value = scrollValue

    // Material ONLY starts after shape is fully complete (scrollValue > 1.0)
    // Maps 1.0-1.5 to 0.0-1.0 material progress
    let materialProgress = 0
    if (scrollValue > 1.0) {
      materialProgress = Math.min((scrollValue - 1.0) / 0.5, 1.0)
    }
    material.uniforms.uMaterialProgress.value = materialProgress

    // Mouse coordinate conversion to 0-1
    const targetX = (pointer.x + 1) / 2
    const targetY = (pointer.y + 1) / 2

    // Smooth mouse tracking
    mousePos.current.x += (targetX - mousePos.current.x) * 0.05
    mousePos.current.y += (targetY - mousePos.current.y) * 0.05

    material.uniforms.uMouse.value.set(mousePos.current.x, mousePos.current.y)
  })

  return (
    <mesh ref={meshRef} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[1, 1, 1, 1]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}

export default function FluidBackground() {
  return <FullscreenFluid />
}
