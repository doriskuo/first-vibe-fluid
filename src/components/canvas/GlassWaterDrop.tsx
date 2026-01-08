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

    // 建立水滴 Geometry
    const geometry = useMemo(() => {
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

        return geo
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

        const fadeInStart = 2.1
        const fadeInEnd = 2.4
        const opacity = Math.min(Math.max((scrollValue - fadeInStart) / (fadeInEnd - fadeInStart), 0), 1)

        meshRef.current.visible = opacity > 0.01

        if (materialRef.current) {
            materialRef.current.opacity = opacity
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
