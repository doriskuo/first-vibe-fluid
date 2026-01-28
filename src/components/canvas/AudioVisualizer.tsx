'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { createNoise3D } from 'simplex-noise'

const noise3D = createNoise3D()

export default function AudioVisualizer() {
    const trebleRef = useRef<THREE.InstancedMesh>(null)
    const midRef = useRef<THREE.InstancedMesh>(null)
    const bassRef = useRef<THREE.InstancedMesh>(null)

    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Use shared scroll hook
    const { springProgress } = useScrollAnimation()

    const barsPerRow = 64
    const midBarsCount = 96 // Denser mid layer

    // Colors
    // Treble: Cyan -> White
    const trebleColors = useMemo(() => generateColors(barsPerRow, '#00f3ff', '#ffffff'), [])
    // Mid: Cyan -> Orange
    const midColors = useMemo(() => generateColors(midBarsCount, '#00f3ff', '#ff8800'), [])
    // Bass: Blue -> Magenta
    const bassColors = useMemo(() => generateColors(barsPerRow, '#4d00ff', '#ff00ff'), [])

    useFrame((state) => {
        // Scroll Visibility Logic
        const scrollValue = springProgress.get()
        const startVh = 8.5
        const endVh = 9.5

        let opacity = 0
        if (scrollValue >= startVh - 0.5 && scrollValue <= endVh + 0.5) {
            if (scrollValue < startVh) {
                opacity = (scrollValue - (startVh - 0.5)) / 0.5
            } else if (scrollValue > endVh) {
                opacity = 1 - (scrollValue - endVh) / 0.5
            } else {
                opacity = 1
            }
        }

        // Global visibility check
        const isVisible = opacity > 0.01
        if (trebleRef.current) trebleRef.current.visible = isVisible
        if (midRef.current) midRef.current.visible = isVisible
        if (bassRef.current) bassRef.current.visible = isVisible

        if (!isVisible) return

        // Update Opacity
        if (trebleRef.current) (trebleRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        if (midRef.current) (midRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        if (bassRef.current) (bassRef.current.material as THREE.MeshBasicMaterial).opacity = opacity

        // Animation Loop
        const time = state.clock.elapsedTime

        // Global scale factor to make everything "smaller"
        const globalScale = 0.6
        const rowWidth = 12

        // --- Row 0: TREBLE (Particles/Dots - Spheres) ---
        if (trebleRef.current) {
            for (let i = 0; i < barsPerRow; i++) {
                const x = (i / barsPerRow - 0.5) * rowWidth

                // Fast, high-frequency noise for vibration
                let n = noise3D(x * 5.0, time * 10.0, 0) // Faster noise
                n = (n + 1) / 2

                // Y: 0.9 (Tightened, was 1.6)
                const y = 0.9

                // Large scale variance: 0.1 to 1.3
                const scale = (0.1 + Math.pow(n, 2) * 1.5) * globalScale

                dummy.position.set(x, y, -8)
                dummy.scale.set(scale, scale, scale)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                trebleRef.current.setMatrixAt(i, dummy.matrix)
            }
            trebleRef.current.instanceMatrix.needsUpdate = true
        }

        // --- Row 1: MID (Standard Bars) ---
        if (midRef.current) {
            for (let i = 0; i < midBarsCount; i++) {
                const x = (i / midBarsCount - 0.5) * rowWidth

                // Smooth melodic wave
                let n = noise3D(x * 0.5, time * 1.5, 100)
                n = (n + 1) / 2
                const beat = Math.pow(Math.sin(time * 3) * 0.5 + 0.5, 2)

                const height = (0.2 + n * 2.0 * (1 + beat * 0.2)) * globalScale
                const envelope = Math.sin((i / midBarsCount) * Math.PI)

                // Y: -0.3 (Tightened, was -0.2)
                dummy.position.set(x, -0.3, -8)
                // Thinner bars to accommodate density
                dummy.scale.set(0.35, height * envelope, 0.35)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                midRef.current.setMatrixAt(i, dummy.matrix)
            }
            midRef.current.instanceMatrix.needsUpdate = true
        }

        // --- Row 2: BASS (Round Cylinders / Platforms) ---
        if (bassRef.current) {
            for (let i = 0; i < barsPerRow; i++) {
                const x = (i / barsPerRow - 0.5) * rowWidth

                // Revert to Coherent Noise (using x)
                let n = noise3D(x * 0.2, time * 0.5, 200)
                n = (n + 1) / 2

                const breathing = (Math.sin(time * 3) * 0.5 + 0.5) * 0.2

                const h = (0.5 + n * 0.8 + breathing) * globalScale

                // Y: -1.5 (Tightened, was -2.2)
                dummy.position.set(x, -1.5, -8)
                // Round Cylinder Scale
                dummy.scale.set(1.0, h, 1.0)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                bassRef.current.setMatrixAt(i, dummy.matrix)
            }
            bassRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <group>
            {/* Treble: Spheres (Still Spheres) */}
            <instancedMesh ref={trebleRef} args={[undefined, undefined, barsPerRow]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <instancedBufferAttribute attach="instanceColor" args={[trebleColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} />
            </instancedMesh>

            {/* Mid: Boxes */}
            <instancedMesh ref={midRef} args={[undefined, undefined, midBarsCount]}>
                <boxGeometry args={[0.2, 1, 0.2]} />
                <instancedBufferAttribute attach="instanceColor" args={[midColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} />
            </instancedMesh>

            {/* Bass: Cylinders (or Wide Boxes) */}
            <instancedMesh ref={bassRef} args={[undefined, undefined, barsPerRow]}>
                <cylinderGeometry args={[0.3, 0.3, 1, 16]} />
                <instancedBufferAttribute attach="instanceColor" args={[bassColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} wireframe />
            </instancedMesh>
        </group>
    )
}

function generateColors(count: number, hex1: string, hex2: string) {
    const data = new Float32Array(count * 3)
    const c1 = new THREE.Color(hex1)
    const c2 = new THREE.Color(hex2)

    for (let i = 0; i < count; i++) {
        const t = i / count
        const color = new THREE.Color().lerpColors(c1, c2, t)
        data[i * 3] = color.r
        data[i * 3 + 1] = color.g
        data[i * 3 + 2] = color.b
    }
    return data
}
