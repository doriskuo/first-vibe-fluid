'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment, Float } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

/**
 * GlassWaterDrop - 3D 玻璃水滴
 * 使用 LatheGeometry + MeshTransmissionMaterial
 * 基於 luminadrop-3d-simulator 參考實作
 */
export default function GlassWaterDrop() {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<any>(null)
    const { getState } = useScrollAnimation()

    // 建立水滴 Geometry - 完全匹配 2D shader 的 sdRoundedCone
    // 2D 參數: r1 = r (底部半徑), r2 = 0.001 (頂點), h = r * 1.8
    const geometry = useMemo(() => {
        const points: THREE.Vector2[] = []

        // 2D shader 的比例
        const r1 = 1.0       // 底部半徑
        const r2 = 0.02      // 頂部半徑（幾乎是點）
        const h = r1 * 1.8   // 高度

        // sdRoundedCone 形狀：
        // 1. 底部半圓（圓心在 y=0）
        // 2. 直線斜邊（從 r1 收窄到 r2）
        // 3. 頂部小圓弧

        // 計算錐形斜邊的角度
        const b = (r1 - r2) / h
        const a = Math.sqrt(1 - b * b)

        // 1. 底部半圓 (從 -90° 到切線角度)
        const tangentAngle = Math.atan2(b, a)
        const bottomSegments = 25

        for (let i = 0; i <= bottomSegments; i++) {
            const angle = -Math.PI / 2 + (Math.PI / 2 + tangentAngle) * (i / bottomSegments)
            const x = r1 * Math.cos(angle)
            const y = r1 * Math.sin(angle)
            points.push(new THREE.Vector2(x, y))
        }

        // 2. 直線斜邊（從切點到頂部切點）
        const straightSegments = 20
        const startX = r1 * Math.cos(tangentAngle)
        const startY = r1 * Math.sin(tangentAngle)
        const endX = r2 * Math.cos(tangentAngle)
        const endY = h - r2 * Math.sin(tangentAngle)

        for (let i = 1; i <= straightSegments; i++) {
            const t = i / straightSegments
            const x = startX + (endX - startX) * t
            const y = startY + (endY - startY) * t
            points.push(new THREE.Vector2(x, y))
        }

        // 3. 頂部小圓弧 (收尖)
        const topSegments = 10
        for (let i = 1; i <= topSegments; i++) {
            const angle = tangentAngle - tangentAngle * (i / topSegments)
            const x = r2 * Math.cos(angle)
            const y = h - r2 + r2 * Math.sin(angle)
            if (x >= 0) points.push(new THREE.Vector2(Math.max(x, 0.001), y))
        }

        const geo = new THREE.LatheGeometry(points, 64)

        // 置中
        geo.computeBoundingBox()
        const center = new THREE.Vector3()
        geo.boundingBox?.getCenter(center)
        geo.translate(-center.x, -center.y, -center.z)

        return geo
    }, [])

    useFrame((state) => {
        if (!meshRef.current || !materialRef.current) return

        const { scrollValue } = getState()

        // 計算 3D 淡入進度
        // 3dGlass 階段: 2100-2400vh → scrollValue 2.1-2.4
        const fadeInStart = 2.1
        const fadeInEnd = 2.4
        const opacity = Math.min(Math.max((scrollValue - fadeInStart) / (fadeInEnd - fadeInStart), 0), 1)

        // 控制可見度
        meshRef.current.visible = opacity > 0.01

        if (materialRef.current) {
            materialRef.current.opacity = opacity
        }

        // 輕微動畫
        if (meshRef.current.visible) {
            meshRef.current.position.y = Math.sin(state.clock.getElapsedTime() * 0.8) * 0.02
            meshRef.current.rotation.y += 0.003
        }
    })

    return (
        <>
            {/* Environment for reflections - REQUIRED for glass effect */}
            <Environment preset="city" />

            <ambientLight intensity={0.5} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1.5} />
            <pointLight position={[-10, -10, -10]} intensity={1} color="#a8d8ff" />

            <Float speed={1.5} rotationIntensity={0.3} floatIntensity={0.3}>
                <mesh
                    ref={meshRef}
                    geometry={geometry}
                    visible={false}
                    scale={[0.15, 0.15, 0.15]}  // 匹配 2D 水滴大小
                >
                    <MeshTransmissionMaterial
                        ref={materialRef}
                        backside
                        samples={32}         // 提高品質
                        resolution={1024}    // 提高解析度
                        thickness={3.0}
                        roughness={0}
                        ior={1.33}
                        clearcoat={1}
                        chromaticAberration={0.08}
                        anisotropy={0.6}
                        distortion={0.4}
                        distortionScale={0.3}
                        temporalDistortion={0.1}
                        attenuationDistance={1.2}
                        attenuationColor="#ffffff"
                        color="#e0f2fe"
                        transparent={true}
                        opacity={0}
                    />
                </mesh>
            </Float>
        </>
    )
}
