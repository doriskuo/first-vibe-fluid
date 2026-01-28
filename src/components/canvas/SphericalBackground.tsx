'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { totalPageHeightVh } from '@/config/scrollTimeline'

export default function SphericalBackground() {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.MeshBasicMaterial>(null)

    // Use shared scroll hook
    const { springProgress } = useScrollAnimation({
        springConfig: { stiffness: 200, damping: 20 }
    })

    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return

        const scrollValue = springProgress.get() // 0 to approx 8.9

        // Stage 12: theaterSpace starts after descent
        // Descent ends at: 4400 (cyberpunk end) + 1500 = 5900vh
        // So theaterSpace starts at scrollValue 5.9

        // Adjusted: Start at 6.2 as requested for perfect cross-fade with Overlay fadeout
        const theaterStart = 6.2

        // Opacity Logic
        let targetOpacity = 0
        if (scrollValue > theaterStart) {
            // Fade in over 0.8 units (800vh) for a smoother but stronger entry
            const entryProgress = Math.min((scrollValue - theaterStart) / 0.8, 1)
            targetOpacity = entryProgress * 0.8 // Max opacity 0.8 (was 0.4)
        }

        // Smooth transition
        materialRef.current.opacity = THREE.MathUtils.lerp(materialRef.current.opacity, targetOpacity, 0.1)

        // Visibility Optimization
        meshRef.current.visible = materialRef.current.opacity > 0.001

        // Animation: "Space Drift"
        if (meshRef.current.visible) {
            // Slow continuous rotation
            meshRef.current.rotation.y += 0.0005
            // Breathing effect
            meshRef.current.scale.setScalar(20 + Math.sin(state.clock.elapsedTime * 0.5) * 0.5)
        }
    })

    return (
        <mesh ref={meshRef} scale={[20, 20, 20]}>
            {/* Large sphere surrounding the viewer */}
            <sphereGeometry args={[1, 64, 64]} />
            <meshBasicMaterial
                ref={materialRef}
                color="#00f3ff"
                wireframe
                transparent
                opacity={0}
                side={THREE.DoubleSide}
                depthWrite={false} // Prevent blocking other objects
            />
        </mesh>
    )
}
