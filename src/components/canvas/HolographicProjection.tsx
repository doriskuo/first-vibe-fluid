'use client'

import { useRef, useMemo, useState, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoundedBox, QuadraticBezierLine } from '@react-three/drei'

// ==================== [組件] 玻璃面板 (Premium Crystal) ====================
function GlassPanel({
    width = 0.3,
    height = 0.2,
    opacity = 1,
    children,
    color = '#ffffff'
}: {
    width?: number
    height?: number
    opacity?: number
    children?: React.ReactNode
    color?: string
}) {
    const borderPoints = useMemo(() => {
        const hw = width / 2
        const hh = height / 2
        const cornerSize = Math.min(width, height) * 0.1
        return [
            new THREE.Vector3(-hw, hh - cornerSize, 0),
            new THREE.Vector3(-hw, -hh, 0),
            new THREE.Vector3(hw - cornerSize, -hh, 0),
            new THREE.Vector3(hw, -hh + cornerSize, 0),
            new THREE.Vector3(hw, hh, 0),
            new THREE.Vector3(-hw + cornerSize, hh, 0),
            new THREE.Vector3(-hw, hh - cornerSize, 0),
        ]
    }, [width, height])
    const borderGeo = useMemo(() => new THREE.BufferGeometry().setFromPoints(borderPoints), [borderPoints])

    return (
        <group>
            {/* Crystal Body */}
            <RoundedBox args={[width, height, 0.02]} radius={0.015} smoothness={4}>
                <meshPhysicalMaterial
                    color={color}
                    transmission={1.0}
                    roughness={0}
                    metalness={0} // 玻璃是非金屬
                    thickness={0.08}
                    ior={1.5}
                    envMapIntensity={0} // 完全移除環境反射 (素色)
                    clearcoat={1.0}
                    clearcoatRoughness={0.0}
                    attenuationColor="#00ffff"
                    attenuationDistance={0.2}
                    transparent
                    opacity={opacity}
                    side={THREE.DoubleSide}
                />
            </RoundedBox>

            {/* Rim Light */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[width, height]} />
                <meshBasicMaterial color="#88ffff" wireframe transparent opacity={opacity * 0.3} />
            </mesh>

            {/* Corners */}
            <group position={[0, 0, 0.015]}>
                {[[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([x, y], i) => (
                    <mesh key={i} position={[x * (width / 2 - 0.01), y * (height / 2 - 0.01), 0]}>
                        <circleGeometry args={[0.003, 8]} />
                        <meshBasicMaterial color="#ffffff" opacity={opacity} transparent blending={THREE.AdditiveBlending} />
                    </mesh>
                ))}
            </group>

            {/* Content Container */}
            <group position={[0, 0, 0.02]}>
                {children}
            </group>
        </group>
    )
}

// ==================== [組件] 3D 全息地球 (Holographic Globe) ====================
function GlobePanel({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)

    useFrame((state, delta) => {
        if (groupRef.current) {
            groupRef.current.rotation.y += delta * 0.1
        }
    })

    const { points, connections } = useMemo(() => {
        const pts = []
        const connections = []
        const radius = 0.12

        const clusters = [
            { lat: 40, lon: -100, s: 0.5 },   // NA
            { lat: -20, lon: -60, s: 0.4 },   // SA
            { lat: 50, lon: 10, s: 0.3 },     // EU
            { lat: 0, lon: 20, s: 0.5 },      // AF
            { lat: 40, lon: 100, s: 0.6 },    // AS
            { lat: -25, lon: 140, s: 0.4 }    // AU
        ]

        const latLonToVector3 = (lat: number, lon: number, r: number) => {
            const phi = (90 - lat) * (Math.PI / 180)
            const theta = (lon + 180) * (Math.PI / 180)
            const x = -(r * Math.sin(phi) * Math.cos(theta))
            const z = (r * Math.sin(phi) * Math.sin(theta))
            const y = (r * Math.cos(phi))
            return new THREE.Vector3(x, y, z)
        }

        const clusterPoints: THREE.Vector3[] = []
        for (let c of clusters) {
            const count = 150 + Math.random() * 100
            const center = latLonToVector3(c.lat, c.lon, radius)
            clusterPoints.push(center)

            for (let i = 0; i < count; i++) {
                const latOffset = (Math.random() - 0.5) * 60 * c.s
                const lonOffset = (Math.random() - 0.5) * 80 * c.s
                const p = latLonToVector3(c.lat + latOffset, c.lon + lonOffset, radius)
                pts.push(p.x, p.y, p.z)
            }
        }

        for (let i = 0; i < 300; i++) {
            const lat = (Math.random() - 0.5) * 180
            const lon = (Math.random() - 0.5) * 360
            const p = latLonToVector3(lat, lon, radius)
            pts.push(p.x, p.y, p.z)
        }

        for (let i = 0; i < clusterPoints.length; i++) {
            for (let j = i + 1; j < clusterPoints.length; j++) {
                if (Math.random() > 0.6) continue
                const start = clusterPoints[i]
                const end = clusterPoints[j]
                const dist = start.distanceTo(end)
                if (dist > radius * 1.8) continue

                const mid = start.clone().add(end).multiplyScalar(0.5).normalize().multiplyScalar(radius * (1.2 + Math.random() * 0.3))
                const curve = new THREE.QuadraticBezierCurve3(start, mid, end)
                connections.push(curve.getPoints(20))
            }
        }

        return {
            points: new Float32Array(pts),
            connections
        }
    }, [])

    const geo = useMemo(() => {
        const g = new THREE.BufferGeometry()
        g.setAttribute('position', new THREE.BufferAttribute(points, 3))
        return g
    }, [points])

    return (
        <group ref={groupRef}>
            <points geometry={geo}>
                <pointsMaterial size={0.003} color="#00ffff" transparent opacity={opacity} sizeAttenuation={false} />
            </points>
            <mesh>
                <sphereGeometry args={[0.115, 32, 32]} />
                <meshBasicMaterial color="#000033" transparent opacity={opacity * 0.8} />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.12, 32, 32]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.15} wireframe />
            </mesh>
            {connections.map((pts, i) => (
                <line key={i}>
                    <bufferGeometry>
                        <bufferAttribute attach="attributes-position" args={[new Float32Array(pts.flatMap(p => [p.x, p.y, p.z])), 3]} />
                    </bufferGeometry>
                    <lineBasicMaterial color="#ffffff" transparent opacity={opacity * 0.4} />
                </line>
            ))}
        </group>
    )
}

