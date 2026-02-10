'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVRStore } from '@/stores/vrStore'

// Shader：短光束從左向右飛過（發光 + 無黑邊）
const vertexShader = `
varying vec3 vLocalPos;

void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uIntensity;
uniform vec3 uPurpleColor;
uniform vec3 uTealColor;

varying vec3 vLocalPos;

float random(float seed) {
    return fract(sin(seed * 12.9898) * 43758.5453);
}

void main() {
    vec3 finalColor = vec3(0.0);
    float totalGlow = 0.0;
    
    float normalizedY = (vLocalPos.y + 1.0) / 2.0;
    float normalizedX = (vLocalPos.x + 1.5) / 3.0;
    
    normalizedY = clamp(normalizedY, 0.0, 1.0);
    normalizedX = clamp(normalizedX, 0.0, 1.0);
    
    float lineWidth = 0.002;   // 更細！
    float glowWidth = 0.008;   // 更小光暈
    float speed = 1.2;
    float beamLength = 0.08;
    
    for (int i = 0; i < 12; i++) {
        float seed1 = float(i) * 7.31;
        float seed2 = float(i) * 13.17;
        float seed3 = float(i) * 23.41;
        
        float block = float(i) / 12.0;
        float randomOffset = (random(seed1) - 0.5) * 0.15;
        float randomY = block * 0.9 + 0.05 + randomOffset;
        
        float randomSpeed = speed * (0.5 + random(seed2) * 0.8);
        float randomPhase = random(seed3) * 10.0;
        float randomLength = beamLength * (0.6 + random(seed1 + seed2) * 0.8);
        
        float beamHead = fract(uTime * randomSpeed * 0.2 + randomPhase);
        float dist = abs(normalizedY - randomY);
        
        float beamStart = beamHead - randomLength;
        float beamEnd = beamHead;
        
        float beamVisible = step(beamStart, normalizedX) * step(normalizedX, beamEnd);
        
        // 核心線條（極亮）
        float core = smoothstep(lineWidth, 0.0, dist) * beamVisible;
        
        // 光暈（柔和擴散）
        float glow = smoothstep(glowWidth, lineWidth, dist) * beamVisible * 0.4;
        
        // 頭部更亮
        float headBrightness = smoothstep(beamStart, beamEnd, normalizedX);
        
        vec3 lineColor = (i / 2 * 2 == i) ? uPurpleColor : uTealColor;
        
        // 純色核心 + 純色光暈
        finalColor += lineColor * core * (1.5 + headBrightness);
        finalColor += lineColor * glow * (1.0 + headBrightness * 0.5);
        totalGlow += (core + glow) * (1.0 + headBrightness * 0.5);
    }
    
    // 使用 glow 作為 alpha，避免黑邊
    float alpha = min(totalGlow * uIntensity, 1.0);
    
    // 當 alpha 很低時不輸出顏色（避免黑邊）
    if (alpha < 0.01) discard;
    
    gl_FragColor = vec4(finalColor * uIntensity, alpha);
}
`

interface VRScanEffectProps {
    geometry: THREE.BufferGeometry
    parentRotation: THREE.Euler
}

export default function VRScanEffect({
    geometry,
    parentRotation
}: VRScanEffectProps) {
    const visible = useVRStore(s => s.scanVisible)
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uIntensity: { value: 3.0 },
        uPurpleColor: { value: new THREE.Color('#6B00B3') },  // 更深紫
        uTealColor: { value: new THREE.Color('#005555') }     // 更深墨綠
    }), [])

    useFrame((state) => {
        if (!meshRef.current || !visible) return

        meshRef.current.rotation.copy(parentRotation)

        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
        }
    })

    if (!visible) return null

    return (
        <mesh
            ref={meshRef}
            geometry={geometry}
            scale={[0.151, 0.151, 0.151]}
        >
            <shaderMaterial
                ref={materialRef}
                vertexShader={vertexShader}
                fragmentShader={fragmentShader}
                uniforms={uniforms}
                transparent={true}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
                side={THREE.DoubleSide}
            />
        </mesh>
    )
}
