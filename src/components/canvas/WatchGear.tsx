'use client'

import { useMemo, forwardRef } from 'react'
import * as THREE from 'three'

interface WatchGearProps {
    radius?: number
    teeth?: number
    spokes?: number        // 輻條數量
    innerRadius?: number   // 內圈半徑
    thickness?: number
    color?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
}

/**
 * 精密機械錶風格齒輪
 * - 有輻條（鏤空設計）
 * - 銀色金屬質感
 * - 精細齒
 */
const WatchGear = forwardRef<THREE.Group, WatchGearProps>(({
    radius = 0.1,
    teeth = 20,
    spokes = 5,
    innerRadius = 0.3,  // 比例
    thickness = 0.008,
    color = '#c0c0c0',  // 銀色
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}, ref) => {
    const actualInnerRadius = radius * innerRadius

    // 計算齒的位置
    const teethData = useMemo(() => {
        const data = []
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2
            data.push({
                angle,
                x: Math.cos(angle) * radius,
                y: Math.sin(angle) * radius,
            })
        }
        return data
    }, [radius, teeth])

    // 計算輻條位置
    const spokesData = useMemo(() => {
        const data = []
        for (let i = 0; i < spokes; i++) {
            const angle = (i / spokes) * Math.PI * 2
            data.push({ angle })
        }
        return data
    }, [spokes])

    return (
        <group
            ref={ref}
            position={position}
            rotation={[rotation[0], rotation[1], rotation[2]]}
        >
            {/* 外圈 */}
            <mesh>
                <torusGeometry args={[radius, thickness * 1.5, 8, 64]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.95}
                    roughness={0.1}
                />
            </mesh>

            {/* 內圈（軸孔） */}
            <mesh>
                <torusGeometry args={[actualInnerRadius, thickness, 8, 32]} />
                <meshStandardMaterial
                    color={color}
                    metalness={0.95}
                    roughness={0.1}
                />
            </mesh>

            {/* 輻條 */}
            {spokesData.map((spoke, i) => {
                const spokeLength = radius - actualInnerRadius - thickness * 2
                const midRadius = (radius + actualInnerRadius) / 2
                return (
                    <mesh
                        key={`spoke-${i}`}
                        position={[
                            Math.cos(spoke.angle) * midRadius,
                            Math.sin(spoke.angle) * midRadius,
                            0
                        ]}
                        rotation={[0, 0, spoke.angle]}
                    >
                        <boxGeometry args={[spokeLength, thickness * 2, thickness]} />
                        <meshStandardMaterial
                            color={color}
                            metalness={0.95}
                            roughness={0.1}
                        />
                    </mesh>
                )
            })}

            {/* 齒 */}
            {teethData.map((tooth, i) => (
                <mesh
                    key={`tooth-${i}`}
                    position={[
                        Math.cos(tooth.angle) * (radius + thickness * 2),
                        Math.sin(tooth.angle) * (radius + thickness * 2),
                        0
                    ]}
                    rotation={[0, 0, tooth.angle]}
                >
                    <boxGeometry args={[thickness * 3, thickness * 1.5, thickness]} />
                    <meshStandardMaterial
                        color={color}
                        metalness={0.95}
                        roughness={0.1}
                    />
                </mesh>
            ))}
        </group>
    )
})

WatchGear.displayName = 'WatchGear'

export default WatchGear
