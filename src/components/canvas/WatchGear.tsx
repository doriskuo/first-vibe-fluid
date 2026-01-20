'use client'

import { useMemo, forwardRef } from 'react'
import * as THREE from 'three'

interface WatchGearProps {
    radius?: number
    teeth?: number
    spokes?: number
    innerRadius?: number
    thickness?: number
    depth?: number
    color?: string
    position?: [number, number, number]
    rotation?: [number, number, number]
}

/**
 * 精密機械錶風格齒輪
 * - 立體設計（有深度，任何角度都可見）
 * - 銀色金屬質感 + 輕微自發光
 * - 自然的 3D 外觀
 */
const WatchGear = forwardRef<THREE.Group, WatchGearProps>(({
    radius = 0.1,
    teeth = 20,
    spokes = 5,
    innerRadius = 0.3,
    thickness = 0.012,
    depth = 0.03,
    color = '#c0c0c0',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}, ref) => {
    const actualInnerRadius = radius * innerRadius

    // 計算齒的位置
    const teethData = useMemo(() => {
        const data = []
        for (let i = 0; i < teeth; i++) {
            const angle = (i / teeth) * Math.PI * 2
            data.push({ angle })
        }
        return data
    }, [teeth])

    // 計算輻條位置
    const spokesData = useMemo(() => {
        const data = []
        for (let i = 0; i < spokes; i++) {
            const angle = (i / spokes) * Math.PI * 2
            data.push({ angle })
        }
        return data
    }, [spokes])

    // 共用材質屬性（含 emissive，depthTest=false 確保穿透玻璃可見）
    const materialProps = {
        color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: color,
        emissiveIntensity: 0.3,
        side: THREE.DoubleSide as THREE.Side,
        depthTest: false,
    }

    return (
        <group
            ref={ref}
            position={position}
            rotation={[rotation[0], rotation[1], rotation[2]]}
        >
            {/* 外圈 */}
            <mesh>
                <torusGeometry args={[radius, thickness, 16, 64]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 外圈加厚層 - 增加立體感 */}
            <mesh position={[0, 0, depth / 2]}>
                <torusGeometry args={[radius, thickness * 0.8, 12, 64]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>
            <mesh position={[0, 0, -depth / 2]}>
                <torusGeometry args={[radius, thickness * 0.8, 12, 64]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 內圈（軸孔） */}
            <mesh>
                <torusGeometry args={[actualInnerRadius, thickness * 0.8, 12, 32]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 中心軸 */}
            <mesh>
                <cylinderGeometry args={[actualInnerRadius * 0.4, actualInnerRadius * 0.4, depth * 1.5, 16]} />
                <meshStandardMaterial {...materialProps} />
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
                        <boxGeometry args={[spokeLength, thickness * 2.5, depth]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            })}

            {/* 齒 */}
            {teethData.map((tooth, i) => (
                <mesh
                    key={`tooth-${i}`}
                    position={[
                        Math.cos(tooth.angle) * (radius + thickness),
                        Math.sin(tooth.angle) * (radius + thickness),
                        0
                    ]}
                    rotation={[0, 0, tooth.angle]}
                >
                    <boxGeometry args={[thickness * 3.5, thickness * 2, depth * 0.8]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
            ))}
        </group>
    )
})

WatchGear.displayName = 'WatchGear'

export default WatchGear
