'use client'

import { useRef, useMemo, useState, useEffect, useCallback } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useScrollContext } from '@/components/providers/LenisProvider'
import WatchGear from './WatchGear'
import VRHeadphones from './VRHeadphones'
import VRScanEffect from './VRScanEffect'
import EarcupParticles from './EarcupParticles'
import HolographicCircuit from './HolographicCircuit'
import HolographicProjection from './HolographicProjection'
import CenterLockEffect from './CenterLockEffect'
import { getCalloutVisibility, featurePoints } from '@/config/featureConfig'

/**
 * GlassWaterDrop - 3D 玻璃水滴
 * 使用全域滑鼠事件實現 360° 自由旋轉
 */
export default function GlassWaterDrop() {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<any>(null)
    const coreGroupRef = useRef<THREE.Group>(null)  // 內部機械結構
    const ringRef = useRef<THREE.Mesh>(null)        // 霓虹光環
    const containerRef = useRef<THREE.Group>(null)  // 新增：容器 ref 用於整體縮放移動 (HUD Descent)

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
    const { shouldResetRotation, clearResetFlag } = useScrollContext()

    // 拖曳旋轉狀態 (X, Y, Z 三軸)
    const [isDragging, setIsDragging] = useState(false)
    const [rotation, setRotation] = useState({ x: 0, y: 0, z: 0 })
    const [isResetting, setIsResetting] = useState(false) // Track if reset animation is in progress
    const lastPointer = useRef({ x: 0, y: 0 })

    // VR 耳罩狀態
    const [headphonesVisible, setHeadphonesVisible] = useState(false)
    const [headphonesOpacity, setHeadphonesOpacity] = useState(0)
    const headphonesRotation = useRef(new THREE.Euler())

    // 掃描效果狀態
    const [scanVisible, setScanVisible] = useState(false)
    const [scanProgress, setScanProgress] = useState(0)

    // 粒子效果狀態
    const [particlesVisible, setParticlesVisible] = useState(false)
    const [particlesOpacity, setParticlesOpacity] = useState(0)

    // 全息電路狀態
    const [circuitVisible, setCircuitVisible] = useState(false)
    const [circuitOpacity, setCircuitOpacity] = useState(0)
    const [circuitGrowth, setCircuitGrowth] = useState(0)

    // Center Lock 歸位特效狀態
    const [lockEffectVisible, setLockEffectVisible] = useState(false)
    const [lockEffectProgress, setLockEffectProgress] = useState(0)

    // 全息投影狀態（VR朝上投射）
    const [holoVisible, setHoloVisible] = useState(false)
    const [holoOpacity, setHoloOpacity] = useState(0)
    const [vrFlipProgress, setVrFlipProgress] = useState(0)

    // ===== Rotation Reset Animation =====
    useEffect(() => {
        if (shouldResetRotation && !isResetting) {
            setIsResetting(true)

            // Animate rotation back to origin over 500ms
            const startRotation = { ...rotation }
            const startTime = Date.now()
            const duration = 500

            const animate = () => {
                const elapsed = Date.now() - startTime
                const progress = Math.min(elapsed / duration, 1)

                // Ease-out curve for smooth deceleration
                const eased = 1 - Math.pow(1 - progress, 3)

                setRotation({
                    x: startRotation.x * (1 - eased),
                    y: startRotation.y * (1 - eased),
                    z: startRotation.z * (1 - eased)
                })

                if (progress < 1) {
                    requestAnimationFrame(animate)
                } else {
                    setRotation({ x: 0, y: 0, z: 0 })
                    setIsResetting(false)
                    clearResetFlag()
                }
            }

            requestAnimationFrame(animate)
        }
    }, [shouldResetRotation, isResetting, rotation, clearResetFlag])

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

        // ===== Phase 3: The Descent Animation (Container Only) =====
        // Descent starts at 5.2 (after lock screen/init)
        if (containerRef.current) {
            const descentStart = 5.2
            const descentEnd = 6.2 // 1000vh duration

            // ===== Phase 4: Return to Center (after portal) =====
            // ===== Phase 4: Return to Center (after portal) =====
            // portal ends at scrollValue ~25.0 (updated)
            const returnStart = 25.0
            const returnEnd = 26.0   // 1000vh for return animation

            // ===== Phase 4: Center Lock (VR settles at center with subtle effect) =====
            const lockStart = 26.0
            const lockEnd = 27.0    // 1000vh pause with settling effect

            // ===== Phase 4: Feature Showcase (after lock) =====
            const showcaseStart = 27.0
            const showcaseEnd = 32.0  // 5000vh for rotation showcase

            // Default State
            let scale = 1.0
            let posX = 0
            let posY = 0
            let rotZ = 0
            let rotY = 0
            let rotX = 0  // 新增 X 軸旋轉用於 VR 朝上

            // ===== PHASE 5: Holographic Projection (VR faces up) =====
            const holoPhaseStart = 32.0
            const holoPhaseEnd = 33.0  // 1秒過渡到朝上姿態

            if (scrollValue > holoPhaseStart) {
                // VR 翻轉朝上，作為投影儀
                const holoProgress = Math.min(Math.max((scrollValue - holoPhaseStart) / (holoPhaseEnd - holoPhaseStart), 0), 1)
                const t = holoProgress * holoProgress * (3 - 2 * holoProgress) // smoothstep

                // 設定 VR 翻轉進度（傳給 HolographicProjection）
                setVrFlipProgress(t)

                // VR 位置：中央偏下
                posX = 0
                posY = -0.25 * t  // 稍微下移，讓投影有空間
                scale = 0.8 - (0.6 * t)  // 縮小到 0.2 (極小)

                // VR 翻轉朝上 (rotation.x 從 0 → -90°)
                rotX = -Math.PI / 2 * t
                rotY = 0
                rotZ = 0

                // Hide lock effect
                setLockEffectVisible(false)

            } else if (scrollValue > showcaseStart) {
                // ===== PHASE 4C: Feature Showcase - VR rotates with feature-specific zoom =====
                const showcaseProgress = Math.min(Math.max((scrollValue - showcaseStart) / (showcaseEnd - showcaseStart), 0), 1)

                // Get current callout visibility state with phase info
                const visibility = getCalloutVisibility(showcaseProgress)

                // VR is at center
                posX = 0
                posY = 0
                rotZ = 0

                if (visibility.feature) {
                    const currentFeature = visibility.feature
                    const currentIndex = featurePoints.findIndex(f => f.id === currentFeature.id)
                    const nextFeature = featurePoints[currentIndex + 1] || null

                    // 定義階段比例（與 featureConfig 中一致）
                    const enterZone = 0.15
                    const visibleZone = 0.60
                    const exitZone = 0.25

                    if (visibility.phase === 'entering' || visibility.phase === 'visible') {
                        // 進場區或顯示區：VR 停在當前 feature 的旋轉角度
                        rotY = currentFeature.rotationY
                        scale = 0.8 * currentFeature.zoomScale
                    } else if (visibility.phase === 'exiting' && nextFeature) {
                        // 退場區：VR 開始旋轉到下一個 feature
                        // 計算退場區內的局部進度（0 到 1）
                        const exitStart = enterZone + visibleZone  // 0.75
                        const exitProgress = (visibility.localProgress - exitStart) / exitZone
                        const t = exitProgress * exitProgress * (3 - 2 * exitProgress) // smoothstep

                        // 從當前 feature 平滑旋轉到下一個 feature
                        rotY = currentFeature.rotationY + (nextFeature.rotationY - currentFeature.rotationY) * t
                        scale = 0.8 * (currentFeature.zoomScale + (nextFeature.zoomScale - currentFeature.zoomScale) * t)
                    } else {
                        // exiting 但沒有下一個 feature（最後一個）
                        rotY = currentFeature.rotationY
                        scale = 0.8 * currentFeature.zoomScale
                    }
                } else {
                    // Fallback: simple rotation
                    rotY = showcaseProgress * Math.PI * 2
                    scale = 0.8
                }

                // Hide lock effect
                setLockEffectVisible(false)

            } else if (scrollValue > lockStart) {
                // ===== PHASE 4B: Center Lock - VR settles with subtle breathing/pulse =====
                const lockProgress = Math.min(Math.max((scrollValue - lockStart) / (lockEnd - lockStart), 0), 1)

                // VR is at center, stable
                posX = 0
                posY = 0
                rotZ = 0
                rotY = 0

                // Subtle breathing/pulse effect during lock (only in first half)
                if (lockProgress < 0.5) {
                    const pulse = Math.sin(lockProgress * Math.PI * 4) * 0.02 * (1 - lockProgress * 2)
                    scale = 0.8 + pulse
                } else {
                    scale = 0.8  // Static after effect completes
                }

                // Trigger lock effect visual:
                // - First 15%: VR settling, no effect
                // - 15% to 55%: Effect plays at NORMAL speed (40% of duration = same as original 500vh would give)
                // - 55% to 100%: Pure static pause before rotation
                if (lockProgress > 0.15 && lockProgress < 0.55) {
                    setLockEffectVisible(true)
                    // Remap 0.15->0.55 to 0->1 for full speed effect
                    const effectProgress = (lockProgress - 0.15) / 0.4
                    setLockEffectProgress(effectProgress)
                } else {
                    setLockEffectVisible(false)
                }

            } else if (scrollValue > returnStart) {
                // ===== PHASE 4A: Return to Center - VR slides back from top-right =====
                const returnProgress = Math.min(Math.max((scrollValue - returnStart) / (returnEnd - returnStart), 0), 1)

                // Smoothstep for smooth transition
                const t = returnProgress * returnProgress * (3 - 2 * returnProgress)

                // Return to center and enlarge
                scale = 0.35 + (t * 0.45)  // 0.35 -> 0.8 (from HUD size to showcase size)
                posX = 0.6 * (1 - t)       // 0.6 -> 0 (return to center)
                posY = 0.25 * (1 - t)      // 0.25 -> 0 (return to center)
                rotZ = 0.05 * (1 - t)      // Remove tilt
                rotY = -0.15 * (1 - t)     // Reset Y rotation

            } else if (scrollValue > descentStart) {
                // ===== PHASE 3: Descent - move to top right corner =====
                const descentProgress = Math.min(Math.max((scrollValue - descentStart) / (descentEnd - descentStart), 0), 1)

                // Smoothstep interpolation
                const t = descentProgress * descentProgress * (3 - 2 * descentProgress)

                // Target: Top Right Corner (HUD Mode)
                scale = 1.0 - (t * 0.65) // 1.0 -> 0.35
                posX = t * 0.6      // More Right (0 -> 0.6) - Reduced from 0.8 to prevent clipping
                posY = t * 0.25     // Higher (0 -> 0.25) - Reduced from 0.35 to prevent clipping

                // Slight tilt
                rotZ = t * 0.05
                rotY = t * -0.15
            }

            containerRef.current.scale.set(scale, scale, scale)
            containerRef.current.position.set(posX, posY, 0)
            containerRef.current.rotation.x = rotX
            containerRef.current.rotation.z = rotZ
            containerRef.current.rotation.y = rotY
        }

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

                // 齒輪淡入動畫 (3.3 - 3.8)
                const gearStart = 3.3
                const gearEnd = 3.8
                let gearOpacity = 0

                if (scrollValue > gearStart) {
                    const t = Math.min((scrollValue - gearStart) / (gearEnd - gearStart), 1)
                    gearOpacity = t * t * (3 - 2 * t) // smoothstep
                }

                if (gearGroupRef.current) {
                    const isGearVisible = gearOpacity > 0.01 && meshRef.current.visible
                    gearGroupRef.current.visible = isGearVisible

                    if (isGearVisible) {
                        gearGroupRef.current.rotation.copy(meshRef.current.rotation)

                        // 動態更新材質透明度
                        gearGroupRef.current.traverse((child) => {
                            if (child instanceof THREE.Mesh && child.material) {
                                const materials = Array.isArray(child.material) ? child.material : [child.material];
                                materials.forEach((mat) => {
                                    mat.opacity = gearOpacity
                                    mat.transparent = true
                                    mat.depthWrite = gearOpacity > 0.9
                                })
                            }
                        })

                        // 齒輪獨立自轉動畫
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

        // ===== VR 耳罩跟隨主體 =====
        if (meshRef.current) {
            const morphT = Math.min(Math.max((scrollValue - 2.4) / 0.5, 0), 1)
            const shouldShow = morphT >= 1 && meshRef.current.visible
            setHeadphonesVisible(shouldShow)
            if (materialRef.current) {
                setHeadphonesOpacity(materialRef.current.opacity)
            }
            headphonesRotation.current.copy(meshRef.current.rotation)
        }

        // ===== 掃描效果 (scrollValue 4.5+ 持續顯示) =====
        const scanStart = 4.5
        if (scrollValue >= scanStart && meshRef.current?.visible) {
            setScanVisible(true)
        } else {
            setScanVisible(false)
        }

        // DEBUG: Log scroll and visibility state
        if (scrollValue > 4.0) {
            console.log('scrollValue:', scrollValue.toFixed(2), 'meshVisible:', meshRef.current?.visible)
        }

        // ===== 粒子效果 (scrollValue 4.8+) =====
        const particleStart = 4.8
        if (scrollValue >= particleStart && meshRef.current?.visible) {
            setParticlesVisible(true)
            const pOpacity = Math.min((scrollValue - particleStart) / 0.3, 1)
            setParticlesOpacity(pOpacity)
        } else {
            setParticlesVisible(false)
            setParticlesOpacity(0)
        }

        // ===== 全息電路 (scrollValue 5.0+) =====
        const circuitStart = 5.0
        const circuitGrowEnd = 5.8
        if (scrollValue >= circuitStart && meshRef.current?.visible) {
            setCircuitVisible(true)
            const cOpacity = Math.min((scrollValue - circuitStart) / 0.3, 1)
            setCircuitOpacity(cOpacity)

            // 電路生長進度
            const growth = Math.min(Math.max((scrollValue - circuitStart) / (circuitGrowEnd - circuitStart), 0), 1)
            setCircuitGrowth(growth)
        } else {
            setCircuitVisible(false)
            setCircuitOpacity(0)
            setCircuitGrowth(0)
        }

        // ===== 全息投影 (scrollValue 32.0+ 之後，VR 朝上投射) =====
        const holoStart = 32.0
        const holoFadeEnd = 32.5
        if (scrollValue >= holoStart && meshRef.current?.visible) {
            setHoloVisible(true)
            const hOpacity = Math.min((scrollValue - holoStart) / (holoFadeEnd - holoStart), 1)
            setHoloOpacity(hOpacity)
        } else {
            setHoloVisible(false)
            setHoloOpacity(0)
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

            {/* 側面補光 - 減少耳罩邊緣黑影 */}
            <pointLight position={[10, 0, 0]} intensity={0.8} color="#ffffff" />
            <pointLight position={[-10, 0, 0]} intensity={0.8} color="#ffffff" />
            <pointLight position={[0, 10, 0]} intensity={0.6} color="#e0f0ff" />

            {/* Container Group for Descent Animation - 外部容器只負責整體位移縮放 */}
            <group ref={containerRef}>
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
                    {/* 大齒輪 - 左後方主視覺 - tech 風格 */}
                    <WatchGear
                        ref={gear1Ref}
                        radius={0.32}
                        teeth={40}
                        spokes={6}
                        gearStyle="tech"
                        color="#909090"
                        glowColor="#00aaff"
                        glowIntensity={0.35}
                        position={[-0.95, 0.08, -0.08]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 中齒輪 - 左下前方 - hollow 風格 */}
                    <WatchGear
                        ref={gear2Ref}
                        radius={0.2}
                        teeth={26}
                        spokes={4}
                        gearStyle="hollow"
                        color="#a0a0a0"
                        glowColor="#00ccff"
                        glowIntensity={0.4}
                        position={[-0.55, -0.18, 0.12]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 小齒輪 - 左上前方 - classic 風格 */}
                    <WatchGear
                        ref={gear3Ref}
                        radius={0.14}
                        teeth={18}
                        spokes={3}
                        gearStyle="classic"
                        color="#b0b0b0"
                        glowColor="#00ffff"
                        glowIntensity={0.5}
                        position={[-0.68, 0.28, 0.15]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 微型齒輪 - 極左上 - slim 風格 */}
                    <WatchGear
                        ref={gear4Ref}
                        radius={0.09}
                        teeth={12}
                        spokes={3}
                        gearStyle="slim"
                        color="#c0c0c0"
                        glowColor="#00ddff"
                        glowIntensity={0.55}
                        position={[-1.18, 0.22, 0.05]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 超小齒輪 - 左下後 - minimal 風格 */}
                    <WatchGear
                        ref={gear5Ref}
                        radius={0.07}
                        teeth={10}
                        spokes={3}
                        gearStyle="minimal"
                        color="#d0d0d0"
                        glowColor="#00eeff"
                        glowIntensity={0.6}
                        position={[-1.08, -0.12, -0.05]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />

                    {/* ===== 右側群組（4顆，不對稱）===== */}
                    {/* 中大齒輪 - 右側主視覺 - hollow 風格 */}
                    <WatchGear
                        ref={rightGear1Ref}
                        radius={0.26}
                        teeth={32}
                        spokes={5}
                        gearStyle="hollow"
                        color="#909090"
                        glowColor="#00aaff"
                        glowIntensity={0.35}
                        position={[0.85, -0.05, 0.02]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 小齒輪 - 右上前 - tech 風格 */}
                    <WatchGear
                        ref={rightGear2Ref}
                        radius={0.15}
                        teeth={20}
                        spokes={4}
                        gearStyle="tech"
                        color="#a0a0a0"
                        glowColor="#00ccff"
                        glowIntensity={0.45}
                        position={[0.58, 0.2, 0.14]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 微型齒輪 - 極右後 - classic 風格 */}
                    <WatchGear
                        ref={rightGear3Ref}
                        radius={0.11}
                        teeth={14}
                        spokes={3}
                        gearStyle="classic"
                        color="#b0b0b0"
                        glowColor="#00ddff"
                        glowIntensity={0.5}
                        position={[1.12, 0.12, -0.06]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                    {/* 超微型齒輪 - 右下 - slim 風格 */}
                    <WatchGear
                        ref={rightGear4Ref}
                        radius={0.08}
                        teeth={11}
                        spokes={3}
                        gearStyle="slim"
                        color="#c0c0c0"
                        glowColor="#00eeff"
                        glowIntensity={0.55}
                        position={[-0.7, -0.22, 0.1]}
                        rotation={[Math.PI / 2, 0, 0]}
                    />
                </group>

                {/* VR 耳罩 - 左右兩側 */}
                <VRHeadphones
                    visible={headphonesVisible}
                    parentRotation={headphonesRotation.current}
                    opacity={headphonesOpacity}
                />

                {/* 掃描效果 */}
                <VRScanEffect
                    geometry={geometry}
                    visible={scanVisible}
                    parentRotation={headphonesRotation.current}
                />

                {/* 耳罩粒子效果 */}
                <EarcupParticles
                    visible={particlesVisible}
                    opacity={particlesOpacity}
                    parentRotation={headphonesRotation.current}
                />

                {/* 全息電路板 - 暫時移除 */}
                {/* <HolographicCircuit
                    visible={circuitVisible}
                    opacity={circuitOpacity}
                    growth={circuitGrowth}
                    parentRotation={headphonesRotation.current}
                /> */}

                {/* Center Lock 歸位特效 */}
                <CenterLockEffect
                    visible={lockEffectVisible}
                    progress={lockEffectProgress}
                />
            </group>

            {/* 全息投影 - 獨立於 VR，在世界座標上方 */}
            <HolographicProjection
                visible={holoVisible}
                opacity={holoOpacity}
                vrFlipProgress={vrFlipProgress}
            />
        </>
    )
}
