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
 * VRHeadphones - VR 耳機兩側的八角形玻璃耳罩
 * 
 * 結構：兩個大的八角形耳罩，邊緣黏在 VR 主體兩側
 * 
 * 座標計算（世界座標）：
 * - VR 主體 scale = 0.15，寬度 w = 2.5
 * - VR 實際寬度 = 2.5 * 0.15 = 0.375
 * - VR 邊緣 = ±0.1875
 * - 耳罩半徑需要夠大，邊緣剛好接到 VR 邊緣
 */
export default function VRHeadphones({ visible, parentRotation, opacity }: VRHeadphonesProps) {
    const groupRef = useRef<THREE.Group>(null)
    const leftMatRef = useRef<any>(null)
    const rightMatRef = useRef<any>(null)

    // 八角形耳罩幾何體
    // 較大的耳罩，讓邊緣能接到 VR 主體
    const earCupGeometry = useMemo(() => {
        // 半徑 0.08，讓邊緣剛好接到 VR
        // 厚度 0.04
        const geo = new THREE.CylinderGeometry(0.08, 0.08, 0.04, 8)
        // 旋轉讓圓柱軸心朝向 X 軸（左右方向），平面朝外
        geo.rotateZ(Math.PI / 2)
        return geo
    }, [])

    // 同步旋轉
    useFrame(() => {
        if (groupRef.current) {
            groupRef.current.rotation.copy(parentRotation)
        }

        // 同步透明度
        if (leftMatRef.current) leftMatRef.current.opacity = opacity
        if (rightMatRef.current) rightMatRef.current.opacity = opacity
    })

    if (!visible) return null

    // 世界座標位置
    // 需要足夠大讓耳罩在 VR 外側
    // 從截圖看 VR 邊緣大約在 ±0.25，耳罩需要在更外側
    const xOffset = 0.35  // 增加到更外側

    return (
        // 不用額外 scale，直接用世界座標
        <group ref={groupRef}>
            {/* 左側耳罩 */}
            <mesh geometry={earCupGeometry} position={[-xOffset, 0, 0]}>
                <MeshTransmissionMaterial
                    ref={leftMatRef}
                    backside
                    samples={16}
                    resolution={512}
                    thickness={1.5}
                    roughness={0.03}
                    ior={1.5}
                    clearcoat={1}
                    chromaticAberration={0.06}
                    distortion={0.05}
                    distortionScale={0.05}
                    attenuationDistance={0.5}
                    attenuationColor="#ffffff"
                    color="#f0f8ff"
                    transparent={true}
                    opacity={opacity}
                    depthWrite={false}
                />
            </mesh>

            {/* 右側耳罩 */}
            <mesh geometry={earCupGeometry} position={[xOffset, 0, 0]}>
                <MeshTransmissionMaterial
                    ref={rightMatRef}
                    backside
                    samples={16}
                    resolution={512}
                    thickness={1.5}
                    roughness={0.03}
                    ior={1.5}
                    clearcoat={1}
                    chromaticAberration={0.06}
                    distortion={0.05}
                    distortionScale={0.05}
                    attenuationDistance={0.5}
                    attenuationColor="#ffffff"
                    color="#f0f8ff"
                    transparent={true}
                    opacity={opacity}
                    depthWrite={false}
                />
            </mesh>
        </group>
    )
}

