'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { SimplexNoise } from 'three/examples/jsm/math/SimplexNoise.js'

export default function VisualParticles() {
    const meshRef = useRef<THREE.InstancedMesh>(null)
    const dummy = useMemo(() => new THREE.Object3D(), [])

    // Config
    const particleCount = 60000
    const startVh = 8.0
    const endVh = 22.0

    const crystallizeStart = 8.0
    const crystallizeEnd = 8.5

    const portalStart = 8.9
    const portalEnd = 49.0    // Matches new scrollValue max (48.9)

    const { springProgress } = useScrollAnimation()

    // Pre-calculate positions
    const randomPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            arr[i * 3] = (Math.random() - 0.5) * 40
            arr[i * 3 + 1] = (Math.random() - 0.5) * 40
            arr[i * 3 + 2] = (Math.random() - 0.5) * 80
        }
        return arr
    }, [])

    const targetPositions = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        for (let i = 0; i < particleCount; i++) {
            // Core Sphere
            if (i < particleCount * 0.3) {
                const phi = Math.acos(-1 + (2 * i) / (particleCount * 0.3))
                const theta = Math.sqrt((particleCount * 0.3) * Math.PI) * phi
                const r = 2.0
                arr[i * 3] = r * Math.cos(theta) * Math.sin(phi)
                arr[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi)
                arr[i * 3 + 2] = -8 + r * Math.cos(phi)
            }
            // Fog
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


    // tunnelCurve is now DYNAMIC - will be created inside useFrame based on flowSpeed
    // This placeholder is just for type reference
    const tunnelCurveRef = useRef<THREE.CatmullRomCurve3 | null>(null)

    const tunnelData = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        const totalRings = 120
        const particlesPerRing = Math.floor(particleCount / totalRings)

        for (let i = 0; i < particleCount; i++) {
            const ringIndex = Math.floor(i / particlesPerRing)
            const normalizedRingPos = ringIndex / totalRings
            const pIndexInRing = i % particlesPerRing
            const angle = (pIndexInRing / particlesPerRing) * Math.PI * 2
            const radiusJitter = 0.85 + Math.random() * 0.3
            const angleJitter = (Math.random() - 0.5) * 0.1

            arr[i * 3] = normalizedRingPos
            arr[i * 3 + 1] = angle + angleJitter
            arr[i * 3 + 2] = radiusJitter
        }
        return arr
    }, [])

    const colors = useMemo(() => {
        const arr = new Float32Array(particleCount * 3)
        const cBase = new THREE.Color('#88aaff')
        const cHighlight = new THREE.Color('#ffffff')
        const cVoid = new THREE.Color('#4400cc')

        for (let i = 0; i < particleCount; i++) {
            let c = cBase
            const r = Math.random()
            if (r > 0.9) c = cHighlight
            else if (r > 0.5) c = cVoid
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

        let globalOpacity = 0
        if (scrollValue >= startVh) {
            globalOpacity = 1
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
                ; (meshRef.current.material as THREE.MeshBasicMaterial).opacity = globalOpacity
        }

        const easeCrystal = 1 - Math.pow(1 - Math.min(Math.max((scrollValue - crystallizeStart) / (crystallizeEnd - crystallizeStart), 0), 1), 3)

        let portalProgress = 0
        if (scrollValue > portalStart) {
            portalProgress = Math.min(Math.max((scrollValue - portalStart) / (portalEnd - portalStart), 0), 1)
        }

        // gatherPhase: 收縮聚攏 (加速版 - 0%~10% 進度即完成)
        // tunnelPhase: 隧道形成 (10% 開始)
        const gatherPhase = Math.min(portalProgress * 10, 1.0)   // 10% 進度內完成聚攏 (原本 30%)
        const tunnelPhase = Math.max(0, (portalProgress - 0.1) / 0.9)  // 10% 開始隧道 (原本 30%)

        // SPEED & SURGE - Boosted for speed
        const velocity = Math.abs(springProgress.getVelocity())
        const speedBoost = velocity * 2.0 // Dynamic boost based on how fast user scrolls

        const surge = Math.pow(portalProgress, 1.5) * 80.0 // Increased from 50.0 to 80.0
        const flowSpeed = time * 0.2 + surge + speedBoost

        if (meshRef.current) {
            const upVec = new THREE.Vector3(0, 1, 0)

            // 2. PRE-CALCULATE TUNNEL CURVE (Once per frame)
            let tunnelCurve: THREE.CatmullRomCurve3 | null = null
            let tunnelLength = 250

            if (portalProgress > 0) {
                const bendPhase = flowSpeed * 0.5
                const bendAmplitude = 50

                const dynamicPoints = [
                    new THREE.Vector3(0, 0, 0),             // Start
                    new THREE.Vector3(0, 0, -50),           // Straight
                    new THREE.Vector3(0, 0, -100),          // Still Straight (Deep)
                    new THREE.Vector3(0, 0, -120),          // Still Straight (Very Deep)
                    new THREE.Vector3(
                        Math.sin(bendPhase * 1.0) * bendAmplitude * 0.5,
                        Math.cos(bendPhase * 0.7) * bendAmplitude * 0.3,
                        -150                                // First bend starts here (Deep)
                    ),
                    new THREE.Vector3(
                        Math.sin(bendPhase * 1.2 + 1.0) * bendAmplitude,
                        Math.cos(bendPhase * 0.9 + 0.5) * bendAmplitude * 0.7,
                        -200                                // Full bend
                    ),
                    new THREE.Vector3(
                        Math.sin(bendPhase * 0.8 + 2.0) * bendAmplitude * 0.6,
                        Math.cos(bendPhase * 0.6 + 1.0) * bendAmplitude * 0.4,
                        -250                                // Far end
                    ),
                ]
                tunnelCurve = new THREE.CatmullRomCurve3(dynamicPoints, false, 'catmullrom', 0.5)
            }

            for (let i = 0; i < particleCount; i++) {
                // 1. BASE STATE
                const rx = randomPositions[i * 3]
                const ry = randomPositions[i * 3 + 1]
                const rz = randomPositions[i * 3 + 2]

                const tx = targetPositions[i * 3]
                const ty = targetPositions[i * 3 + 1]
                const tz = targetPositions[i * 3 + 2]

                const driftX = Math.sin(time * 0.5 + i) * 0.1
                const driftY = Math.cos(time * 0.3 + i) * 0.1
                const driftZ = Math.sin(time * 0.4 + i) * 0.1

                let curX = rx + (tx + driftX - rx) * easeCrystal
                let curY = ry + (ty + driftY - ry) * easeCrystal
                let curZ = rz + (tz + driftZ - rz) * easeCrystal

                // 2. TUNNEL TRANSFORMATION
                if (tunnelCurve && portalProgress > 0) {
                    const ringStartU = tunnelData[i * 3]
                    const ringAngle = tunnelData[i * 3 + 1]
                    const radiusScale = tunnelData[i * 3 + 2]

                    // Curve is already created outside loop

                    // Each ring has a fixed position in the curve (0 to 1)
                    // The "flow" is achieved by shifting this position toward camera over time
                    const flowOffset = (flowSpeed * 30) % tunnelLength  // How much the curve has flowed

                    // Ring's world Z position (flows toward camera)
                    const baseZ = -ringStartU * tunnelLength  // Fixed depth in curve
                    const worldZ = baseZ + flowOffset  // Shifted by flow

                    // When worldZ > 0, the ring has passed the camera - wrap to back
                    const wrappedZ = worldZ > 0 ? worldZ - tunnelLength : worldZ

                    // Get curve shape at this Z depth
                    const depthRatio = Math.abs(wrappedZ) / tunnelLength  // 0 = at camera, 1 = far
                    const u = Math.min(Math.max(depthRatio, 0), 0.99)

                    const point = tunnelCurve.getPointAt(u)
                    const tangent = tunnelCurve.getTangentAt(u).normalize()
                    let right = new THREE.Vector3().crossVectors(tangent, upVec).normalize()
                    if (right.lengthSq() < 0.001) right.set(1, 0, 0)
                    const correctedUp = new THREE.Vector3().crossVectors(right, tangent).normalize()

                    const gX = Math.cos(ringAngle) * 2.0
                    const gY = Math.sin(ringAngle) * 2.0
                    const gZ = -8.0

                    let tRadius = 6.0 * radiusScale
                    tRadius += Math.sin(u * 15 - time * 2) * 0.3
                    tRadius += Math.sin(ringAngle * 3 + time * 1.5) * 0.2

                    // Position: curve XY offset + ring shape
                    const tX = point.x + right.x * Math.cos(ringAngle) * tRadius + correctedUp.x * Math.sin(ringAngle) * tRadius
                    const tY = point.y + right.y * Math.cos(ringAngle) * tRadius + correctedUp.y * Math.sin(ringAngle) * tRadius
                    const tZ = wrappedZ

                    if (portalProgress < 0.1) {
                        curX = THREE.MathUtils.lerp(curX, gX, gatherPhase)
                        curY = THREE.MathUtils.lerp(curY, gY, gatherPhase)
                        curZ = THREE.MathUtils.lerp(curZ, gZ, gatherPhase)
                    } else {
                        // burst 指數越小，隧道延伸越快 (原本 2.0，現在 0.7)
                        const burst = Math.pow(tunnelPhase, 0.7)
                        curX = THREE.MathUtils.lerp(gX, tX, burst)
                        curY = THREE.MathUtils.lerp(gY, tY, burst)
                        curZ = THREE.MathUtils.lerp(gZ, tZ, burst)
                    }

                    let scaleZ = 1.0
                    if (portalProgress > 0.1) scaleZ = 1.0 + portalProgress * 10
                    if (Math.random() > 0.8) scaleZ *= 1.5
                    dummy.scale.set(0.05, 0.05, 0.05 * scaleZ)

                    dummy.lookAt(curX + tangent.x, curY + tangent.y, curZ + tangent.z)
                } else {
                    let s = 0.05
                    if (i < particleCount * 0.3) s = 0.08
                    dummy.scale.set(s, s, s)
                    dummy.rotation.set(0, 0, 0)
                }

                // 3. GALAXY EXIT - only in last 5% of scroll
                if (scrollValue > portalEnd - 0.5) {
                    const exitPhase = Math.min((scrollValue - (portalEnd - 0.5)) / 0.5, 1.0)
                    const dispersal = 80.0 * Math.pow(exitPhase, 1.5)

                    curX += (Math.random() - 0.5) * dispersal
                    curY += (Math.random() - 0.5) * dispersal
                    curZ += (Math.random()) * dispersal * 0.5
                }

                // 4. VR RETURN TO CENTER - particles slow down and become subtle
                // Keep atmosphere but don't steal focus from VR
                const vrReturnStart = portalEnd  // 49.0
                const vrReturnEnd = portalEnd + 1.5  // Transition over 1.5 units
                let vrReturnFade = 1.0

                if (scrollValue > vrReturnStart) {
                    const fadeProgress = Math.min((scrollValue - vrReturnStart) / (vrReturnEnd - vrReturnStart), 1.0)
                    // Fade to 30% opacity (not completely gone) - 保留氛圍感
                    vrReturnFade = 1.0 - fadeProgress * 0.7  // 1.0 -> 0.3

                    // Slow down particle movement significantly
                    const slowDown = 1.0 - fadeProgress * 0.9  // Almost stop but not completely
                    curX *= slowDown
                    curY *= slowDown
                }

                // Opacity - fade distant particles to focus view inside tunnel
                let pOpacity = 1.0
                if (portalProgress > 0) {
                    if (curZ > 4) pOpacity = 0
                    else if (curZ > 0) pOpacity = (4 - curZ) / 4.0
                    // More aggressive fade: z=-150 to z=-240
                    if (curZ < -150) pOpacity *= Math.max(0, (curZ + 240) / 90)
                }

                // Apply VR return fade
                pOpacity *= vrReturnFade

                dummy.position.set(curX, curY, curZ)
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
