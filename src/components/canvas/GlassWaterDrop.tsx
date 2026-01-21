'use client'

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import WatchGear from './WatchGear'

/**
 * GlassWaterDrop - 3D 玻璃水滴
 * 使用全域滑鼠事件實現 360° 自由旋轉
 */
export default function GlassWaterDrop() {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<any>(null)
    const coreGroupRef = useRef<THREE.Group>(null)  // 內部機械結構
    const ringRef = useRef<THREE.Mesh>(null)        // 霓虹光環

    // 發光材質 refs（用於動態調整亮度）
    const ring1MatRef = useRef<THREE.MeshStandardMaterial>(null)
    const ring2MatRef = useRef<THREE.MeshStandardMaterial>(null)
    const ring3MatRef = useRef<THREE.MeshStandardMaterial>(null)
    const line1MatRef = useRef<THREE.MeshStandardMaterial>(null)
    const line2MatRef = useRef<THREE.MeshStandardMaterial>(null)
    const light1Ref = useRef<THREE.PointLight>(null)
    const light2Ref = useRef<THREE.PointLight>(null)

    // 精密齒輪 refs - 左側群組
    const gearGroupRef = useRef<THREE.Group>(null)
    const gear1Ref = useRef<THREE.Group>(null)
    const gear2Ref = useRef<THREE.Group>(null)
    const gear3Ref = useRef<THREE.Group>(null)
    const gear4Ref = useRef<THREE.Group>(null)
    const gear5Ref = useRef<THREE.Group>(null)
    // 右側群組
    const rightGear1Ref = useRef<THREE.Group>(null)
    const rightGear2Ref = useRef<THREE.Group>(null)
    const rightGear3Ref = useRef<THREE.Group>(null)
    const rightGear4Ref = useRef<THREE.Group>(null)

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

        // 降低閾值，讓 3D 更早開始淡入（更平滑的過渡）
        meshRef.current.visible = opacity > 0.05

        // 內部結構同步顯示
        if (coreGroupRef.current) {
            coreGroupRef.current.visible = meshRef.current.visible
        }

        if (materialRef.current) {
            // 直接使用 opacity，不再映射到 0.15-1.0
            materialRef.current.opacity = meshRef.current.visible ? opacity : 0

            // VR 變形時降低折射扭曲（讓內部齒輪更清晰）
            const morphT = Math.min(Math.max((scrollValue - 2.4) / 0.5, 0), 1)
            materialRef.current.distortion = THREE.MathUtils.lerp(0.3, 0, morphT)
            materialRef.current.distortionScale = THREE.MathUtils.lerp(0.2, 0, morphT)
            materialRef.current.thickness = THREE.MathUtils.lerp(3.0, 0.1, morphT)  // 更薄讓齒輪清晰
            materialRef.current.chromaticAberration = THREE.MathUtils.lerp(0.1, 0, morphT)
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

        // 套用三軸旋轉（VR 變形後漸進往前傾）
        // 計算當前變形進度
        const currentMorphT = Math.min(Math.max((scrollValue - 2.4) / 0.5, 0), 1)
        const currentMorphProgress = currentMorphT * currentMorphT * (3 - 2 * currentMorphT)

        // 只有變形後才往前傾 90 度
        const xOffset = currentMorphProgress * (Math.PI / 2)

        if (meshRef.current.visible) {
            meshRef.current.rotation.x = rotation.x + xOffset
            meshRef.current.rotation.y = rotation.y
            meshRef.current.rotation.z = rotation.z

            // 內部結構同步旋轉
            if (coreGroupRef.current) {
                coreGroupRef.current.rotation.copy(meshRef.current.rotation)

                // 計算變形進度
                const morphT = Math.min(Math.max((scrollValue - 2.4) / 0.5, 0), 1)

                // VR 階段隱藏賽博朋克光暈（讓齒輪更清晰）
                if (morphT > 0.3) {
                    coreGroupRef.current.visible = false
                }

                // 齒輪只在 VR 轉正後才出現（morphT = 1）+ 跟著玻璃體旋轉
                if (gearGroupRef.current) {
                    gearGroupRef.current.visible = morphT >= 1 && meshRef.current.visible
                    gearGroupRef.current.rotation.copy(meshRef.current.rotation)

                    // 齒輪獨立自轉動畫
                    if (gearGroupRef.current.visible) {
                        const time = performance.now() * 0.0003  // 基礎時間

                        // ===== 左側群組（5顆）- 各自獨立轉速 =====
                        if (gear1Ref.current) gear1Ref.current.rotation.z = time * 0.8   // 大齒輪慢
                        if (gear2Ref.current) gear2Ref.current.rotation.z = -time * 1.2  // 中齒輪
                        if (gear3Ref.current) gear3Ref.current.rotation.z = time * 1.8   // 小齒輪快
                        if (gear4Ref.current) gear4Ref.current.rotation.z = -time * 2.5  // 微型更快
                        if (gear5Ref.current) gear5Ref.current.rotation.z = time * 3.2   // 超小最快

                        // ===== 右側群組（4顆）- 不對稱轉速 =====
                        if (rightGear1Ref.current) rightGear1Ref.current.rotation.z = -time * 1.0
                        if (rightGear2Ref.current) rightGear2Ref.current.rotation.z = time * 1.6
                        if (rightGear3Ref.current) rightGear3Ref.current.rotation.z = -time * 2.2
                        if (rightGear4Ref.current) rightGear4Ref.current.rotation.z = time * 2.8
                    }
                }
            }
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
            {/* Environment - city 預設光照更均勻 */}
            <Environment preset="city" background={false} />

            <ambientLight intensity={0.8} />
            <spotLight position={[0, 5, 10]} angle={0.3} penumbra={1} intensity={1.5} />
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
                    depthWrite={false}
                />
            </mesh>

            {/* 內部發光結構 - 線條+光暈風格 */}
            <group ref={coreGroupRef} scale={[0.15, 0.15, 0.15]}>
                {/* 主光環 - 水平 */}
                <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
                    <torusGeometry args={[0.5, 0.015, 16, 64]} />
                    <meshStandardMaterial
                        ref={ring1MatRef}
                        color="#000000"
                        emissive="#00ffff"
                        emissiveIntensity={4}
                        transparent
                        opacity={0.9}
                    />
                </mesh>

                {/* 第二光環 - 傾斜 */}
                <mesh rotation={[Math.PI / 3, Math.PI / 4, 0]}>
                    <torusGeometry args={[0.4, 0.01, 16, 64]} />
                    <meshStandardMaterial
                        ref={ring2MatRef}
                        color="#000000"
                        emissive="#ff00ff"
                        emissiveIntensity={3}
                        transparent
                        opacity={0.8}
                    />
                </mesh>

                {/* 第三光環 - 另一角度 */}
                <mesh rotation={[Math.PI / 6, -Math.PI / 3, Math.PI / 4]}>
                    <torusGeometry args={[0.35, 0.008, 16, 64]} />
                    <meshStandardMaterial
                        ref={ring3MatRef}
                        color="#000000"
                        emissive="#00ffaa"
                        emissiveIntensity={3.5}
                        transparent
                        opacity={0.7}
                    />
                </mesh>

                {/* 發光線條 - 垂直軸（主線 + 光暈層）*/}
                <group>
                    {/* 核心線 */}
                    <mesh>
                        <cylinderGeometry args={[0.008, 0.008, 1.2, 8]} />
                        <meshStandardMaterial
                            ref={line1MatRef}
                            color="#000000"
                            emissive="#00ffff"
                            emissiveIntensity={5}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                    {/* 光暈層 */}
                    <mesh>
                        <cylinderGeometry args={[0.025, 0.025, 1.2, 8]} />
                        <meshStandardMaterial
                            color="#000000"
                            emissive="#00ffff"
                            emissiveIntensity={2}
                            transparent
                            opacity={0.3}
                        />
                    </mesh>
                </group>

                {/* 發光線條 - 水平軸（主線 + 光暈層）*/}
                <group rotation={[0, 0, Math.PI / 2]}>
                    {/* 核心線 */}
                    <mesh>
                        <cylinderGeometry args={[0.008, 0.008, 0.8, 8]} />
                        <meshStandardMaterial
                            ref={line2MatRef}
                            color="#000000"
                            emissive="#ff00ff"
                            emissiveIntensity={4}
                            transparent
                            opacity={0.9}
                        />
                    </mesh>
                    {/* 光暈層 */}
                    <mesh>
                        <cylinderGeometry args={[0.025, 0.025, 0.8, 8]} />
                        <meshStandardMaterial
                            color="#000000"
                            emissive="#ff00ff"
                            emissiveIntensity={1.5}
                            transparent
                            opacity={0.25}
                        />
                    </mesh>
                </group>

                {/* 柔和光暈 - 中心點光源 */}
                <pointLight ref={light1Ref} position={[0, 0, 0]} intensity={2} distance={1.5} color="#00ffff" />
                <pointLight ref={light2Ref} position={[0, 0.2, 0]} intensity={1.5} distance={1} color="#ff00ff" />
            </group>

            {/* 精密機械錶風格齒輪組 - 不規則科技風佈局 */}
            <group ref={gearGroupRef} scale={[0.15, 0.15, 0.15]} visible={false}>
                {/* ===== 左側群組（5顆，不規則分佈）===== */}
                {/* 大齒輪 - 左後方主視覺 */}
                <WatchGear
                    ref={gear1Ref}
                    radius={0.32}
                    teeth={40}
                    spokes={6}
                    color="#909090"
                    glowColor="#00aaff"
                    glowIntensity={0.35}
                    position={[-0.95, 0.08, -0.08]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 中齒輪 - 左下前方 */}
                <WatchGear
                    ref={gear2Ref}
                    radius={0.2}
                    teeth={26}
                    spokes={4}
                    color="#a0a0a0"
                    glowColor="#00ccff"
                    glowIntensity={0.4}
                    position={[-0.55, -0.18, 0.12]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 小齒輪 - 左上前方 */}
                <WatchGear
                    ref={gear3Ref}
                    radius={0.14}
                    teeth={18}
                    spokes={3}
                    color="#b0b0b0"
                    glowColor="#00ffff"
                    glowIntensity={0.5}
                    position={[-0.68, 0.28, 0.15]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 微型齒輪 - 極左上 */}
                <WatchGear
                    ref={gear4Ref}
                    radius={0.09}
                    teeth={12}
                    spokes={3}
                    color="#c0c0c0"
                    glowColor="#00ddff"
                    glowIntensity={0.55}
                    position={[-1.18, 0.22, 0.05]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 超小齒輪 - 左下後 */}
                <WatchGear
                    ref={gear5Ref}
                    radius={0.07}
                    teeth={10}
                    spokes={3}
                    color="#d0d0d0"
                    glowColor="#00eeff"
                    glowIntensity={0.6}
                    position={[-1.08, -0.12, -0.05]}
                    rotation={[Math.PI / 2, 0, 0]}
                />

                {/* ===== 右側群組（4顆，不對稱）===== */}
                {/* 中大齒輪 - 右側主視覺 */}
                <WatchGear
                    ref={rightGear1Ref}
                    radius={0.26}
                    teeth={32}
                    spokes={5}
                    color="#909090"
                    glowColor="#00aaff"
                    glowIntensity={0.35}
                    position={[0.85, -0.05, 0.02]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 小齒輪 - 右上前 */}
                <WatchGear
                    ref={rightGear2Ref}
                    radius={0.15}
                    teeth={20}
                    spokes={3}
                    color="#a0a0a0"
                    glowColor="#00ccff"
                    glowIntensity={0.45}
                    position={[0.58, 0.2, 0.14]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 微型齒輪 - 極右後 */}
                <WatchGear
                    ref={rightGear3Ref}
                    radius={0.11}
                    teeth={14}
                    spokes={3}
                    color="#b0b0b0"
                    glowColor="#00ddff"
                    glowIntensity={0.5}
                    position={[1.12, 0.12, -0.06]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
                {/* 超微型齒輪 - 右下 */}
                <WatchGear
                    ref={rightGear4Ref}
                    radius={0.08}
                    teeth={11}
                    spokes={3}
                    color="#c0c0c0"
                    glowColor="#00eeff"
                    glowIntensity={0.55}
                    position={[0.7, -0.22, 0.1]}
                    rotation={[Math.PI / 2, 0, 0]}
                />
            </group>
        </>
    )
}
