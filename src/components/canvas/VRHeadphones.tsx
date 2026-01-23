'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial } from '@react-three/drei'
import * as THREE from 'three'

interface VRHeadphonesProps {
    visible: boolean
    parentRotation: THREE.Euler
    opacity: number
}

/**
 * VRHeadphones - VR 耳機兩側的鑽石切面玻璃耳罩
 * 
 * 外側表面：鑽石 Table 切面（中心凸起 + 放射狀三角形切面）
 * 內側表面：平面
 * 側面輪廓：八角形
 */
export default function VRHeadphones({ visible, parentRotation, opacity }: VRHeadphonesProps) {
    const groupRef = useRef<THREE.Group>(null)
    const leftMatRef = useRef<any>(null)
    const rightMatRef = useRef<any>(null)

    // 鑽石切面耳罩幾何體
    const earCupGeometry = useMemo(() => {
        const segments = 8       // 八角形
        const radius = 0.15      // 外圈半徑（加大）
        const thickness = 0.06   // 厚度（加厚）
        const peakHeight = 0.08  // 外側中心凸起高度（更高更明顯）

        // 頂點陣列
        const vertices: number[] = []
        const indices: number[] = []

        // === 頂點定義 ===
        // 外側（朝外）- 鑽石切面
        // 0: 外側中心（凸起）
        vertices.push(thickness / 2 + peakHeight, 0, 0)

        // 1-8: 外側八角形頂點
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            vertices.push(
                thickness / 2,
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            )
        }

        // 內側（朝內）- 平面
        // 9: 內側中心
        vertices.push(-thickness / 2, 0, 0)

        // 10-17: 內側八角形頂點
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            vertices.push(
                -thickness / 2,
                Math.cos(angle) * radius,
                Math.sin(angle) * radius
            )
        }

        // === 面定義 ===
        const outerCenter = 0
        const outerRingStart = 1
        const innerCenter = 9
        const innerRingStart = 10

        // 外側鑽石切面：8 個三角形從中心放射到外圈
        for (let i = 0; i < segments; i++) {
            const curr = outerRingStart + i
            const next = outerRingStart + ((i + 1) % segments)
            indices.push(outerCenter, next, curr)  // 順時針
        }

        // 內側平面：8 個三角形從中心放射到內圈
        for (let i = 0; i < segments; i++) {
            const curr = innerRingStart + i
            const next = innerRingStart + ((i + 1) % segments)
            indices.push(innerCenter, curr, next)  // 逆時針（法線朝內）
        }

        // 側面：連接外圈和內圈（8 個四邊形 = 16 個三角形）
        for (let i = 0; i < segments; i++) {
            const outerCurr = outerRingStart + i
            const outerNext = outerRingStart + ((i + 1) % segments)
            const innerCurr = innerRingStart + i
            const innerNext = innerRingStart + ((i + 1) % segments)

            // 四邊形拆成兩個三角形
            indices.push(outerCurr, outerNext, innerCurr)
            indices.push(innerCurr, outerNext, innerNext)
        }

        // 創建 BufferGeometry
        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geometry.setIndex(indices)
        geometry.computeVertexNormals()

        return geometry
    }, [])

    // 右側耳罩幾何體（X 軸鏡像）
    const rightEarCupGeometry = useMemo(() => {
        const segments = 8
        const radius = 0.15      // 外圈半徑（加大）
        const thickness = 0.06   // 厚度（加厚）
        const peakHeight = 0.08  // 外側中心凸起高度（更高更明顯）

        const vertices: number[] = []
        const indices: number[] = []

        // 外側（朝外，X 軸正方向）
        vertices.push(thickness / 2 + peakHeight, 0, 0)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            vertices.push(thickness / 2, Math.cos(angle) * radius, Math.sin(angle) * radius)
        }

        // 內側（朝內，X 軸負方向）
        vertices.push(-thickness / 2, 0, 0)
        for (let i = 0; i < segments; i++) {
            const angle = (i / segments) * Math.PI * 2
            vertices.push(-thickness / 2, Math.cos(angle) * radius, Math.sin(angle) * radius)
        }

        const outerCenter = 0
        const outerRingStart = 1
        const innerCenter = 9
        const innerRingStart = 10

        // 外側鑽石切面（法線朝右）
        for (let i = 0; i < segments; i++) {
            const curr = outerRingStart + i
            const next = outerRingStart + ((i + 1) % segments)
            indices.push(outerCenter, curr, next)  // 逆時針讓法線朝右
        }

        // 內側平面（法線朝左）
        for (let i = 0; i < segments; i++) {
            const curr = innerRingStart + i
            const next = innerRingStart + ((i + 1) % segments)
            indices.push(innerCenter, next, curr)
        }

        // 側面
        for (let i = 0; i < segments; i++) {
            const outerCurr = outerRingStart + i
            const outerNext = outerRingStart + ((i + 1) % segments)
            const innerCurr = innerRingStart + i
            const innerNext = innerRingStart + ((i + 1) % segments)

            indices.push(outerCurr, innerCurr, outerNext)
            indices.push(innerCurr, innerNext, outerNext)
        }

        const geometry = new THREE.BufferGeometry()
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))
        geometry.setIndex(indices)
        geometry.computeVertexNormals()

        return geometry
    }, [])

    // 同步旋轉
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.copy(parentRotation)
        }

        if (leftMatRef.current) leftMatRef.current.opacity = opacity
        if (rightMatRef.current) rightMatRef.current.opacity = opacity
    })

    if (!visible) return null

    // 位置（注意：VR 本體有旋轉 90 度，所以 Y 軸變成深度方向）
    const xOffset = 0.38
    const yOffset = -0.22  // 往深處後退
    const zOffset = 0

    return (
        <group ref={groupRef}>
            {/* 左側耳罩 - 外側朝左（鏡像讓凸起朝外） */}
            <mesh geometry={earCupGeometry} position={[-xOffset, yOffset, zOffset]} scale={[-1, 1, 1]}>
                <meshPhysicalMaterial
                    ref={leftMatRef}
                    color="#f8fcff"
                    metalness={0}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.5}
                    ior={1.5}
                    transparent={true}
                    opacity={opacity}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    envMapIntensity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>

            {/* 右側耳罩 - 外側朝右 */}
            <mesh geometry={rightEarCupGeometry} position={[xOffset, yOffset, zOffset]}>
                <meshPhysicalMaterial
                    ref={rightMatRef}
                    color="#f8fcff"
                    metalness={0}
                    roughness={0.02}
                    transmission={0.95}
                    thickness={0.5}
                    ior={1.5}
                    transparent={true}
                    opacity={opacity}
                    clearcoat={1}
                    clearcoatRoughness={0}
                    envMapIntensity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}


