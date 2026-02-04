'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { RoundedBox } from '@react-three/drei'

// ==================== [組件] 玻璃面板 (Premium Crystal) ====================
// 使用 RoundedBox 製作有厚度、有導角的精品玻璃
function GlassPanel({
    width = 0.3,
    height = 0.2,
    opacity = 1,
    children,
    color = '#ffffff' // 預設改為純淨白或微透藍，讓 attenuation 決定顏色
}: {
    width?: number
    height?: number
    opacity?: number
    children?: React.ReactNode
    color?: string
}) {
    // 邊框光暈 geometry (稍微大一點點)
    const glowWidth = width + 0.01
    const glowHeight = height + 0.01

    return (
        <group>
            {/* 1. 精品玻璃本體 (實體厚度) */}
            <RoundedBox args={[width, height, 0.02]} radius={0.015} smoothness={4}>
                <meshPhysicalMaterial
                    color={color}
                    transmission={1.0}       // 全透光
                    roughness={0.0}          // 極度光滑
                    metalness={0.1}
                    thickness={0.08}         // 厚度感 (產生折射)
                    ior={1.6}                // 接近水晶的折射率
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                    attenuationColor="#00ffff" // 玻璃內部的深色
                    attenuationDistance={0.2}  // 顏色衰減距離
                    transparent
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </RoundedBox>

            {/* 2. 邊緣高光 (Rim Light) - 用細框勾勒 */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial
                    color="#88ffff"
                    wireframe
                    transparent
                    opacity={opacity * 0.3}
                />
            </mesh>

            {/* 3. 內部發光層 (Inner Glow) - 增加層次感 */}
            <mesh position={[0, 0, -0.011]}>
                <planeGeometry args={[width * 0.95, height * 0.95]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={opacity * 0.1}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* 4. 四角裝飾 (Tech Corners) */}
            <group position={[0, 0, 0.015]}>
                <mesh position={[-width / 2 + 0.01, height / 2 - 0.01, 0]}>
                    <circleGeometry args={[0.003, 8]} />
                    <meshBasicMaterial color="#ffffff" opacity={opacity} transparent blending={THREE.AdditiveBlending} />
                </mesh>
                <mesh position={[width / 2 - 0.01, height / 2 - 0.01, 0]}>
                    <circleGeometry args={[0.003, 8]} />
                    <meshBasicMaterial color="#ffffff" opacity={opacity} transparent blending={THREE.AdditiveBlending} />
                </mesh>
                <mesh position={[-width / 2 + 0.01, -height / 2 + 0.01, 0]}>
                    <circleGeometry args={[0.003, 8]} />
                    <meshBasicMaterial color="#ffffff" opacity={opacity} transparent blending={THREE.AdditiveBlending} />
                </mesh>
                <mesh position={[width / 2 - 0.01, -height / 2 + 0.01, 0]}>
                    <circleGeometry args={[0.003, 8]} />
                    <meshBasicMaterial color="#ffffff" opacity={opacity} transparent blending={THREE.AdditiveBlending} />
                </mesh>
            </group>

            {/* 5. 內容插槽 (浮在玻璃表面一點點) */}
            <group position={[0, 0, 0.02]}>
                {children}
            </group>
        </group>
    )
}

// ==================== [組件] 數據圖表 (Fake Data Viz) ====================
function DataListPanel({ opacity }: { opacity: number }) {
    return (
        <group>
            {/* 標題 (Title) */}
            <mesh position={[-0.05, 0.1, 0]}>
                <planeGeometry args={[0.08, 0.015]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity} />
            </mesh>

            {/* 數據條 (Data Bars) - 縮減數量與範圍以適配面板 */}
            {Array.from({ length: 5 }).map((_, i) => {
                const y = 0.05 - i * 0.05 // 範圍: 0.05 -> -0.15 (在 0.3 高度面板內)
                const w = 0.05 + Math.random() * 0.1 // 寬度: 0.05~0.15 (在 0.25 寬度面板內)
                return (
                    <mesh key={i} position={[-0.02, y, 0]}> {/* 置中微調 */}
                        <planeGeometry args={[w, 0.006]} />
                        <meshBasicMaterial color="#00ffff" transparent opacity={opacity * (0.3 + Math.random() * 0.5)} />
                    </mesh>
                )
            })}
        </group>
    )
}

function WaveformPanel({ opacity }: { opacity: number }) {
    const lineRef = useRef<THREE.Line>(null)
    useFrame((state) => {
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
            const time = state.clock.elapsedTime
            for (let i = 0; i < 20; i++) {
                const x = (i / 19) * 0.2 - 0.1
                const y = Math.sin(i * 0.5 + time * 5) * 0.05
                positions[i * 3] = x
                positions[i * 3 + 1] = y
                positions[i * 3 + 2] = 0
            }
            lineRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const count = 20
        const positions = new Float32Array(count * 3)
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return geo
    }, [])

    return (
        <group>
            <line ref={lineRef} geometry={geometry}>
                <lineBasicMaterial color="#ff00ff" transparent opacity={opacity} />
            </line>
            <gridHelper args={[0.25, 4, '#001a33', '#000810']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]} />
        </group>
    )
}

