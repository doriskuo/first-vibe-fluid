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

    // 建立水滴 Geometry - 使用正確的參數式公式
    const geometry = useMemo(() => {
        const points: THREE.Vector2[] = []
        const segments = 80

        for (let i = 0; i <= segments; i++) {
            const t = i / segments
            const angle = t * Math.PI

            // 經典水滴參數式公式
            // x = sin(angle) * (1 - cos(angle))
            // y = cos(angle)
            // 這會產生底部圓潤、頂部尖的水滴
            const widthFactor = 1.0  // 寬度縮放
            const heightScale = 1.8  // 高度縮放

            const x = Math.sin(angle) * (1 - Math.cos(angle)) * widthFactor
            const y = Math.cos(angle) * heightScale

            points.push(new THREE.Vector2(x, y))
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
                    scale={[0.12, 0.12, 0.12]}  // 匹配 2D 水滴大小
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
