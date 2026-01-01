'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import vertexShader from '@/shaders/fluidGradient.vert'
import fragmentShader from '@/shaders/fluidGradient.frag'

function FullscreenFluid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport, pointer, size } = useThree()

  // 滑鼠平滑追蹤
  const mousePos = useRef({ x: 0.5, y: 0.5 })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uScrollProgress: { value: 0 },
  }), [size.width, size.height])

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
  }, [size, uniforms])

  // Target scroll progress for smoothing
  const targetScroll = useRef(0)

  // Scroll listener
  useEffect(() => {
    const handleScroll = () => {
      // Increase maxScroll to make the transition slower/require more scrolling
      // user asked for "more slow and graceful", so we need more scroll distance
      const maxScroll = window.innerHeight * 2.5
      const progress = Math.min(Math.max(window.scrollY / maxScroll, 0), 1)
      targetScroll.current = progress
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    const material = meshRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = clock.elapsedTime

    // Smooth scroll interpolation
    // Lerp factor 0.05 is consistent with the mouse smoothing speed
    material.uniforms.uScrollProgress.value = THREE.MathUtils.lerp(
      material.uniforms.uScrollProgress.value,
      targetScroll.current,
      0.04
    )

    // 滑鼠座標轉換為 0-1
    const targetX = (pointer.x + 1) / 2
    const targetY = (pointer.y + 1) / 2

    // 非常平滑的追蹤（產生延遲的水波感）
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
