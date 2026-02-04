'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// ==================== [共用] 基礎面板元件 ====================
function HUDPanel({
    position,
    rotation,
    width = 0.3,
    height = 0.2,
    opacity = 1,
    slideProgress = 1
}: {
    position: [number, number, number]
    rotation?: [number, number, number]
    width?: number
    height?: number
    opacity?: number
    slideProgress?: number
}) {
    const slideOffset = (1 - slideProgress) * 0.2
    const actualOpacity = opacity * slideProgress

    // 邊框線條
    const borderLine = useMemo(() => {
        const hw = width / 2
        const hh = height / 2
        const points = [
            new THREE.Vector3(-hw, -hh, 0),
            new THREE.Vector3(hw, -hh, 0),
            new THREE.Vector3(hw, hh, 0),
            new THREE.Vector3(-hw, hh, 0),
            new THREE.Vector3(-hw, -hh, 0),
        ]
        const geometry = new THREE.BufferGeometry().setFromPoints(points)
        const material = new THREE.LineBasicMaterial({
            color: '#00ffff',
            transparent: true,
            opacity: 0.8
        })
        return new THREE.Line(geometry, material)
    }, [width, height])

    return (
        <group position={[position[0] + slideOffset, position[1], position[2]]} rotation={rotation || [0, 0, 0]}>
            <primitive object={borderLine} />
            <mesh>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial
                    color="#001a33"
                    transparent
                    opacity={actualOpacity * 0.15}
                    side={THREE.DoubleSide}
                />
            </mesh>
            {/* 標題裝飾 */}
            <mesh position={[-width / 2 + width * 0.15, height / 2 - 0.01, 0]}>
                <planeGeometry args={[width * 0.2, 0.005]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={actualOpacity * 0.8} />
            </mesh>
        </group>
    )
}

// ==================== [模式 A] 核心介面 (Hex Brain) ====================
function PatternHex({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const ringRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        const time = state.clock.elapsedTime
        if (ringRef.current) {
            ringRef.current.rotation.z = time * 0.2
        }
        if (groupRef.current) {
            groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1
        }
    })

    return (
        <group ref={groupRef}>
            {/* 中央六角結構 */}
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
            {/* 核心球體 */}
            <mesh>
                <icosahedronGeometry args={[0.08, 1]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.4} wireframe />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.9} />
            </mesh>
            {/* 掃描線裝飾 */}
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
        if (scanRef.current) {
            scanRef.current.rotation.z = -state.clock.elapsedTime * 1.5
        }
    })

    return (
        <group>
            {/* 同心圓 (縮小以避免蓋到光束) */}
            {[0.05, 0.10, 0.15, 0.20].map((r, i) => (
                <mesh key={i}>
                    <ringGeometry args={[r, r + 0.003, 64]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "#00ffff" : "#0088ff"} transparent opacity={opacity * (0.5 - i * 0.1)} side={THREE.DoubleSide} />
                </mesh>
            ))}
            {/* 掃描扇形 (配合縮小) */}
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
            {/* 主球體 */}
            <mesh>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={opacity * 0.1} wireframe />
            </mesh>
            {/* 旋轉軌道 */}
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
            {/* 浮動粒子 (已完全移除) */}
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
    const [currentPattern, setCurrentPattern] = useState(0) // 0=Hex, 1=Radar, 2=Sphere
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
                setCurrentPattern((prev) => (prev + 1) % 3)
            }
        }
    })

    if (!visible) return null

    // 投影位置修正：
    // VR 變小了，投影要配合調整位置
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
                </group>
            </group>
        </group>
    )
}
