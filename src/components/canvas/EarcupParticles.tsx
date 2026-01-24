'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { useControls } from 'leva'
import * as THREE from 'three'

interface EarcupParticlesProps {
    visible: boolean
    opacity: number
    parentRotation: THREE.Euler
}

const PARTICLE_COUNT = 60

// 單層 Shader：Fragment 內處理 core + glow
const vertexShader = `
uniform float uTime;
uniform float uAggregation;
uniform float uSize;

attribute float seed;

varying float vSeed;

void main() {
    vSeed = seed;
    
    // 聚合/分散動畫
    float disperseFactor = sin(uAggregation * 3.14159);
    float scale = 0.5 + disperseFactor * 0.5;
    
    // 隨機移動（Y-Z 平面）
    float jitterX = sin(uTime * 1.5 + seed * 20.0) * 0.005;  // X 很小（厚度）
    float jitterY = sin(uTime * 2.0 + seed * 10.0) * 0.025 + cos(uTime * 1.5 + seed * 8.0) * 0.015;
    float jitterZ = cos(uTime * 1.8 + seed * 15.0) * 0.025 + sin(uTime * 1.2 + seed * 12.0) * 0.015;
    
    vec3 pos = position * scale + vec3(jitterX, jitterY, jitterZ);
    
    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = uSize * (1.0 / -mvPosition.z);
}
`

const fragmentShader = `
uniform vec3 uCoreColor;
uniform vec3 uGlowColor;
uniform float uCoreRadius;
uniform float uGlowRadius;
uniform float uGlowIntensity;
uniform float uOpacity;

varying float vSeed;

void main() {
    // 到粒子中心的距離 (0 = 中心, 1 = 邊緣)
    float dist = length(gl_PointCoord - 0.5) * 2.0;
    
    // 核心：硬邊，飽和色
    float core = 1.0 - smoothstep(0.0, uCoreRadius, dist);
    
    // 光暈：柔邊，漸隱
    float glow = 1.0 - smoothstep(uCoreRadius, uGlowRadius, dist);
    glow = pow(glow, 1.5) * uGlowIntensity;
    
    // 確保光暈不覆蓋核心
    glow *= (1.0 - core);
    
    // 雙色漸層：根據 seed 混合兩色
    vec3 particleColor = mix(uCoreColor, uGlowColor, vSeed);
    
    // 合併顏色
    vec3 color = particleColor * (core + glow);
    float alpha = (core + glow * 0.6) * uOpacity;
    
    if (alpha < 0.01) discard;
    
    gl_FragColor = vec4(color, alpha);
}
`

export default function EarcupParticles({
    visible,
    opacity,
    parentRotation
}: EarcupParticlesProps) {
    const groupRef = useRef<THREE.Group>(null)
    const leftPointsRef = useRef<THREE.Points>(null)
    const rightPointsRef = useRef<THREE.Points>(null)

    // Leva 控制
    const controls = useControls('Particles', {
        coreColor: { value: '#00CED1', label: 'Color 1 (Cyan)' },
        glowColor: { value: '#FF1493', label: 'Color 2 (Pink)' },
        coreRadius: { value: 0.25, min: 0.1, max: 0.5, step: 0.05 },
        glowRadius: { value: 0.85, min: 0.3, max: 1.0, step: 0.05 },
        glowIntensity: { value: 0.7, min: 0.0, max: 2.0, step: 0.1 },
        size: { value: 15, min: 5, max: 40, step: 1 },
    })

    // 初始化粒子資料
    const { positions, seeds } = useMemo(() => {
        const pos = new Float32Array(PARTICLE_COUNT * 3)
        const sds = new Float32Array(PARTICLE_COUNT)

        for (let i = 0; i < PARTICLE_COUNT; i++) {
            // Y-Z 平面分佈（對齊耳罩面向）
            const angle = Math.random() * Math.PI * 2
            const radius = 0.01 + Math.random() * 0.045
            pos[i * 3] = (Math.random() - 0.5) * 0.02     // X: 很小（深度）
            pos[i * 3 + 1] = Math.cos(angle) * radius      // Y: 上下分佈
            pos[i * 3 + 2] = Math.sin(angle) * radius      // Z: 前後分佈
            sds[i] = Math.random()
        }

        return { positions: pos, seeds: sds }
    }, [])

    // Uniforms
    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uAggregation: { value: 0 },
        uSize: { value: controls.size },
        uCoreColor: { value: new THREE.Color(controls.coreColor) },
        uGlowColor: { value: new THREE.Color(controls.glowColor) },
        uCoreRadius: { value: controls.coreRadius },
        uGlowRadius: { value: controls.glowRadius },
        uGlowIntensity: { value: controls.glowIntensity },
        uOpacity: { value: 1 },
    }), [])

    useFrame((state) => {
        if (!groupRef.current || !visible) return

        groupRef.current.rotation.copy(parentRotation)

        const time = state.clock.elapsedTime
        const cycleTime = 4
        const aggregation = (time % cycleTime) / cycleTime

        // 更新 uniforms
        const updateUniforms = (ref: THREE.Points | null) => {
            if (!ref) return
            const mat = ref.material as THREE.ShaderMaterial
            mat.uniforms.uTime.value = time
            mat.uniforms.uAggregation.value = aggregation
            mat.uniforms.uOpacity.value = opacity
            mat.uniforms.uSize.value = controls.size
            mat.uniforms.uCoreColor.value.set(controls.coreColor)
            mat.uniforms.uGlowColor.value.set(controls.glowColor)
            mat.uniforms.uCoreRadius.value = controls.coreRadius
            mat.uniforms.uGlowRadius.value = controls.glowRadius
            mat.uniforms.uGlowIntensity.value = controls.glowIntensity
        }

        updateUniforms(leftPointsRef.current)
        updateUniforms(rightPointsRef.current)
    })

    if (!visible) return null

    const xOffset = 0.38
    const yOffset = -0.22

    return (
        <group ref={groupRef}>
            {/* 左耳罩 */}
            <points ref={leftPointsRef} position={[-xOffset, yOffset, 0]}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} />
                    <bufferAttribute attach="attributes-seed" args={[seeds.slice(), 1]} />
                </bufferGeometry>
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>

            {/* 右耳罩 */}
            <points ref={rightPointsRef} position={[xOffset, yOffset, 0]}>
                <bufferGeometry>
                    <bufferAttribute attach="attributes-position" args={[positions.slice(), 3]} />
                    <bufferAttribute attach="attributes-seed" args={[seeds.slice(), 1]} />
                </bufferGeometry>
                <shaderMaterial
                    vertexShader={vertexShader}
                    fragmentShader={fragmentShader}
                    uniforms={uniforms}
                    transparent
                    blending={THREE.AdditiveBlending}
                    depthWrite={false}
                />
            </points>
        </group>
    )
}
