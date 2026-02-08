'use client'

import { useRef, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { createNoise3D } from 'simplex-noise'

const noise3D = createNoise3D()

export default function AudioVisualizer() {
    const trebleRef = useRef<THREE.InstancedMesh>(null)
    const midRef = useRef<THREE.InstancedMesh>(null)
    const bassRef = useRef<THREE.InstancedMesh>(null)

    const dummy = useMemo(() => new THREE.Object3D(), [])
    const { size } = useThree()

    // Use shared scroll hook
    const { springProgress } = useScrollAnimation()

    // Calculate from useThree's size (no extra re-renders)
    const aspectRatio = size.width / size.height
    const isPortrait = aspectRatio < 1

    // Scale factor: reduce size on portrait screens (desktop unchanged)
    const groupScale = isPortrait ? Math.min(1, aspectRatio * 1.3) : 1

    const barsPerRow = 64
    const midBarsCount = 128 // High density

    // Colors
    // Treble: Pastel Pink/Lavender -> White
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
        // Extend visibility to allow "Dots lingering" phase
        const startVh = 6.9
        const endVh = 8.2

        // 1. Pixelate Phase (7.8 -> 8.0)
        // Bars snap to dots randomly
        let pixelateProgress = 0
        const pixStart = 7.8
        const pixEnd = 8.0

        if (scrollValue > pixStart) {
            pixelateProgress = (scrollValue - pixStart) / (pixEnd - pixStart)
            pixelateProgress = Math.min(Math.max(pixelateProgress, 0), 1)
        }

        // 2. Condense/Fade Phase (8.0 -> 8.2)
        // Dots fade out as VisualParticles takes over
        let fadeProgress = 0
        const fadeStart = 8.0
        const fadeEnd = 8.2

        if (scrollValue > fadeStart) {
            fadeProgress = (scrollValue - fadeStart) / (fadeEnd - fadeStart)
            fadeProgress = Math.min(Math.max(fadeProgress, 0), 1)
        }

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

        // --- Row 0: TREBLE ---
        if (trebleRef.current) {
            for (let i = 0; i < barsPerRow; i++) {
                const x = (i / barsPerRow - 0.5) * rowWidth

                let n = noise3D(x * 3.0, time * 2.0, 0)
                n = (n + 1) / 2

                // Deterministic Threshold
                const threshold = (Math.sin(i * 12.9898) * 43758.5453 % 1 + 1) / 2

                // Logic:
                // 1. Solid -> 2. Dot (Pixelate) -> 3. Gone (Fade)

                let scale = (0.3 + n * 0.7) * globalScale

                const isPixelated = pixelateProgress > (threshold * 0.9) // Factor slightly to delay starts
                const isGone = fadeProgress > threshold

                if (isPixelated) {
                    scale = 0.04 // Hard Snap to Dot
                }
                if (isGone) {
                    scale = 0 // Gone
                }

                // Static Position
                dummy.position.set(x, 0.9, -8)
                dummy.scale.set(scale, scale, scale)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                trebleRef.current.setMatrixAt(i, dummy.matrix)
            }
            trebleRef.current.instanceMatrix.needsUpdate = true
        }

        // --- Row 1: MID ---
        if (midRef.current) {
            for (let i = 0; i < midBarsCount; i++) {
                const x = (i / midBarsCount - 0.5) * rowWidth
                const normX = i / midBarsCount

                let nTop = noise3D(x * 0.3, time * 0.6, 0)
                let topY = (nTop * 0.8 + 0.5) * 1.3

                let nBot = noise3D(x * 0.4 + 100, time * 0.7 + 50, 100)
                let bottomY = -(nBot * 0.8 + 0.5) * 1.3

                const envelope = Math.sin(normX * Math.PI)
                topY *= envelope
                bottomY *= envelope

                let height = (topY - bottomY) * globalScale
                let centerY = (topY + bottomY) / 2 * globalScale
                const baseOffsetY = -0.3

                const threshold = (Math.sin(i * 78.233) * 43758.5453 % 1 + 1) / 2

                let sx = 0.2, sy = Math.max(0.01, height), sz = 0.2

                const isPixelated = pixelateProgress > (threshold * 0.9)
                const isGone = fadeProgress > threshold

                if (isPixelated) {
                    // Hard Snap
                    sx = 0.04; sy = 0.04; sz = 0.04
                }
                if (isGone) {
                    sx = 0; sy = 0; sz = 0
                }

                dummy.position.set(x, baseOffsetY + centerY, -8)
                dummy.scale.set(sx, sy, sz)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                midRef.current.setMatrixAt(i, dummy.matrix)
            }
            midRef.current.instanceMatrix.needsUpdate = true
        }

        // --- Row 2: BASS (Was Cylinders, now Spheres to fix "Square Grid") ---
        if (bassRef.current) {
            for (let i = 0; i < barsPerRow; i++) {
                const x = (i / barsPerRow - 0.5) * rowWidth
                let n = noise3D(x * 0.2, time * 0.5, 200); n = (n + 1) / 2
                const breathing = (Math.sin(time * 3) * 0.5 + 0.5) * 0.2
                const h = (0.5 + n * 0.8 + breathing) * globalScale

                const threshold = (Math.sin(i * 99.123) * 43758.5453 % 1 + 1) / 2

                let sx = 1.0, sy = h, sz = 1.0

                const isPixelated = pixelateProgress > (threshold * 0.9)
                const isGone = fadeProgress > threshold

                if (isPixelated) {
                    sx = 0.08; sy = 0.08; sz = 0.08 // Bass dots slightly larger
                }
                if (isGone) {
                    sx = 0; sy = 0; sz = 0
                }

                dummy.position.set(x, -2.0, -8)
                dummy.scale.set(sx, sy, sz)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                bassRef.current.setMatrixAt(i, dummy.matrix)
            }
            bassRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <group scale={[groupScale, groupScale, groupScale]}>
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

            {/* Bass - Changed to Sphere to avoid Square appearance */}
            <instancedMesh ref={bassRef} args={[undefined, undefined, barsPerRow]}>
                <sphereGeometry args={[0.3, 8, 8]} />
                <instancedBufferAttribute attach="instanceColor" args={[bassColors, 3]} />
                <meshBasicMaterial transparent opacity={0} toneMapped={false} />
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
