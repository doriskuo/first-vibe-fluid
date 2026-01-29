'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export default function VisualParticles() {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Config
    const particleCount = 3000 // Denser for fog effect
    // Start later to overlap with Audio "Ghost Dots"
    const startVh = 8.0
    const endVh = 8.9

    // Condense Transition: 8.0 -> 8.5
    // Condense from scattered dots to form the sphere
    const crystallizeStart = 8.0
    const crystallizeEnd = 8.5

    const { springProgress } = useScrollAnimation()

    // Pre-calculate positions
    // 1. Random/Dispersed Positions (Matching Audio Dispersion state roughly)
    const randomPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            // Wide spread to simulate the dissolve area
            arr[i * 3] = (Math.random() - 0.5) * 20
            arr[i * 3 + 1] = (Math.random() - 0.5) * 15
            arr[i * 3 + 2] = -8 + (Math.random() - 0.5) * 10
        }
        return arr
    }, [])

    // 2. Target Positions (Crystallized Shape: Sphere Core + Foggy Halo)
    const targetPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            // Core Sphere (40% of particles) - Solid Structure
            if (i < particleCount * 0.4) {
                const phi = Math.acos(-1 + (2 * i) / (particleCount * 0.4))
                const theta = Math.sqrt((particleCount * 0.4) * Math.PI) * phi
                const r = 2.0 // Tighter core

                arr[i * 3] = r * Math.cos(theta) * Math.sin(phi)
                arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
                arr[i * 3 + 2] = -8 + r * Math.cos(phi)
            }
            // Foggy Halo / Outer Ring (60% of particles)
            // "Fog-like" -> Volumetric Cloud
            else {
                const angle = Math.random() * Math.PI * 2
                // Wide distribution radius: 3.5 to 7.0 (Soft fade out)
                const r = 3.5 + Math.pow(Math.random(), 2) * 4.0

                // Cylinder/Disc Volume
                const x = r * Math.cos(angle)
                const z = -8 + r * Math.sin(angle)
                // Y spread increases with radius (Lenticular cloud shape)
                const ySpread = 0.5 + (r - 3.5) * 0.5
                const y = (Math.random() - 0.5) * ySpread

                arr[i * 3] = x
                arr[i * 3 + 1] = y
                arr[i * 3 + 2] = z
            }
        }
        return arr
    }, [])

    // Colors
    // "Prism / Ethereal" Palette (White base + Iridescent Tints)
    const colors = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        // Palette:
        const cBase = new THREE.Color('#ffffff') // Pure White
        const cPink = new THREE.Color('#ffccff') // Pale Pink
        const cBlue = new THREE.Color('#ccffff') // Pale Cyan
        const cGold = new THREE.Color('#ffeedd') // Pale Gold

        for (let i = 0; i < particleCount; i++) {
            let c = cBase
            const r = Math.random()

            // Core: Mostly white/gold
            if (i < particleCount * 0.4) {
                if (r > 0.7) c = cGold
                else c = cBase
            }
            // Fog: Mix of pastel tints for diffraction look
            else {
                if (r > 0.6) c = cBlue
                else if (r > 0.3) c = cPink
                else c = cBase
            }

            arr[i * 3] = c.r
            arr[i * 3 + 1] = c.g
            arr[i * 3 + 2] = c.b
        }
        return arr
    }, [])

    useFrame((state) => {
        const scrollValue = springProgress.get()
        const time = state.clock.elapsedTime

        // Visibility Check
        let opacity = 0
        if (scrollValue >= startVh && scrollValue <= endVh + 0.5) {
            opacity = 1
            if (scrollValue > endVh) {
                opacity = 1 - (scrollValue - endVh) / 0.5
            }
        }

        // Soft Fade In start
        if (scrollValue >= startVh && scrollValue < startVh + 0.3) {
            opacity = (scrollValue - startVh) / 0.3
        }

        if (opacity < 0.01) {
            if (meshRef.current) meshRef.current.visible = false
            return
        }
        if (meshRef.current) {
            meshRef.current.visible = true
                ; (meshRef.current.material as THREE.MeshBasicMaterial).opacity = opacity
        }

        // Transition
        let progress = 0
        if (scrollValue > crystallizeStart) {
            progress = (scrollValue - crystallizeStart) / (crystallizeEnd - crystallizeStart)
            progress = Math.min(Math.max(progress, 0), 1)
        }

        const easeProgress = 1 - Math.pow(1 - progress, 3)

        // Heartbeat Pulse (Core)
        const pulse = 1 + Math.sin(time * 2.5) * 0.03 // Subtle heart beat

        if (meshRef.current) {
            for (let i = 0; i < particleCount; i++) {
                const rx = randomPositions[i * 3]
                const ry = randomPositions[i * 3 + 1]
                const rz = randomPositions[i * 3 + 2]

                const tx = targetPositions[i * 3]
                const ty = targetPositions[i * 3 + 1]
                const tz = targetPositions[i * 3 + 2]

                // Fog Movement (Drift)
                let driftX = 0, driftY = 0, driftZ = 0

                // Only move fog particles (index >= count * 0.4)
                if (i >= particleCount * 0.4) {
                    // Slow, cloud-like sine movement
                    driftX = Math.sin(time * 0.5 + i * 0.1) * 0.5
                    driftY = Math.cos(time * 0.3 + i * 0.2) * 0.3
                    driftZ = Math.sin(time * 0.4 + i * 0.3) * 0.5
                }

                // Core Jitter when formed
                if (i < particleCount * 0.4 && progress > 0.9) {
                    driftX = (Math.random() - 0.5) * 0.05
                    driftY = (Math.random() - 0.5) * 0.05
                    driftZ = (Math.random() - 0.5) * 0.05
                }

                // Condense logic:
                // Start from Random (rx) -> Move to Target (tx)
                let curX = rx + (tx + driftX - rx) * easeProgress
                let curY = ry + (ty + driftY - ry) * easeProgress
                let curZ = rz + (tz + driftZ - rz) * easeProgress

                // Scale
                let s = 0
                if (i < particleCount * 0.4) {
                    // Core: Solid dots + Heartbeat
                    s = (0.05 + progress * 0.03) * pulse
                } else {
                    // Fog: Very small, dust-like
                    s = 0.03 + progress * 0.02
                }

                dummy.position.set(curX, curY, curZ)
                dummy.scale.set(s, s, s)
                dummy.rotation.set(0, 0, 0)
                dummy.updateMatrix()
                meshRef.current.setMatrixAt(i, dummy.matrix)
            }
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            {/* Round Shape */}
            <sphereGeometry args={[0.08, 8, 8]} />
            <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
            {/* Additive Blending for Glow/Fog feel */}
            <meshBasicMaterial
                transparent
                opacity={0.6}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    )
}
