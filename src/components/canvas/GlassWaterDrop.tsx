'use client'

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'

/**
 * GlassWaterDrop - 3D 玻璃水滴
 * 使用全域滑鼠事件實現 360° 自由旋轉
 */
export default function GlassWaterDrop() {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<any>(null)
    const { getState } = useScrollAnimation()

    // 拖曳旋轉狀態 (X, Y, Z 三軸)
    const [isDragging, setIsDragging] = useState(false)
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
    const lastPointer = useRef({ x: 0, y: 0 })

    // VR 耳機形狀參數
    const vrParams = useMemo(() => ({
        w: 2.5, h: 0.8, d: 1.2, radius: 0.15
    }), [])

    // 建立水滴 Geometry 並保存原始頂點
    const { geometry, originalPositions } = useMemo(() => {
        const points: THREE.Vector2[] = []

        const r1 = 1.0
        const r2 = 0.02
        const h = r1 * 1.8

        const b = (r1 - r2) / h
        const a = Math.sqrt(1 - b * b)

        const tangentAngle = Math.atan2(b, a)
        const bottomSegments = 25

        for (let i = 0; i <= bottomSegments; i++) {
            const angle = -Math.PI / 2 + (Math.PI / 2 + tangentAngle) * (i / bottomSegments)
            const x = r1 * Math.cos(angle)
            const y = r1 * Math.sin(angle)
            points.push(new THREE.Vector2(x, y))
        }

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

        const topSegments = 10
        for (let i = 1; i <= topSegments; i++) {
            const angle = tangentAngle - tangentAngle * (i / topSegments)
            const x = r2 * Math.cos(angle)
            const y = h - r2 + r2 * Math.sin(angle)
            if (x >= 0) points.push(new THREE.Vector2(Math.max(x, 0.001), y))
        }

        const geo = new THREE.LatheGeometry(points, 64)

        geo.computeBoundingBox()
        const center = new THREE.Vector3()
        geo.boundingBox?.getCenter(center)
        geo.translate(-center.x, -center.y, -center.z)

        // 保存原始水滴頂點座標
        const origPos = geo.attributes.position.array.slice() as Float32Array

        return { geometry: geo, originalPositions: origPos }
    }, [])

    // 全域滑鼠事件（讓拖曳更流暢）
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isDragging) return

            const deltaX = e.clientX - lastPointer.current.x
            const deltaY = e.clientY - lastPointer.current.y

            // 垂直拖曳 → X 軸旋轉（前後翻轉）
            // 水平拖曳 → Z 軸旋轉（左右傾斜）
            setRotation(prev => ({
                x: prev.x + deltaY * 0.01,
                y: prev.y + deltaX * 0.005,  // Y 軸也轉一點點
                z: prev.z + deltaX * 0.01    // Z 軸傾斜
            }))

            lastPointer.current = { x: e.clientX, y: e.clientY }
        }

        const handleMouseUp = () => {
            setIsDragging(false)
        }

        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove)
            window.removeEventListener('mouseup', handleMouseUp)
        }
    }, [isDragging])

    useFrame(() => {
        if (!meshRef.current || !materialRef.current) return

        const { scrollValue } = getState()

        // 3D 水滴淡入（使用 smoothstep 曲線，更平滑）
        const fadeInStart = 2.0  // 提早開始
        const fadeInEnd = 2.5    // 延後結束，過渡更長

        // 線性進度
        const t = Math.min(Math.max((scrollValue - fadeInStart) / (fadeInEnd - fadeInStart), 0), 1)

        // smoothstep 曲線（避免閃爍）
        const opacity = t * t * (3 - 2 * t)

        // 只有當 opacity 超過 0.15 才顯示（避免低透明度閃爍）
        meshRef.current.visible = opacity > 0.15

        if (materialRef.current) {
            // 映射到 0.15-1.0 範圍，避免低透明度
            materialRef.current.opacity = meshRef.current.visible ? 0.15 + opacity * 0.85 : 0
        }

        // === 形狀變形（2.4-2.9，對應 shapeMorph 階段）===
        const morphStart = 2.4
        const morphEnd = 2.9
        const positions = meshRef.current.geometry.attributes.position

        if (scrollValue >= morphStart && meshRef.current.visible) {
            const morphT = Math.min((scrollValue - morphStart) / (morphEnd - morphStart), 1)
            const morphProgress = morphT * morphT * (3 - 2 * morphT)  // smoothstep

            const vr = vrParams

            for (let i = 0; i < positions.count; i++) {
                // 原始水滴座標
                const dropX = originalPositions[i * 3]
                const dropY = originalPositions[i * 3 + 1]
                const dropZ = originalPositions[i * 3 + 2]

                // VR 耳機：擠壓成橫向圓角長方體
                const vrX = Math.sign(dropX) * Math.min(Math.abs(dropX) * vr.w, vr.w - vr.radius) + dropX * vr.radius * 0.5
                const vrY = Math.sign(dropY) * Math.min(Math.abs(dropY) * vr.h, vr.h - vr.radius) + dropY * vr.radius * 0.5
                const vrZ = Math.sign(dropZ) * Math.min(Math.abs(dropZ) * vr.d, vr.d - vr.radius) + dropZ * vr.radius * 0.5

                // 混合水滴和 VR 形狀
                const finalX = THREE.MathUtils.lerp(dropX, vrX, morphProgress)
                const finalY = THREE.MathUtils.lerp(dropY, vrY, morphProgress)
                const finalZ = THREE.MathUtils.lerp(dropZ, vrZ, morphProgress)

                positions.setX(i, finalX)
                positions.setY(i, finalY)
                positions.setZ(i, finalZ)
            }
            positions.needsUpdate = true
            meshRef.current.geometry.computeVertexNormals()
        } else if (meshRef.current.visible) {
            // 未到變形階段，確保頂點是原始水滴形狀
            let needsUpdate = false
            for (let i = 0; i < positions.count; i++) {
                const currentX = positions.getX(i)
                const originalX = originalPositions[i * 3]
                if (Math.abs(currentX - originalX) > 0.001) {
                    positions.setX(i, originalPositions[i * 3])
                    positions.setY(i, originalPositions[i * 3 + 1])
                    positions.setZ(i, originalPositions[i * 3 + 2])
                    needsUpdate = true
                }
            }
            if (needsUpdate) {
                positions.needsUpdate = true
                meshRef.current.geometry.computeVertexNormals()
            }
        }

        // 套用三軸旋轉
        if (meshRef.current.visible) {
            meshRef.current.rotation.x = rotation.x
            meshRef.current.rotation.y = rotation.y
            meshRef.current.rotation.z = rotation.z
        }
    })

    // 點擊水滴開始拖曳
    const handlePointerDown = useCallback((e: any) => {
        e.stopPropagation()
        setIsDragging(true)
        lastPointer.current = { x: e.clientX, y: e.clientY }
    }, [])

    return (
        <>
            {/* Environment - studio 在白背景下更明顯 */}
            <Environment preset="studio" background={false} />

            <ambientLight intensity={0.8} />
            <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={2} />
            <pointLight position={[-10, -10, -10]} intensity={1.5} color="#a8d8ff" />

            <mesh
                ref={meshRef}
                geometry={geometry}
                visible={false}
                scale={[0.15, 0.15, 0.15]}
                onPointerDown={handlePointerDown}
            >
                <MeshTransmissionMaterial
                    ref={materialRef}
                    backside
                    samples={32}
                    resolution={1024}
                    thickness={3.0}
                    roughness={0.05}
                    ior={1.5}
                    clearcoat={1}
                    chromaticAberration={0.1}
                    anisotropy={0.6}
                    distortion={0.3}
                    distortionScale={0.2}
                    temporalDistortion={0.05}
                    attenuationDistance={0.8}
                    attenuationColor="#ffffff"
                    color="#f0f8ff"
                    transparent={true}
                    opacity={0}
                />
            </mesh>
        </>
    )
}
