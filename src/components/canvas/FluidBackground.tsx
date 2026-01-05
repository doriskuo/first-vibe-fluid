'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'

import vertexShader from '@/shaders/fluidGradient.vert'
import fragmentShader from '@/shaders/fluidGradient.frag'
import { useShaderControls } from '@/components/debug/useShaderControls'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

function FullscreenFluid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport, pointer, size } = useThree()

  // Leva controls for real-time parameter adjustment
  const shaderConfig = useShaderControls()

  // New scroll animation hook (replaces hand-written scroll listener)
  const { springProgress } = useScrollAnimation()

  // Mouse tracking for fluid interaction
  const mousePos = useRef({ x: 0.5, y: 0.5 })

  const uniforms = useMemo(() => ({
    uTime: { value: 0 },
    uMouse: { value: new THREE.Vector2(0.5, 0.5) },
    uResolution: { value: new THREE.Vector2(size.width, size.height) },
    uScrollProgress: { value: 0 },
    uMaterialProgress: { value: 0 },
    // Leva-controlled uniforms
    uBounceStrength: { value: 3.5 },
    uBounceHorizontal: { value: 0.5 },
    uGlassOpacity: { value: 0.65 },
    uGlassBrightness: { value: 1.0 },
    uRGBIntensity: { value: 0.8 },
    uRGBPulseSpeed: { value: 1.0 },
    uRimLightStrength: { value: 0.8 },
    uDarkEdgeStrength: { value: 0.35 },
    uCyanColor: { value: new THREE.Vector3(0.5, 0.85, 1.0) },
    uPinkColor: { value: new THREE.Vector3(1.0, 0.55, 0.7) },
    uLavenderColor: { value: new THREE.Vector3(0.75, 0.6, 0.9) },
  }), [size.width, size.height])

  useEffect(() => {
    uniforms.uResolution.value.set(size.width, size.height)
  }, [size, uniforms])

  useFrame(({ clock }) => {
    if (!meshRef.current) return

    const material = meshRef.current.material as THREE.ShaderMaterial
    material.uniforms.uTime.value = clock.elapsedTime

    // Get scroll value from new hook (same output as before)
    const scrollValue = springProgress.get()
    material.uniforms.uScrollProgress.value = scrollValue

    // Material ONLY starts after shape is fully complete (scrollValue > 1.0)
    let materialProgress = 0
    if (scrollValue > 1.0) {
      materialProgress = Math.min((scrollValue - 1.0) / 0.5, 1.0)
    }
    material.uniforms.uMaterialProgress.value = materialProgress

    // Update Leva-controlled uniforms
    material.uniforms.uBounceStrength.value = shaderConfig.bounceStrength
    material.uniforms.uBounceHorizontal.value = shaderConfig.bounceHorizontal
    material.uniforms.uGlassOpacity.value = shaderConfig.glassOpacity
    material.uniforms.uGlassBrightness.value = shaderConfig.glassBrightness
    material.uniforms.uRGBIntensity.value = shaderConfig.rgbIntensity
    material.uniforms.uRGBPulseSpeed.value = shaderConfig.rgbPulseSpeed
    material.uniforms.uRimLightStrength.value = shaderConfig.rimLightStrength
    material.uniforms.uDarkEdgeStrength.value = shaderConfig.darkEdgeStrength

    // Convert Leva RGB colors (0-255) to shader (0-1)
    material.uniforms.uCyanColor.value.set(
      shaderConfig.cyanColor.r / 255,
      shaderConfig.cyanColor.g / 255,
      shaderConfig.cyanColor.b / 255
    )
    material.uniforms.uPinkColor.value.set(
      shaderConfig.pinkColor.r / 255,
      shaderConfig.pinkColor.g / 255,
      shaderConfig.pinkColor.b / 255
    )
    material.uniforms.uLavenderColor.value.set(
      shaderConfig.lavenderColor.r / 255,
      shaderConfig.lavenderColor.g / 255,
      shaderConfig.lavenderColor.b / 255
    )

    // Mouse
    const targetX = (pointer.x + 1) / 2
    const targetY = (pointer.y + 1) / 2
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