// ==================== [組件] 紋理地圖與背景 (Image Based Flat Map) ====================
function FlatMapContent({ opacity }: { opacity: number }) {
    // 1. 背景圖 (Taipei 101 Night View)
    // 使用更可靠的 Unsplash Source URL
    const bgMap = useMemo(() => new THREE.TextureLoader().load('https://images.unsplash.com/photo-1542259685-9a84f98126d4?q=80&w=1000&auto=format&fit=crop'), [])

    // 2. 世界地圖紋理 (Wikimedia Commons - High Contrast)
    // 黑底白陸地的地圖最適合 Additive Blending
    // 這裡使用一張透明底的 PNG，我們會把它染成青色
    // 上面這張是 Blue Marble，太複雜，改用簡單的剪像
    // 換：透明底黑色大陸
    // 換：Wikimedia Blank Map (Transparent)
    const mapTex = useMemo(() => new THREE.TextureLoader().load('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png'), [])

    // 4. 計算台灣座標 (Taiwan: 23.5N, 121E)
    // 調整比例：原圖約為 1.83:1 (Wikipedia generic mercator often cuts poles)
    // 試著將高度稍微拉高以修正擠壓感
    const mapW = 0.65
    const mapH = 0.38 // Modified Aspect Ratio: ~1.71

    // UV Mapping 重新校準
    // Taiwan (121, 23.5)
    // 簡單線性內插修正
    // 經度 u: (121 + 170) / 340 (假設地圖沒包含完整360，或有裁切) -> 試誤法微調
    // 根據視覺經驗，亞洲在右側偏上
    const twX = (0.78 - 0.5) * mapW // 微調 X
    const twY = (0.64 - 0.5) * mapH // 微調 Y

    return (
        <group>
            {/* 背景圖 (Taipei 101 Style) */}
            <mesh position={[0, 0, -0.01]}>
                <planeGeometry args={[0.7, 0.45]} />
                <meshBasicMaterial map={bgMap} transparent opacity={opacity * 0.5} toneMapped={false} />
            </mesh>

            {/* 暗色濾鏡 (壓暗背景) */}
            <mesh position={[0, 0, -0.005]}>
                <planeGeometry args={[0.7, 0.45]} />
                <meshBasicMaterial color="#001133" transparent opacity={opacity * 0.6} />
            </mesh>

            {/* 地圖層 (Cyan Hologram) */}
            <mesh position={[0, 0, 0]}>
                <planeGeometry args={[mapW, mapH]} />
                {/* 使用簡單材質確保可見 */}
                <meshBasicMaterial
                    map={mapTex}
                    color="#00ffff"
                    transparent
                    opacity={opacity * 0.8}
                // blending={THREE.AdditiveBlending} // 如果圖是透明底，Additive 會讓它發光
                />
            </mesh>

            {/* 掃描線網格效果 (Overlay) */}
            <mesh position={[0, 0, 0.001]}>
                <planeGeometry args={[mapW, mapH]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={opacity * 0.1}
                    wireframe
                    side={THREE.DoubleSide}
                />
            </mesh>


            {/* Taiwan Highlight */}
            <group position={[twX, twY, 0.01]}>
                <mesh>
                    <circleGeometry args={[0.006, 16]} />
                    <meshBasicMaterial color="#ff0000" transparent opacity={opacity} />
                </mesh>
                <mesh>
                    <ringGeometry args={[0.008, 0.012, 32]} />
                    <meshBasicMaterial color="#ff0000" transparent opacity={opacity * 0.8} side={THREE.DoubleSide} />
                </mesh>
                <PulseRing color="#ff0000" scale={2.5} opacity={opacity} speed={3} />
            </group>
        </group>
    )
}

function PulseRing({ color, scale = 1, opacity, speed = 1 }: any) {
    const ref = useRef<THREE.Mesh>(null)
    useFrame((state) => {
        if (ref.current) {
            const s = 1 + (state.clock.elapsedTime * speed) % scale
            ref.current.scale.set(s, s, s)
            const o = 1 - ((s - 1) / scale)
            if (Array.isArray(ref.current.material)) {
                // ignore
            } else {
                ref.current.material.opacity = o * opacity
            }
        }
    })
    return (
        <mesh ref={ref}>
            <ringGeometry args={[0.008, 0.01, 32]} />
            <meshBasicMaterial color={color} transparent opacity={opacity} side={THREE.DoubleSide} />
        </mesh>
    )
}

// ==================== [組件] 數據圖表 ====================
function DataListPanel({ opacity }: { opacity: number }) {
    return (
        <group>
            <mesh position={[-0.05, 0.1, 0]}>
                <planeGeometry args={[0.08, 0.015]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity} />
            </mesh>
            {Array.from({ length: 5 }).map((_, i) => {
                const y = 0.05 - i * 0.05
                const w = 0.05 + Math.random() * 0.1
                return (
                    <mesh key={i} position={[-0.02, y, 0]}>
                        <planeGeometry args={[w, 0.006]} />
                        <meshBasicMaterial color="#00ffff" transparent opacity={opacity * (0.3 + Math.random() * 0.5)} />
                    </mesh>
                )
            })}
        </group>
    )
}

function WaveformPanel({ opacity }: { opacity: number }) {
    const lineRef = useRef<THREE.Line>(null)
    useFrame((state) => {
        if (lineRef.current) {
            const positions = lineRef.current.geometry.attributes.position.array as Float32Array;
            const time = state.clock.elapsedTime
            for (let i = 0; i < 20; i++) {
                const x = (i / 19) * 0.2 - 0.1
                const y = Math.sin(i * 0.5 + time * 5) * 0.05
                positions[i * 3] = x
                positions[i * 3 + 1] = y
                positions[i * 3 + 2] = 0
            }
            lineRef.current.geometry.attributes.position.needsUpdate = true
        }
    })

    const geometry = useMemo(() => {
        const geo = new THREE.BufferGeometry()
        const count = 20
        const positions = new Float32Array(count * 3)
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
        return geo
    }, [])

    return (
        <group>
            {/* @ts-ignore */}
            <line ref={lineRef} geometry={geometry}>
                <lineBasicMaterial color="#ff00ff" transparent opacity={opacity} />
            </line>
            <gridHelper args={[0.25, 4, '#001a33', '#000810']} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.01]} />
        </group>
    )
}

