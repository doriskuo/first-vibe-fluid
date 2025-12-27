'use client'

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshTransmissionMaterial, Environment } from '@react-three/drei'
import * as THREE from 'three'

export default function FluidSphere() {
    const meshRef = useRef<THREE.Mesh>(null)

    // 基礎動畫：緩慢旋轉
    useFrame((state, delta) => {
        if (meshRef.current) {
            meshRef.current.rotation.y += delta * 0.2
            meshRef.current.rotation.x += delta * 0.1
        }
    })

    return (
        <>
            {/* 環境光 */}
            <ambientLight intensity={0.5} />
            <directionalLight position={[5, 5, 5]} intensity={1} />

            {/* 環境貼圖 */}
            <Environment preset="studio" />

            {/* 液態球體 */}
            <mesh ref={meshRef}>
                <sphereGeometry args={[1.5, 64, 64]} />
                <MeshTransmissionMaterial
                    backside
                    samples={16}
                    resolution={512}
                    transmission={0.9}
                    roughness={0.1}
                    thickness={0.5}
                    ior={1.5}
                    chromaticAberration={0.1}
                    anisotropy={0.3}
                    distortion={0.5}
                    distortionScale={0.5}
                    temporalDistortion={0.1}
                    color="#E6E6FA"
                />
            </mesh>
        </>
    )
}
