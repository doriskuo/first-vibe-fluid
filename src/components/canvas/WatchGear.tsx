'use client'

import { useMemo, forwardRef } from 'react'
import * as THREE from 'three'

// 齒輪風格類型
type GearStyle = 'classic' | 'slim' | 'hollow' | 'tech' | 'minimal'

interface WatchGearProps {
    radius?: number
    teeth?: number
    spokes?: number
    innerRadius?: number  // 比例：0-1
    color?: string
    glowColor?: string      // 發光顏色
    glowIntensity?: number  // 發光強度
    gearStyle?: GearStyle   // 齒輪風格
    position?: [number, number, number]
    rotation?: [number, number, number]
}

/**
 * 多樣式精密齒輪
 * 支持 5 種風格：
 * - classic: 傳統厚齒輪
 * - slim: 纖細現代風
 * - hollow: 中空設計
 * - tech: 科技感（多圈）
 * - minimal: 極簡風
 */
const WatchGear = forwardRef<THREE.Group, WatchGearProps>(({
    radius = 0.1,
    teeth = 40,
    spokes = 5,
    innerRadius = 0.25,
    color = '#a0a0a0',
    glowColor = '#00aaff',
    glowIntensity = 0.3,
    gearStyle = 'classic',
    position = [0, 0, 0],
    rotation = [0, 0, 0],
}, ref) => {
    // 基於風格調整參數
    const styleConfig = useMemo(() => {
        switch (gearStyle) {
            case 'slim':
                return { toothScale: 0.6, rimScale: 0.8, spokeWidth: 0.4, hasInnerRing: true, hasOuterRing: false }
            case 'hollow':
                return { toothScale: 0.8, rimScale: 1.0, spokeWidth: 0.3, hasInnerRing: false, hasOuterRing: true }
            case 'tech':
                return { toothScale: 0.5, rimScale: 1.2, spokeWidth: 0.35, hasInnerRing: true, hasOuterRing: true }
            case 'minimal':
                return { toothScale: 0.4, rimScale: 0.6, spokeWidth: 0.5, hasInnerRing: false, hasOuterRing: false }
            case 'classic':
            default:
                return { toothScale: 1.0, rimScale: 1.0, spokeWidth: 0.6, hasInnerRing: true, hasOuterRing: false }
        }
    }, [gearStyle])

    // 基於齒數計算模數
    const module = (2 * radius) / teeth
    const toothHeight = module * 2.2 * styleConfig.toothScale
    const toothWidth = module * (gearStyle === 'slim' ? 0.35 : gearStyle === 'tech' ? 0.4 : 0.5)
    const depth = module * 3

    const actualInnerRadius = radius * innerRadius
    const rimWidth = module * 1.5 * styleConfig.rimScale

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

    // 共用材質屬性
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

            {/* 內圈（hub）- 根據風格顯示 */}
            {styleConfig.hasInnerRing && (
                <mesh>
                    <torusGeometry args={[actualInnerRadius + rimWidth / 3, rimWidth / 3, 8, 32]} />
                    <meshStandardMaterial {...materialProps} />
                </mesh>
            )}

            {/* 額外外圈 - tech/hollow 風格 */}
            {styleConfig.hasOuterRing && (
                <mesh>
                    <torusGeometry args={[radius * 0.85, rimWidth / 4, 8, 48]} />
                    <meshStandardMaterial {...materialProps} emissiveIntensity={glowIntensity * 1.5} />
                </mesh>
            )}

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
                        <boxGeometry args={[spokeLength, rimWidth * styleConfig.spokeWidth, depth * 0.7]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            })}

            {/* hollow 風格 - 額外孔洞裝飾 */}
            {gearStyle === 'hollow' && spokesData.map((spoke, i) => {
                const holeRadius = (radius - actualInnerRadius) * 0.25
                const holePos = (radius + actualInnerRadius) / 2
                const offsetAngle = spoke.angle + (Math.PI / spokes)  // 在輻條之間
                return (
                    <mesh
                        key={`hole-${i}`}
                        position={[
                            Math.cos(offsetAngle) * holePos,
                            Math.sin(offsetAngle) * holePos,
                            0
                        ]}
                        rotation={[Math.PI / 2, 0, 0]}
                    >
                        <torusGeometry args={[holeRadius, holeRadius * 0.3, 8, 16]} />
                        <meshStandardMaterial {...materialProps} emissiveIntensity={glowIntensity * 1.2} />
                    </mesh>
                )
            })}

            {/* 齒 - 根據風格調整形狀 */}
            {teethData.map((tooth, i) => {
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
                        <boxGeometry args={[toothHeight, toothWidth, depth * 0.9]} />
                        <meshStandardMaterial {...materialProps} />
                    </mesh>
                )
            })}

            {/* tech 風格 - 額外裝飾小圓點 */}
            {gearStyle === 'tech' && [0, 1, 2, 3].map((i) => {
                const dotAngle = (i / 4) * Math.PI * 2 + Math.PI / 8
                const dotRadius = radius * 0.65
                return (
                    <mesh
                        key={`dot-${i}`}
                        position={[
                            Math.cos(dotAngle) * dotRadius,
                            Math.sin(dotAngle) * dotRadius,
                            depth * 0.3
                        ]}
                    >
                        <sphereGeometry args={[rimWidth * 0.25, 8, 8]} />
                        <meshStandardMaterial {...materialProps} emissiveIntensity={glowIntensity * 2} />
                    </mesh>
                )
            })}
        </group>
    )
})

WatchGear.displayName = 'WatchGear'

export default WatchGear