// ==================== [模式 D] 3D 地球模式 ====================
function PatternGlassGlobe({ opacity }: { opacity: number }) {
    return (
        <group>
            <GlassPanel width={0.5} height={0.35} opacity={opacity}>
                <GlobePanel opacity={opacity} />
            </GlassPanel>

            <group position={[-0.4, 0, 0.1]} rotation={[0, 0.3, 0]}>
                <GlassPanel width={0.25} height={0.3} opacity={opacity} color="#0088ff">
                    <DataListPanel opacity={opacity} />
                </GlassPanel>
            </group>

            <group position={[0.4, 0, 0.1]} rotation={[0, -0.3, 0]}>
                <GlassPanel width={0.25} height={0.3} opacity={opacity} color="#ff00ff">
                    <WaveformPanel opacity={opacity} />
                </GlassPanel>
            </group>
        </group>
    )
}

// ==================== [模式 E] 平面地圖模式 (New) ====================
function PatternFlatMap({ opacity }: { opacity: number }) {
    return (
        <group>
            {/* 特大號面板 for Flat Map */}
            <GlassPanel width={0.7} height={0.45} opacity={opacity}>
                <FlatMapContent opacity={opacity} />
            </GlassPanel>
        </group>
    )
}

// ==================== [模式 A] Hex Brain ====================
function PatternHex({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const ringRef = useRef<THREE.Group>(null)
    const coreRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        const time = state.clock.elapsedTime
        if (ringRef.current) ringRef.current.rotation.z = time * 0.2
        if (groupRef.current) groupRef.current.rotation.y = Math.sin(time * 0.5) * 0.1

        if (coreRef.current) {
            coreRef.current.rotation.x = time * 0.5
            coreRef.current.rotation.y = time * 0.3
        }
    })

    return (
        <group ref={groupRef}>
            <group ref={ringRef}>
                <mesh rotation={[0, 0, Math.PI / 6]}>
                    <ringGeometry args={[0.22, 0.225, 6]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.9} side={THREE.DoubleSide} />
                </mesh>
                <mesh rotation={[0, 0, 0]}>
                    <ringGeometry args={[0.18, 0.182, 32]} />
                    <meshBasicMaterial color="#0088ff" transparent opacity={opacity * 0.7} side={THREE.DoubleSide} />
                </mesh>
            </group>
            <mesh ref={coreRef}>
                <icosahedronGeometry args={[0.08, 1]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.4} wireframe />
            </mesh>
            <mesh>
                <sphereGeometry args={[0.04, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={opacity * 0.9} />
            </mesh>
            <mesh rotation={[0, 0, Math.PI / 4]}>
                <planeGeometry args={[0.5, 0.002]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.3} />
            </mesh>
            <mesh rotation={[0, 0, -Math.PI / 4]}>
                <planeGeometry args={[0.5, 0.002]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.3} />
            </mesh>
        </group>
    )
}

// ==================== [模式 B] Radar Scan ====================
function PatternRadar({ opacity }: { opacity: number }) {
    const scanRef = useRef<THREE.Mesh>(null)

    useFrame((state) => {
        if (scanRef.current) scanRef.current.rotation.z = -state.clock.elapsedTime * 1.5
    })

    return (
        <group>
            {[0.05, 0.10, 0.15, 0.20].map((r, i) => (
                <mesh key={i}>
                    <ringGeometry args={[r, r + 0.003, 64]} />
                    <meshBasicMaterial color={i % 2 === 0 ? "#00ffff" : "#0088ff"} transparent opacity={opacity * (0.5 - i * 0.1)} side={THREE.DoubleSide} />
                </mesh>
            ))}
            <mesh ref={scanRef} position={[0, 0, 0.01]}>
                <circleGeometry args={[0.20, 32, 0, Math.PI / 2]} />
                <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.15} side={THREE.DoubleSide} />
            </mesh>
        </group>
    )
}