// ==================== [模式 D] 玻璃儀表板 (Glass UI) ====================
function PatternGlassUI({ opacity }: { opacity: number }) {
    return (
        <group>
            {/* 中央主面板 (模擬臉部識別或掃描框) */}
            <GlassPanel width={0.5} height={0.35} opacity={opacity}>
                {/* 掃描線動畫 */}
                <mesh position={[0, 0, 0]}>
                    <ringGeometry args={[0.1, 0.105, 6]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.5} />
                </mesh>
                <mesh position={[0, 0, 0]} scale={[1.5, 1, 1]}>
                    <planeGeometry args={[0.3, 0.2]} />
                    <meshBasicMaterial color="#00ffff" wireframe transparent opacity={opacity * 0.1} />
                </mesh>
            </GlassPanel>

            {/* 左側數據面板 - 懸浮於左側並微轉 */}
            <group position={[-0.4, 0, 0.1]} rotation={[0, 0.3, 0]}>
                <GlassPanel width={0.25} height={0.3} opacity={opacity} color="#0088ff">
                    <DataListPanel opacity={opacity} />
                </GlassPanel>
            </group>

            {/* 右側分析面板 - 懸浮於右側並微轉 */}
            <group position={[0.4, 0, 0.1]} rotation={[0, -0.3, 0]}>
                <GlassPanel width={0.25} height={0.3} opacity={opacity} color="#ff00ff">
                    <WaveformPanel opacity={opacity} />
                </GlassPanel>
            </group>
        </group>
    )
}

// ==================== [模式 A] 核心介面 (Hex Brain) ====================
function PatternHex({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const ringRef = useRef<THREE.Group>(null)
    const coreRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        const time = state.clock.elapsedTime
        if (ringRef.current) ringRef.current.rotation.z = time * 0.2
        if (groupRef.current) groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1

        // 核心球體自轉
        if (coreRef.current) {
            coreRef.current.rotation.x = time * 0.5
            coreRef.current.rotation.y = time * 0.3
        }
    })

    return (
        <group ref={groupRef}>
            <group ref={ringRef}>
                <mesh rotation={[0, 0, Math.PI / 6]}>
                    <ringGeometry args={[0.22, 0.225, 6]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.9} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[0, 0, 0]}>
                    <ringGeometry args={[0.18, 0.182, 32]} />
                    <meshBasicMaterial color="#0088ff" transparent opacity={opacity * 0.7} side={THREE.DoubleSide} />
                </mesh>
            </group>
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.08, 1]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.4} wireframe />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.5, 0.002]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.3} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
                <planeGeometry args={[0.5, 0.002]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.3} />
            </mesh>
        </group>
    )
}

// ==================== [模式 B] 雷達掃描 (Radar Scan) ====================
function PatternRadar({ opacity }: { opacity: number }) {
    const scanRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (scanRef.current) scanRef.current.rotation.z = -state.clock.elapsedTime * 1.5
    })

    return (
        <group>
            {[0.05, 0.10, 0.15, 0.20].map((r, i) => (
                <mesh key={i}>
                    <ringGeometry args={[r, r + 0.003, 64]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "#00ffff" : "#0088ff"} transparent opacity={opacity * (0.5 - i * 0.1)} side={THREE.DoubleSide} />
                </mesh>
            ))}
            <mesh ref={scanRef} position={[0, 0, 0.01]}>
                <circleGeometry args={[0.20, 32, 0, Math.PI / 2]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.15} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// ==================== [模式 C] 數據球體 (Data Sphere) ====================
function PatternSphere({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const orbitsRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        const time = state.clock.elapsedTime
        if (orbitsRef.current) {
            orbitsRef.current.rotation.x = time * 0.3
            orbitsRef.current.rotation.y = time * 0.2
        }
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={opacity * 0.1} wireframe />
            </mesh>
            <group ref={orbitsRef}>
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[0.2, 0.002, 16, 100]} />
                    <meshBasicMaterial color="#0088ff" transparent opacity={opacity * 0.6} />
                </mesh>
                <mesh rotation={[-Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[0.2, 0.002, 16, 100]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.6} />
                </mesh>
            </group>
        </group>
    )
}


// ==================== 光束連接線 (修正：極細緻光束) ====================
function LightBeam({ opacity = 1, height = 0.08 }: { opacity?: number, height?: number }) {
    const safeOpacity = Math.max(0, opacity)

    return (
        <group>
            {/* 主光束 - 體積感圓錐 (極細 - 0.04) */}
            <mesh position={[0, height / 2, 0]} rotation={[0, 0, 0]}>
                <cylinderGeometry args={[0.04, 0.003, height, 32, 1, true]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={safeOpacity * 0.15}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* 核心光束 (變更細) */}
            <mesh position={[0, height / 2, 0]}>
                <cylinderGeometry args={[0.01, 0.001, height, 16, 1, true]} />
                <meshBasicMaterial
                    color="#ccffff"
                    transparent
                    opacity={safeOpacity * 0.4}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* 底部發光環 (變小) */}
            <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0, 0.03, 32]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={safeOpacity * 0.6}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}

