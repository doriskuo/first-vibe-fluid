'use client'

import { useRef, useMemo, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { totalPageHeightVh, getCurrentStageName, getStageInfo } from '@/config/scrollTimeline'

import vertexShader from '@/shaders/fluidGradient.vert'
import fragmentShader from '@/shaders/fluidGradient.frag'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

function FullscreenFluid() {
  const meshRef = useRef<THREE.Mesh>(null)
  const { viewport, pointer, size } = useThree()

  // Hardcoded Config (Previous Leva defaults)
  const shaderConfig = {
    bounceStrength: 2.0,
    bounceHorizontal: 0.5,
    springStiffness: 350,
    springDamping: 12,
    glassOpacity: 0.65,
    glassBrightness: 1.0,
    rgbIntensity: 0.8,
    rgbPulseSpeed: 1.0,
    rimLightStrength: 0.8,
    darkEdgeStrength: 0.35,
    cyanColor: { r: 128, g: 217, b: 255 },
    pinkColor: { r: 255, g: 140, b: 179 },
    lavenderColor: { r: 191, g: 153, b: 230 }
  }

  // New scroll animation hook with dynamic physics config
  const { springProgress } = useScrollAnimation({
    springConfig: {
      stiffness: shaderConfig.springStiffness,
      damping: shaderConfig.springDamping
    }
  })

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
    uBackgroundColor: { value: new THREE.Vector3(0.97, 0.96, 0.95) },
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

    // --- Darken Logic for Cyberpunk Mode ---
    // If scrollValue corresponds to cyberpunkEntry (or later), we fade to black.
    // Based on scrollTimeline.ts:
    // cyberpunkEntry starts after headphones. headphones duration is 1000vh.
    // We need to check useScrollAnimation's currentStage or just match the logic here.
    // Since we don't have direct access to 'currentStage' inside independent useFrame easily without prop drilling,
    // let's infer it from scrollValue or pass it in. 
    // Actually, we can get currentStage from the hook if we used 'getState', but we are in useFrame.
    // Let's use the raw scrollValue.
    // headphones end at: liquid(200)+teardrop(300)+bounce(100)+glass(400)+rgbGlow(500)+2dFadeout(600)+3dGlass(300)+shapeMorph(500)+headphones(1000) = 3900vh approx?
    // Let's just import 'computedStages' to be precise.

    // Simplified approach: calculated in useScrollAnimation hook? No, let's just do it here.
    // We can infer "End of World" by scrollValue > some threshold.
    // But better yet, let's just use a uniform uDarkness that we animate?
    // No, we can just multiply color values here.

    // Let's get the absolute progress.
    const rawScroll = scrollValue / (totalPageHeightVh / 1000) // approx reverse calc

    let darkness = 0

    // Let's just re-calculate darkness based on the same logic as Overlay.
    // Actually, let's just use a simple threshold for now to ensure it works.
    // If we assume the order is fixed: 
    // If scrollValue > (totalHeight - cyberpunkParts) ...

    // BETTER WAY: Import computedStages and use it.
    const currentStageName = getCurrentStageName(scrollValue / (totalPageHeightVh / 1000))
    // Note: ensure getCurrentStageName import is available

    // Updated to include new abstract simulation stages (including portal)
    if (['cyberpunkEntry', 'descent', 'theaterSpace', 'audioSim', 'visualSim', 'portal', 'featureMorph', 'featureProjection'].includes(currentStageName)) {
      darkness = 1.0; // Default to fully black 

      // Fade in logic only for cyberpunkEntry transition
      if (currentStageName === 'cyberpunkEntry') {
        // Calculate local progress
        const stageInfo = getStageInfo('cyberpunkEntry')
        if (stageInfo) {
          const currentVh = (scrollValue / (totalPageHeightVh / 1000)) * totalPageHeightVh
          const progress = (currentVh - stageInfo.startVh) / stageInfo.durationVh
          darkness = Math.min(progress * 2, 1) // Fade in quickly first half
        }
      }
    }

    const darken = (1 - darkness)

    material.uniforms.uCyanColor.value.set(
      (shaderConfig.cyanColor.r / 255) * darken,
      (shaderConfig.cyanColor.g / 255) * darken,
      (shaderConfig.cyanColor.b / 255) * darken
    )
    material.uniforms.uPinkColor.value.set(
      (shaderConfig.pinkColor.r / 255) * darken,
      (shaderConfig.pinkColor.g / 255) * darken,
      (shaderConfig.pinkColor.b / 255) * darken
    )
    material.uniforms.uLavenderColor.value.set(
      (shaderConfig.lavenderColor.r / 255) * darken,
      (shaderConfig.lavenderColor.g / 255) * darken,
      (shaderConfig.lavenderColor.b / 255) * darken
    )

    // Animate Background Color
    // Default Light: 0.97, 0.96, 0.95
    material.uniforms.uBackgroundColor.value.set(
      0.97 * darken,
      0.96 * darken,
      0.95 * darken
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
        depthWrite={false} // Prevent blocking background objects (like SphericalBackground)
      />
    </mesh>
  )
}

export default function FluidBackground() {
  return <FullscreenFluid />
}
