'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

export default function VisualParticles() {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Config
    // Config
    const particleCount = 15000 // HIGH DENSITY for solid rings
    const startVh = 8.0
    const endVh = 18.9

    const crystallizeStart = 8.0
    const crystallizeEnd = 8.5

    const portalStart = 8.9
    const portalEnd = 18.9

    const { springProgress } = useScrollAnimation()

    // Pre-calculate positions
    const randomPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            // Tighter spawn area for initial cloud to prevent huge spread
            arr[i * 3] = (Math.random() - 0.5) * 40
            arr[i * 3 + 1] = (Math.random() - 0.5) * 40
            arr[i * 3 + 2] = (Math.random() - 0.5) * 80
        }
        return arr
    }, [])

    const targetPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            // Core Sphere (Initial State)
            if (i < particleCount * 0.3) {
                // Tighter core
                const phi = Math.acos(-1 + (2 * i) / (particleCount * 0.3))
                const theta = Math.sqrt((particleCount * 0.3) * Math.PI) * phi
                const r = 2.0
                arr[i * 3] = r * Math.cos(theta) * Math.sin(phi)
                arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
                arr[i * 3 + 2] = -8 + r * Math.cos(phi)
            }
            // Fog / Tunnel Walls (Initial State)
            else {
                const angle = Math.random() * Math.PI * 2
                const r = 3.5 + Math.pow(Math.random(), 2) * 8.0
                const x = r * Math.cos(angle)
                const z = -8 + (Math.random() - 0.5) * 10

                const ySpread = 0.5 + (r - 3.5) * 0.5
                const y = (Math.random() - 0.5) * ySpread

                arr[i * 3] = x
                arr[i * 3 + 1] = y
                arr[i * 3 + 2] = z
            }
        }
        return arr
    }, [])




    // Define the "Snake" Path
    const tunnelCurve = useMemo(() => {
        // Exaggerated S-Curve for "Snake" feel
        const points = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 0, -20),
            new THREE.Vector3(30, 20, -80),     // Sharp Right Up
            new THREE.Vector3(-20, -30, -160),  // Sharp Left Down
            new THREE.Vector3(-40, 10, -240),   // Sharp Left Up
            new THREE.Vector3(30, -20, -320),   // Sharp Right Down
            new THREE.Vector3(0, 0, -500),      // Return Center
        ]
        return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.5)
    }, [])

    const tunnelData = useMemo(() => {
        // Pre-calculate Ring Assignments
        // We want distinct bands of light (Rings)
        const arr = new Float32Array(particleCount * 3)

        const totalRings = 120 // 120 rings * ~125 particles = 15000 (High Density)
        const particlesPerRing = Math.floor(particleCount / totalRings)

        for (let i = 0; i < particleCount; i++) {
            // Assign to a specific ring
            const ringIndex = Math.floor(i / particlesPerRing)
            const normalizedRingPos = ringIndex / totalRings // 0.0 to 1.0 along the path

            // Assign angle within the ring (0 to 2PI)
            const pIndexInRing = i % particlesPerRing
            const angle = (pIndexInRing / particlesPerRing) * Math.PI * 2

            // RESTORE THICKNESS: Moderate jitter for "thick neon" look (not laser thin)
            const radiusJitter = 0.85 + Math.random() * 0.3
            const angleJitter = (Math.random() - 0.5) * 0.1

            arr[i * 3] = normalizedRingPos // x: Position along curve (0-1)
            arr[i * 3 + 1] = angle + angleJitter // y: Angle
            arr[i * 3 + 2] = radiusJitter   // z: Radius scale
        }
        return arr
    }, [])

    const colors = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        // Darker, more mysterious palate for the black hole
        const cBase = new THREE.Color('#88aaff')
        const cHighlight = new THREE.Color('#ffffff')
        const cVoid = new THREE.Color('#4400cc') // Deep purple/blue

        for (let i = 0; i < particleCount; i++) {
            let c = cBase
            const r = Math.random()

            if (r > 0.9) c = cHighlight
            else if (r > 0.5) c = cVoid

            // Core is brighter
            if (i < particleCount * 0.3) {
                c = new THREE.Color('#ffffff').lerp(cVoid, Math.random() * 0.5)
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

        // Global Visibility Logic
        let globalOpacity = 0
        if (scrollValue >= startVh) {
            globalOpacity = 1
            // Fade in
            if (scrollValue < startVh + 0.5) {
                globalOpacity = (scrollValue - startVh) / 0.5
            }
        }

        if (globalOpacity < 0.01) {
            if (meshRef.current) meshRef.current.visible = false
            return
        }
        if (meshRef.current) {
            meshRef.current.visible = true
                // Fade out REMOVED for Galaxy Exit
                /* if (scrollValue > 18.0) {
                    globalOpacity *= Math.max(0, 1 - (scrollValue - 18.0))
                } */
                ; (meshRef.current.material as THREE.MeshBasicMaterial).opacity = globalOpacity
        }

        // --- STAGE 1: Crystallize / Sphere Formation (8.0 - 8.9) ---
        let crystalProgress = 0
        if (scrollValue > crystallizeStart) {
            crystalProgress = (scrollValue - crystallizeStart) / (crystallizeEnd - crystallizeStart)
            crystalProgress = Math.min(Math.max(crystalProgress, 0), 1)
        }
        const easeCrystal = 1 - Math.pow(1 - crystalProgress, 3)

        // --- STAGE 2: Portal Vortex -> Curved Tunnel (8.9 - 18.9) ---
        let portalProgress = 0
        if (scrollValue > portalStart) {
            portalProgress = (scrollValue - portalStart) / (portalEnd - portalStart)
            portalProgress = Math.min(Math.max(portalProgress, 0), 1)
        }

        // Sub-phases
        // 0.0 - 0.05: Morph from Sphere to Tunnel Start
        // 0.05 - 1.0: Fly through Tunnel
        // Transition Phase: 0 -> 0.1 (Implode & Open Hole)
        const transformPhase = Math.min(portalProgress * 10.0, 1.0)

        // Speed Calculation: Base + Scroll Surge
        // We want a constant flow + boost when scrolling
        const baseSpeed = 0.05 // Constant idle flow
        const surge = Math.pow(portalProgress, 2) * 2.0 // Acceleration
        const flowSpeed = time * 0.05 + surge

        if (meshRef.current) {
            const upVec = new THREE.Vector3(0, 1, 0) // Stable skyline

            for (let i = 0; i < particleCount; i++) {
                // --- 1. Base State: Sphere/Cloud ---
                const rx = randomPositions[i * 3]
                const ry = randomPositions[i * 3 + 1]
                const rz = randomPositions[i * 3 + 2]

                const tx = targetPositions[i * 3]
                const ty = targetPositions[i * 3 + 1]
                const tz = targetPositions[i * 3 + 2]

                // Idle Drift
                const driftX = Math.sin(time * 0.5 + i) * 0.1
                const driftY = Math.cos(time * 0.3 + i) * 0.1
                const driftZ = Math.sin(time * 0.4 + i) * 0.1

                let curX = rx + (tx + driftX - rx) * easeCrystal
                let curY = ry + (ty + driftY - ry) * easeCrystal
                let curZ = rz + (tz + driftZ - rz) * easeCrystal

                // --- 2. Tunnel Transformation ---
                if (portalProgress > 0) {
                    // Pre-calculated stats from tunnelData
                    const ringStartU = tunnelData[i * 3]    // 0.0 - 1.0 (Fixed Ring Pos)
                    const ringAngle = tunnelData[i * 3 + 1] // Angle
                    const radiusScale = tunnelData[i * 3 + 2]

                    // Motion: Ring moves along the curve
                    // We want rings to come FROM deep (-Z) TOWARDS camera (0)
                    // Curve is defined 0 -> -500
                    // So we want u to go from 1.0 -> 0.0

                    // (ringStartU + flow) % 1.0 = increasing 0->1
                    // So we invert it:
                    let loopProgress = (ringStartU + flowSpeed * 0.2) % 1.0
                    let u = 1.0 - loopProgress

                    // GET CURVE DATA
                    const point = tunnelCurve.getPointAt(u)
                    const tangent = tunnelCurve.getTangentAt(u).normalize()

                    // Frenet Frame (No Twist / Locked Up)
                    let right = new THREE.Vector3().crossVectors(tangent, upVec).normalize()
                    if (right.lengthSq() < 0.001) {
                        // Handle vertical edge case
                        right.set(1, 0, 0)
                    }
                    const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize()

                    // Project point onto the ring plane
                    let ringRadius = 5.0 * radiusScale
                    // Pulse ring size
                    ringRadius += Math.sin(u * 20 - time * 2) * 0.5

                    // Organic Wobble (Noise)
                    // Add sine wave offset based on angle and time
                    const wobble = Math.sin(ringAngle * 3 + time * 2 + u * 10) * 0.2
                    ringRadius += wobble

                    // TRANSITION: OPENING HOLE EFFECT
                    // Grows from 0 (closed) to full tunnel radius
                    ringRadius *= Math.pow(transformPhase, 0.5)

                    const tX = point.x + right.x * Math.cos(ringAngle) * ringRadius + correctedUp.x * Math.sin(ringAngle) * ringRadius
                    const tY = point.y + right.y * Math.cos(ringAngle) * ringRadius + correctedUp.y * Math.sin(ringAngle) * ringRadius
                    const tZ = point.z + right.z * Math.cos(ringAngle) * ringRadius + correctedUp.z * Math.sin(ringAngle) * ringRadius

                    // --- BLEND: Sphere -> Tunnel ---
                    // Smoothly interpolate positions
                    curX = THREE.MathUtils.lerp(curX, tX, transformPhase)
                    curY = THREE.MathUtils.lerp(curY, tY, transformPhase)
                    curZ = THREE.MathUtils.lerp(curZ, tZ, transformPhase)

                    // --- WARP EFFECT ---
                    let scaleZ = 1.0
                    if (portalProgress > 0.1) {
                        scaleZ = 1.0 + portalProgress * 10
                    }
                    // Random flutter
                    if (Math.random() > 0.8) scaleZ *= 1.5

                    dummy.scale.set(0.05, 0.05, 0.05 * scaleZ)

                    // Orient particle to face direction of travel
                    dummy.lookAt(
                        curX + tangent.x,
                        curY + tangent.y,
                        curZ + tangent.z
                    )
                } else {
                    // Normal Sphere Scale
                    let s = 0.05
                    if (i < particleCount * 0.3) s = 0.08
                    dummy.scale.set(s, s, s)
                    dummy.rotation.set(0, 0, 0) // Reset rotation
                }

                // --- STAGE 3: Galaxy Exit & Dispersal ---
                if (scrollValue > 17.5) {
                    const exitPhase = Math.min((scrollValue - 17.5) / 1.5, 1.0)
                    const dispersal = 200.0 * Math.pow(exitPhase, 2)

                    curX += (Math.random() - 0.5) * dispersal
                    curY += (Math.random() - 0.5) * dispersal
                    curZ += (Math.random() - 0.5) * dispersal * 0.5
                }

                // Opacity Logic
                let pOpacity = 1.0
                if (portalProgress > 0) {
                    // Fade if too close to camera (Clip plane)
                    if (curZ > 4) pOpacity = 0
                    else if (curZ > 0) pOpacity = (4 - curZ) / 4.0

                    // Fade if too far (Deep fog)
                    if (curZ < -400) pOpacity = Math.max(0, (curZ + 500) / 100)
                }

                dummy.position.set(curX, curY, curZ)
                // Use scale for visibility
                dummy.scale.multiplyScalar(pOpacity)

                dummy.updateMatrix()
                meshRef.current.setMatrixAt(i, dummy.matrix)
            }
            meshRef.current.instanceMatrix.needsUpdate = true
        }
    })

    return (
        <instancedMesh ref={meshRef} args={[undefined, undefined, particleCount]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <instancedBufferAttribute attach="instanceColor" args={[colors, 3]} />
            <meshBasicMaterial
                transparent
                opacity={1}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
            />
        </instancedMesh>
    )
}
