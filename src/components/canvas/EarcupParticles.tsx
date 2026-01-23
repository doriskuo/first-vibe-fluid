'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface EarcupParticlesProps {
    visible: boolean
    opacity: number  // 0-1
    parentRotation: THREE.Euler
}

const PARTICLE_COUNT = 60

/**
 * EarcupParticles - 耳罩內部粒子效果
 * 
 * 粒子隨機浮動，週期性聚合→分散
 */
export default function EarcupParticles({
    visible,
    opacity,
    parentRotation
}: EarcupParticlesProps) {
    const groupRef = useRef<THREE.Group>(null)
    const leftPointsRef = useRef<THREE.Points>(null)
    const rightPointsRef = useRef<THREE.Points>(null)

    // 初始化粒子位置和屬性
    const { leftPositions, rightPositions, randomSeeds } = useMemo(() => {
        const leftPos = new Float32Array(PARTICLE_COUNT * 3)
        const rightPos = new Float32Array(PARTICLE_COUNT * 3)
        const seeds = new Float32Array(PARTICLE_COUNT)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // 隨機分佈在圓形區域內
            const angle = Math.random() * Math.PI * 2
            const radius = Math.random() * 0.08
            const x = Math.cos(angle) * radius
            const y = Math.sin(angle) * radius
            const z = (Math.random() - 0.5) * 0.02

            leftPos[i * 3] = x
            leftPos[i * 3 + 1] = y
            leftPos[i * 3 + 2] = z

            rightPos[i * 3] = x
            rightPos[i * 3 + 1] = y
            rightPos[i * 3 + 2] = z

            seeds[i] = Math.random()
        }

        return { leftPositions: leftPos, rightPositions: rightPos, randomSeeds: seeds }
    }, [])

    // 顏色：霓虹漸層
    const colors = useMemo(() => {
        const cols = new Float32Array(PARTICLE_COUNT * 3)
        const colorPalette = [
            new THREE.Color('#00CED1'),  // 深青綠
            new THREE.Color('#8B00FF'),  // 深紫
            new THREE.Color('#FF1493'),  // 深粉紅
            new THREE.Color('#00FF7F'),  // 春綠
        ]

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            const color = colorPalette[Math.floor(Math.random() * colorPalette.length)]
            cols[i * 3] = color.r
            cols[i * 3 + 1] = color.g
            cols[i * 3 + 2] = color.b
        }

        return cols
    }, [])

    useFrame((state) => {
        if (!groupRef.current || !visible) return

        // 同步旋轉
        groupRef.current.rotation.copy(parentRotation)

        const time = state.clock.elapsedTime

        // 更新粒子位置：聚合 ↔ 分散
        const updateParticles = (points: THREE.Points | null, basePositions: Float32Array) => {
            if (!points) return

            const positions = points.geometry.attributes.position.array as Float32Array
            const cycleTime = 4  // 4 秒一個週期
            const phase = (time % cycleTime) / cycleTime

            // 0-0.5: 分散, 0.5-1: 聚合
            const disperseFactor = Math.sin(phase * Math.PI)

            for (let i = 0; i < PARTICLE_COUNT; i++) {
                const seed = randomSeeds[i]
                const baseX = basePositions[i * 3]
                const baseY = basePositions[i * 3 + 1]
                const baseZ = basePositions[i * 3 + 2]

                // 加入隨機抖動
                const jitterX = Math.sin(time * 3 + seed * 10) * 0.01
                const jitterY = Math.cos(time * 2.5 + seed * 15) * 0.01
                const jitterZ = Math.sin(time * 2 + seed * 20) * 0.005

                // 聚合時向中心收攏，分散時向外擴展
                const scale = 0.3 + disperseFactor * 0.7

                positions[i * 3] = baseX * scale + jitterX
                positions[i * 3 + 1] = baseY * scale + jitterY
                positions[i * 3 + 2] = baseZ + jitterZ
            }

            points.geometry.attributes.position.needsUpdate = true
        }

        updateParticles(leftPointsRef.current, leftPositions)
        updateParticles(rightPointsRef.current, rightPositions)

        // 更新透明度
        if (leftPointsRef.current) {
            (leftPointsRef.current.material as THREE.PointsMaterial).opacity = opacity
        }
        if (rightPointsRef.current) {
            (rightPointsRef.current.material as THREE.PointsMaterial).opacity = opacity
        }
    })

    if (!visible) return null

    console.log('EarcupParticles RENDERING, opacity:', opacity)

    // 耳罩位置
    const xOffset = 0.38
    const yOffset = -0.22

    return (
        <group ref={groupRef}>
            {/* 左耳罩粒子 */}
            <points ref={leftPointsRef} position={[-xOffset, yOffset, 0]}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[leftPositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[colors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.008}
                    vertexColors
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>

            {/* 右耳罩粒子 */}
            <points ref={rightPointsRef} position={[xOffset, yOffset, 0]}>
                <bufferGeometry>
                    <bufferAttribute
                        attach="attributes-position"
                        args={[rightPositions, 3]}
                    />
                    <bufferAttribute
                        attach="attributes-color"
                        args={[colors, 3]}
                    />
                </bufferGeometry>
                <pointsMaterial
                    size={0.008}
                    vertexColors
                    transparent
                    opacity={opacity}
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                    sizeAttenuation={true}
                />
            </points>
        </group>
    )
}