// ==================== [模式 C] Data Sphere ====================
function PatternSphere({ opacity }: { opacity: number }) {
    const groupRef = useRef<THREE.Group>(null)
    const orbitsRef = useRef<THREE.Group>(null)

    useFrame((state) => {
        const time = state.clock.elapsedTime
        if (orbitsRef.current) {
            orbitsRef.current.rotation.x = time * 0.3
            orbitsRef.current.rotation.y = time * 0.2
        }
    })

    return (
        <group ref={groupRef}>
            <mesh>
                <sphereGeometry args={[0.12, 24, 24]} />
                <meshBasicMaterial color="#4488ff" transparent opacity={opacity * 0.1} wireframe />
            </mesh>
            <group ref={orbitsRef}>
                <mesh rotation={[Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[0.2, 0.002, 16, 100]} />
                    <meshBasicMaterial color="#0088ff" transparent opacity={opacity * 0.6} />
                </mesh>
                <mesh rotation={[-Math.PI / 3, 0, 0]}>
                    <torusGeometry args={[0.2, 0.002, 16, 100]} />
                    <meshBasicMaterial color="#00ffff" transparent opacity={opacity * 0.6} />
                </mesh>
            </group>
        </group>
    )
}

// ==================== Light Beam (Volumetric Shader) ====================
function LightBeam({ opacity = 1, height = 0.25 }: { opacity?: number, height?: number }) {
    const safeOpacity = Math.max(0, opacity)
    const meshRef = useRef<THREE.Mesh>(null)

    // 自定義 Volumetric Beam Shader
    const beamMaterial = useMemo(() => {
        return new THREE.ShaderMaterial({
            uniforms: {
                uColor: { value: new THREE.Color("#88ccff") }, // Lighter blue
                uOpacity: { value: safeOpacity },
                uTime: { value: 0 }
            },
            vertexShader: `
                varying vec2 vUv;
                varying vec3 vViewPosition;
                void main() {
                    vUv = uv;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    vViewPosition = -mvPosition.xyz;
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                uniform vec3 uColor;
                uniform float uOpacity;
                uniform float uTime;
                varying vec2 vUv;
                
                // 簡單的噪聲函數
                float random(vec2 st) {
                    return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
                }

                void main() {
                    // 1. 垂直漸變 (底部亮 -> 頂部消失)
                    float verticalFade = (1.0 - vUv.y); 
                    verticalFade = pow(verticalFade, 1.5); // 更柔和的衰減

                    // 2. 邊緣柔化 (Cylinder UV.x wraps around)
                    // 不需要，因為是全圓的

                    // 3. 模擬光束條紋 (Rays)
                    // 使用 UV.x (水平圓周) 產生條紋
                    float rays = sin(vUv.x * 40.0 + uTime * 0.5) * 0.5 + 0.5;
                    rays = pow(rays, 4.0); // 讓條紋更銳利
                    
                    // 讓條紋有些隨機感
                    float noise = random(vec2(vUv.x, floor(uTime * 5.0))) * 0.1;
                    
                    float alpha = (0.2 + rays * 0.4) * verticalFade * uOpacity;
                    
                    gl_FragColor = vec4(uColor, alpha);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            side: THREE.DoubleSide
        })
    }, [])

    useFrame((state) => {
        if (meshRef.current) {
            const mat = meshRef.current.material as THREE.ShaderMaterial;
            mat.uniforms.uOpacity.value = safeOpacity;
            mat.uniforms.uTime.value = state.clock.elapsedTime;
        }
    })

    return (
        <group>
            {/* 主光束 (Cylinder: TopRadius=0.12, BottomRadius=0.005) */}
            <mesh ref={meshRef} position={[0, height / 2, 0]}>
                {/* openEnded cylinder */}
                <cylinderGeometry args={[0.12, 0.005, height, 64, 1, true]} />
                <primitive object={beamMaterial} attach="material" />
            </mesh>

            {/* 核心過曝亮點 (底部) */}
            <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
                <sphereGeometry args={[0.008, 16, 16]} />
                <meshBasicMaterial color="#ffffff" transparent opacity={safeOpacity} blending={THREE.AdditiveBlending} />
            </mesh>

            {/* 底部光暈 (Glow on device) */}
            <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0, 0.04, 32]} />
                <meshBasicMaterial color="#0088ff" transparent opacity={safeOpacity * 0.5} side={THREE.DoubleSide} blending={THREE.AdditiveBlending} />
            </mesh>
        </group>
    )
}

// ==================== Main Export ====================
interface HolographicProjectionProps {
    visible: boolean
    opacity?: number
    vrRotation?: THREE.Euler
    vrFlipProgress?: number
    onProjectionStart?: () => void  // 投影開始時的回調
}

export default function HolographicProjection({
    visible,
    opacity = 1,
    vrRotation,
    vrFlipProgress = 1,
    onProjectionStart
}: HolographicProjectionProps) {
    const groupRef = useRef<THREE.Group>(null)
    const [currentPattern, setCurrentPattern] = useState(0) // 0=Hex, 1=Radar, 2=Sphere, 3=GlassGlobe, 4=FlatMap
    const [beamProgress, setBeamProgress] = useState(0)
    const [contentOpacity, setContentOpacity] = useState(0)
    const timerRef = useRef(0)
    const patternTimerRef = useRef(0)
    const projectionStartedRef = useRef(false)  // 追蹤是否已經通知過
    const { size } = useThree()

    // Mobile scale adjustment
    const aspectRatio = size.width / size.height
    const isPortrait = aspectRatio < 1
    const mobileScale = isPortrait ? Math.min(1, aspectRatio * 0.8) : 1

    const BEAM_IN_TIME = 0.5
    const PATTERN_DURATION = 3.5
    const FADE_TIME = 0.5

    useFrame((state, delta) => {
        if (!visible || vrFlipProgress < 0.95) {
            setBeamProgress(0)
            setContentOpacity(0)
            timerRef.current = 0
            projectionStartedRef.current = false  // 重設
            return
        }

        // 投影開始時通知父組件（只通知一次）
        if (!projectionStartedRef.current && onProjectionStart) {
            projectionStartedRef.current = true
            onProjectionStart()
        }

        timerRef.current += delta
        setBeamProgress(Math.min(timerRef.current / BEAM_IN_TIME, 1))

        if (timerRef.current > BEAM_IN_TIME) {
            patternTimerRef.current += delta
            const cycleTime = patternTimerRef.current % PATTERN_DURATION
            let fade = 1
            if (cycleTime < FADE_TIME) {
                fade = cycleTime / FADE_TIME
            } else if (cycleTime > PATTERN_DURATION - FADE_TIME) {
                fade = (PATTERN_DURATION - cycleTime) / FADE_TIME
            }
            setContentOpacity(fade)
            if (patternTimerRef.current >= PATTERN_DURATION) {
                patternTimerRef.current = 0
                setCurrentPattern((prev) => (prev + 1) % 5) // Mod 5 now
            }
        }
    })

    if (!visible) return null

    return (
        <group ref={groupRef} position={[0, -0.15, 0]}>
            <group position={[0, -0.08, 0]}>
                <LightBeam opacity={beamProgress * opacity} height={0.18} />
            </group>

            <group position={[0, 0.28, 0]} scale={[0.85, 0.85, 0.85]}>
                {/* Background removed as requested */}

                <group position={[0, 0, 0.02]}>
                    {currentPattern === 0 && <PatternHex opacity={contentOpacity * opacity} />}
                    {currentPattern === 1 && <PatternRadar opacity={contentOpacity * opacity} />}
                    {currentPattern === 2 && <PatternSphere opacity={contentOpacity * opacity} />}
                    {currentPattern === 3 && (
                        <group scale={isPortrait ? [0.4, 0.4, 0.4] : [1, 1, 1]}>
                            <PatternGlassGlobe opacity={contentOpacity * opacity} />
                        </group>
                    )}
                    {currentPattern === 4 && (
                        <group scale={isPortrait ? [0.6, 0.6, 0.6] : [1, 1, 1]}>
                            <PatternFlatMap opacity={contentOpacity * opacity} />
                        </group>
                    )}
                </group>
            </group>
        </group>
    )
}
