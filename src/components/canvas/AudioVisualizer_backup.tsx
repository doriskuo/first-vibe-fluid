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
    const midBarsCount = 128 // High density

    // Colors
    // Treble: Pastel Pink/Lavender -> White (Harmonize with Magenta, distinct from Blue)
    const trebleColors = useMemo(() => generateColors(barsPerRow, '#ff88cc', '#ffffff'), [])

    // Mid: Multi-stop gradient (Magenta -> Purple -> Blue -> Cyan)
    const midColors = useMemo(() => {
        return generateMultiStopColors(midBarsCount, [
            new THREE.Color('#ff00cc'), // Magenta
            new THREE.Color('#aa00ff'), // Purple
            new THREE.Color('#0066ff'), // Deep Blue
            new THREE.Color('#00ffff'), // Bright Cyan
        ])
    }, [])

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

        const isVisible = opacity > 0.01
        if (!isVisible) {
            if (trebleRef.current) trebleRef.current.visible = false
            if (midRef.current) midRef.current.visible = false
            if (bassRef.current) bassRef.current.visible = false
            return
        }

        if (trebleRef.current) {
            trebleRef.current.visible = true
                ; (trebleRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        }
        if (midRef.current) {
            midRef.current.visible = true
                ; (midRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        }
        if (bassRef.current) {
            bassRef.current.visible = true
                ; (bassRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        }

        // Animation Loop
        const time = state.clock.elapsedTime

        const globalScale = 0.6
        const rowWidth = 12

        // --- Row 0: TREBLE (Particles/Dots - "Soft Glimmer") ---
        // User Request: "Softer colors", "No flashing", "Distinct from bg"
        if (trebleRef.current) {
            for (let i = 0; i < barsPerRow; i++) {
                const x = (i / barsPerRow - 0.5) * rowWidth

                // Smoother, slower noise for gentle floating
                // Slower time factor (2.0 vs 10.0)
                let n = noise3D(x * 3.0, time * 2.0, 0)
                n = (n + 1) / 2

                const y = 0.9

                // Gentle scale variance (0.3 to 1.0) - No sharp "flashing" (pow)
                // Linear mapping is much softer
                const scale = (0.3 + n * 0.7) * globalScale

                dummy.position.set(x, y, -8)
                dummy.scale.set(scale, scale, scale)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                trebleRef.current.setMatrixAt(i, dummy.matrix)
            }
            trebleRef.current.instanceMatrix.needsUpdate = true
        }

        // --- Row 1: MID (Simplex Noise / Organic Wave) ---
        // --- Row 1: MID (Dual Independent Simplex Noise Curves) ---
        // User Request: "Top and Bottom waves are curved but asynchronous"
        // "Connecting arc lengths different"
        if (midRef.current) {
            for (let i = 0; i < midBarsCount; i++) {
                const x = (i / midBarsCount - 0.5) * rowWidth
                const normX = i / midBarsCount

                // 1. Top Wave (Independent Noise)
                // Seed 0 (z=0)
                let nTop = noise3D(x * 0.3, time * 0.6, 0)
                // Increased Amplitude: (n * 0.8 + 0.5) * 1.3 -> More peaks/valleys
                let topY = (nTop * 0.8 + 0.5) * 1.3

                // 2. Bottom Wave (Independent Noise - Different Seed)
                // Seed 100 (z=100) -> Completely different pattern
                // Slightly different frequency/speed too
                let nBot = noise3D(x * 0.4 + 100, time * 0.7 + 50, 100)
                // Increased Amplitude
                let bottomY = -(nBot * 0.8 + 0.5) * 1.3

                // 3. Envelope (Taper at ends)
                // Use smooth sine window
                const envelope = Math.sin(normX * Math.PI)

                // Apply envelope to dampen ends to 0 center
                topY *= envelope
                bottomY *= envelope

                // 4. Calculate Bar Transform
                // Height is total span
                let height = (topY - bottomY) * globalScale
                // Center is midpoint of span
                let centerY = (topY + bottomY) / 2 * globalScale

                // Base offset Y = -0.3
                const baseOffsetY = -0.3

                dummy.position.set(x, baseOffsetY + centerY, -8)
                // Thinner bars (0.2)
                dummy.scale.set(0.2, Math.max(0.01, height), 0.2)
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
                let n = noise3D(x * 0.2, time * 0.5, 200); n = (n + 1) / 2
                const breathing = (Math.sin(time * 3) * 0.5 + 0.5) * 0.2
                const h = (0.5 + n * 0.8 + breathing) * globalScale
                dummy.position.set(x, -2.0, -8)
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
            {/* Treble */}
            <instancedMesh ref={trebleRef} args={[undefined, undefined, barsPerRow]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <instancedBufferAttribute attach="instanceColor" args={[trebleColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} />
            </instancedMesh>

            {/* Mid */}
            <instancedMesh ref={midRef} args={[undefined, undefined, midBarsCount]}>
                <boxGeometry args={[0.2, 1, 0.2]} />
                <instancedBufferAttribute attach="instanceColor" args={[midColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} />
            </instancedMesh>

            {/* Bass */}
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

function generateMultiStopColors(count: number, colors: THREE.Color[]) {
    const data = new Float32Array(count * 3)
    const segments = colors.length - 1

    for (let i = 0; i < count; i++) {
        const t = i / (count - 1)
        const segmentIndex = Math.floor(t * segments)
        const segmentT = (t * segments) - segmentIndex

        const index1 = Math.min(segmentIndex, segments - 1)
        const index2 = Math.min(segmentIndex + 1, segments)

        const c1 = colors[index1]
        const c2 = colors[index2]

        const color = new THREE.Color().lerpColors(c1, c2, segmentT)
        data[i * 3] = color.r
        data[i * 3 + 1] = color.g
        data[i * 3 + 2] = color.b
    }
    return data
}