// ==================== 主元件 (狀態控制) ====================
interface HolographicProjectionProps {
    visible: boolean
    opacity?: number
    vrRotation?: THREE.Euler
    vrFlipProgress?: number
}

export default function HolographicProjection({
    visible,
    opacity = 1,
    vrRotation,
    vrFlipProgress = 1
}: HolographicProjectionProps) {
    const groupRef = useRef<THREE.Group>(null)

    // 狀態
    const [currentPattern, setCurrentPattern] = useState(0) // 0=Hex, 1=Radar, 2=Sphere, 3=GlassUI
    const [beamProgress, setBeamProgress] = useState(0)
    const [contentOpacity, setContentOpacity] = useState(0)
    const timerRef = useRef(0)
    const patternTimerRef = useRef(0)

    const BEAM_IN_TIME = 0.5
    const PATTERN_DURATION = 3.5 // 切換間隔 3.5秒
    const FADE_TIME = 0.5

    useFrame((state, delta) => {
        if (!visible || vrFlipProgress < 0.95) {
            setBeamProgress(0)
            setContentOpacity(0)
            timerRef.current = 0
            return
        }

        // 1. 總計時 (控制進場)
        timerRef.current += delta
        setBeamProgress(Math.min(timerRef.current / BEAM_IN_TIME, 1))

        if (timerRef.current > BEAM_IN_TIME) {
            // 2. 模式循環邏輯
            patternTimerRef.current += delta

            // 計算當前週期的時間 (0 ~ PATTERN_DURATION)
            const cycleTime = patternTimerRef.current % PATTERN_DURATION

            // 淡入淡出邏輯
            // 前 FADE_TIME 秒淡入，最後 FADE_TIME 秒淡出，中間全顯
            let fade = 1
            if (cycleTime < FADE_TIME) {
                fade = cycleTime / FADE_TIME
            } else if (cycleTime > PATTERN_DURATION - FADE_TIME) {
                fade = (PATTERN_DURATION - cycleTime) / FADE_TIME
            }
            setContentOpacity(fade)

            // 切換模式觸發 (當剛好跨過週期時)
            if (patternTimerRef.current >= PATTERN_DURATION) {
                patternTimerRef.current = 0
                // 循環四種模式
                setCurrentPattern((prev) => (prev + 1) % 4)
            }
        }
    })

    if (!visible) return null

    // 投影位置修正
    return (
        <group ref={groupRef} position={[0, -0.15, 0]}>
            {/* 光束連接 - 已經變得很細小，作為點綴 */}
            <group position={[0, -0.08, 0]}>
                <LightBeam opacity={beamProgress * opacity} height={0.08} />
            </group>

            {/* 投影內容容器 - 往上移動到 0.28 */}
            <group position={[0, 0.28, 0]} scale={[0.85, 0.85, 0.85]}>
                {/* 1. 靜態背景板 (僅保留中間主板) */}
                <group position={[0, 0, -0.05]}>
                    <mesh>
                        <planeGeometry args={[0.7, 0.55]} />
                        <meshBasicMaterial color="#000810" transparent opacity={beamProgress * opacity * 0.3} side={THREE.DoubleSide} />
                    </mesh>
                    <gridHelper args={[0.7, 8, '#002a4d', '#001a33']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 0.01]} />
                </group>

                {/* 2. 動態切換的核心區域 */}
                <group position={[0, 0, 0.02]}>
                    {currentPattern === 0 && <PatternHex opacity={contentOpacity * opacity} />}
                    {currentPattern === 1 && <PatternRadar opacity={contentOpacity * opacity} />}
                    {currentPattern === 2 && <PatternSphere opacity={contentOpacity * opacity} />}
                    {currentPattern === 3 && <PatternGlassUI opacity={contentOpacity * opacity} />}
                </group>
            </group>
        </group>
    )
}
