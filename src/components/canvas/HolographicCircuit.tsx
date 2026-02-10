'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

// Shader：全息蜂巢電路板
const vertexShader = `
varying vec2 vUv;

void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`

const fragmentShader = `
uniform float uTime;
uniform float uOpacity;
uniform float uGrowth;       // 0-1 電路生長進度
uniform vec3 uPrimaryColor;
uniform vec3 uSecondaryColor;

varying vec2 vUv;

// 六角形距離函數
float hexDist(vec2 p) {
    p = abs(p);
    return max(p.x * 0.866025 + p.y * 0.5, p.y);
}

// 六角形網格
float hexGrid(vec2 uv, float scale) {
    vec2 r = vec2(1.0, 1.732);
    vec2 h = r * 0.5;
    vec2 a = mod(uv * scale, r) - h;
    vec2 b = mod(uv * scale - h, r) - h;
    
    vec2 gv = length(a) < length(b) ? a : b;
    
    float d = hexDist(gv);
    return smoothstep(0.4, 0.35, d);  // 六角形邊線
}

// 電路線生長
float circuitLine(vec2 uv, float time, float growth) {
    float line = 0.0;
    
    // 主幹線（水平）
    float mainLineY = 0.5;
    float mainDist = abs(uv.y - mainLineY);
    float mainLine = smoothstep(0.01, 0.005, mainDist);
    
    // 生長動畫：從左到右
    float growMask = smoothstep(0.0, growth, uv.x);
    mainLine *= growMask;
    
    // 分支線（垂直）
    for (int i = 0; i < 5; i++) {
        float branchX = 0.2 + float(i) * 0.15;
        float branchGrow = smoothstep(branchX - 0.1, branchX, growth);
        
        if (abs(uv.x - branchX) < 0.008) {
            float branchStart = 0.3 + sin(float(i) * 2.0) * 0.1;
            float branchEnd = 0.7 + cos(float(i) * 1.5) * 0.1;
            
            if (uv.y > branchStart && uv.y < branchEnd) {
                line += branchGrow;
            }
        }
    }
    
    line += mainLine;
    return min(line, 1.0);
}

void main() {
    // 蜂巢背景（若隱若現）
    float hex = hexGrid(vUv - 0.5, 15.0);
    float hexPulse = sin(uTime * 2.0) * 0.3 + 0.5;
    vec3 hexColor = uSecondaryColor * hex * hexPulse * 0.15;
    
    // 電路線
    float circuit = circuitLine(vUv, uTime, uGrowth);
    
    // 節點發光（線條交叉點）
    float nodes = 0.0;
    for (int i = 0; i < 5; i++) {
        float nodeX = 0.2 + float(i) * 0.15;
        float nodeY = 0.5;
        vec2 nodePos = vec2(nodeX, nodeY);
        float nodeDist = length(vUv - nodePos);
        float nodeGlow = smoothstep(0.03, 0.01, nodeDist);
        
        // 只有生長到的節點才發光
        float nodeActive = smoothstep(nodeX - 0.05, nodeX, uGrowth);
        nodes += nodeGlow * nodeActive;
    }
    
    // 合併效果
    vec3 circuitColor = uPrimaryColor * circuit * 1.5;
    vec3 nodeColor = vec3(1.0) * nodes;  // 節點用白色
    
    vec3 finalColor = hexColor + circuitColor + nodeColor;
    float alpha = (hex * 0.1 + circuit + nodes * 0.5) * uOpacity;
    
    // 邊緣虛化
    float edgeFade = smoothstep(0.0, 0.1, vUv.x) * smoothstep(1.0, 0.9, vUv.x)
                   * smoothstep(0.0, 0.1, vUv.y) * smoothstep(1.0, 0.9, vUv.y);
    alpha *= edgeFade;
    
    gl_FragColor = vec4(finalColor, alpha);
}
`

interface HolographicCircuitProps {
    visible: boolean
    opacity: number    // 0-1
    growth: number     // 0-1 電路生長進度
    parentRotation: THREE.Euler
}

export default function HolographicCircuit({
    visible,
    opacity,
    growth,
    parentRotation
}: HolographicCircuitProps) {
    const meshRef = useRef<THREE.Mesh>(null)
    const materialRef = useRef<THREE.ShaderMaterial>(null)

    const uniforms = useMemo(() => ({
        uTime: { value: 0 },
        uOpacity: { value: 0 },
        uGrowth: { value: 0 },
        uPrimaryColor: { value: new THREE.Color('#00ffff') },   // 青
        uSecondaryColor: { value: new THREE.Color('#9400D3') }  // 紫
    }), [])

    useFrame((state) => {
        if (!meshRef.current || !visible) return

        // 跟隨 VR 旋轉
        meshRef.current.rotation.copy(parentRotation)

        // 更新 uniforms
        if (materialRef.current) {
            materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
            materialRef.current.uniforms.uOpacity.value = opacity
            materialRef.current.uniforms.uGrowth.value = growth
        }
    })

    if (!visible) return null


    return (
        <mesh
            ref={meshRef}
            position={[0, 0, 0.25]}
            rotation={[0, 0, 0]}
        >
            <planeGeometry args={[0.5, 0.32]} />
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
