'use client'

import { useMemo, forwardRef } from 'react'
import * as THREE from 'three'

interface WatchGearProps {
    radius?: number
    teeth?: number
    spokes?: number
    innerRadius?: number  // 比例：0-1
    color?: string
    glowColor?: string      // 發光顏色
    glowIntensity?: number  // 發光強度
    position?: [number, number, number]
    rotation?: [number, number, number]
}

/**
 * 精密機械錶風格齒輪 + 數位科技發光效果
 * - 密集齒形設計（更像真實手錶齒輪）
 * - 銀色金屬質感 + 可自訂發光顏色
 * - 可與其他齒輪正確咬合
 */
const WatchGear = forwardRef<THREE.Group, WatchGearProps>(({
    radius = 0.1,
    teeth = 40,
    spokes = 5,
    innerRadius = 0.25,  // 內圈半徑比例
    color = '#a0a0a0',
    glowColor = '#00aaff',    // 預設藍色科技感
    glowIntensity = 0.3,      // 預設發光強度
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}, ref) => {
    // 基於齒數計算模數（module）
    const module = (2 * radius) / teeth
    const toothHeight = module * 2.2  // 齒高
    const toothWidth = module * 0.5   // 齒寬（更細）
    const depth = module * 3          // 齒輪厚度

    const actualInnerRadius = radius * innerRadius
    const rimWidth = module * 1.5     // 外圈寬度

    // 計算齒的位置（involute 近似）
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

    // 共用材質屬性 - 數位科技風格
    const materialProps = {
        color,
        metalness: 0.85,
        roughness: 0.2,
        emissive: glowColor,
        emissiveIntensity: glowIntensity,
        side: THREE.DoubleSide as THREE.Side,
        depthTest: false,
    }

    return (
        <group
            ref={ref}
            position={position}
            rotation={[rotation[0], rotation[1], rotation[2]]}
        >
            {/* 外圈（rim）- 齒輪本體 */}
            <mesh>
                <torusGeometry args={[radius - rimWidth / 2, rimWidth / 2, 8, 64]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 內圈（hub）*/}
            <mesh>
                <torusGeometry args={[actualInnerRadius + rimWidth / 3, rimWidth / 3, 8, 32]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 中心軸孔 */}
            <mesh>
                <cylinderGeometry args={[actualInnerRadius * 0.5, actualInnerRadius * 0.5, depth * 1.2, 16]} />
                <meshStandardMaterial {...materialProps} />
            </mesh>

            {/* 輻條 - 連接內圈和外圈 */}
            {spokesData.map((spoke, i) => {
                const spokeLength = radius - actualInnerRadius - rimWidth
                const midRadius = (radius - rimWidth / 2 + actualInnerRadius + rimWidth / 3) / 2
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
                        <boxGeometry args={[spokeLength, rimWidth * 0.6, depth * 0.7]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            })}

            {/* 齒 - 密集排列，細小尖銳 */}
            {teethData.map((tooth, i) => {
                // 齒的位置在外圈邊緣
                const toothRadius = radius + toothHeight / 2
                return (
                    <mesh
                        key={`tooth-${i}`}
                        position={[
                            Math.cos(tooth.angle) * toothRadius,
                            Math.sin(tooth.angle) * toothRadius,
                            0
                        ]}
                        rotation={[0, 0, tooth.angle]}
                    >
                        {/* 使用梯形近似齒形 */}
                        <boxGeometry args={[toothHeight, toothWidth, depth * 0.9]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            })}
        </group>
    )
})

WatchGear.displayName = 'WatchGear'

export default WatchGear
