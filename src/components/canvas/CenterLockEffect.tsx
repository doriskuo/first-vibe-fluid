'use client'

import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useVRStore } from '@/stores/vrStore'

/**
 * CenterLockEffect - 歸位特效
 * 
 * 視覺效果：
 * 1. 水平光線快速掃過
 * 2. 科技方框線條浮出並消失
 * 3. 角落閃光點
 */
export default function CenterLockEffect() {
    const visible = useVRStore(s => s.lockEffectVisible)
    const progress = useVRStore(s => s.lockEffectProgress)
    const groupRef = useRef<THREE.Group>(null)
    const scanLineRef = useRef<THREE.Mesh>(null)
    const frameRefs = useRef<THREE.LineSegments[]>([])

    // Create frame geometry (tech corners and edges)
    const { frameGeometry, cornerGeometry } = useMemo(() => {
        // Frame - 四邊科技邊框線條
        const framePoints: number[] = []
        const size = 0.5
        const gap = 0.15  // Corner gap

        // Top edge (with gap in middle)
        framePoints.push(-size, size, 0, -gap, size, 0)
        framePoints.push(gap, size, 0, size, size, 0)
        // Bottom edge
        framePoints.push(-size, -size, 0, -gap, -size, 0)
        framePoints.push(gap, -size, 0, size, -size, 0)
        // Left edge
        framePoints.push(-size, -size, 0, -size, -gap, 0)
        framePoints.push(-size, gap, 0, -size, size, 0)
        // Right edge
        framePoints.push(size, -size, 0, size, -gap, 0)
        framePoints.push(size, gap, 0, size, size, 0)

        const frameGeo = new THREE.BufferGeometry()
        frameGeo.setAttribute('position', new THREE.Float32BufferAttribute(framePoints, 3))

        // Corners - 四角落閃光方塊
        const cornerPoints: number[] = []
        const cornerSize = 0.08
        const corners = [
            [-size, size], [size, size], [-size, -size], [size, -size]
        ]
        corners.forEach(([cx, cy]) => {
            // Small square at each corner
            cornerPoints.push(cx - cornerSize, cy, 0, cx + cornerSize, cy, 0)
            cornerPoints.push(cx, cy - cornerSize, 0, cx, cy + cornerSize, 0)
        })

        const cornerGeo = new THREE.BufferGeometry()
        cornerGeo.setAttribute('position', new THREE.Float32BufferAttribute(cornerPoints, 3))

        return { frameGeometry: frameGeo, cornerGeometry: cornerGeo }
    }, [])

    useFrame(() => {
        if (!groupRef.current || !visible) return

        // Scan line animation - quick sweep from left to right
        if (scanLineRef.current) {
            // Sweep happens in the first 60% of progress
            const sweepProgress = Math.min(progress / 0.6, 1)
            const xPos = THREE.MathUtils.lerp(-0.8, 0.8, sweepProgress)
            scanLineRef.current.position.x = xPos

            // Fade out scan line after sweep
            const scanOpacity = progress < 0.6 ? 1 : 1 - ((progress - 0.6) / 0.4)
            const scanMat = scanLineRef.current.material as THREE.MeshBasicMaterial
            scanMat.opacity = scanOpacity * 0.9
        }

        // Frame lines animation - appear, then fade
        frameRefs.current.forEach((line, i) => {
            if (!line) return
            const mat = line.material as THREE.LineBasicMaterial

            // Staggered appearance
            const delay = i * 0.1
            const localProgress = Math.max(0, (progress - delay) / (1 - delay))

            // Fade in quickly, then fade out
            let opacity = 0
            if (localProgress < 0.3) {
                opacity = localProgress / 0.3
            } else if (localProgress < 0.7) {
                opacity = 1
            } else {
                opacity = 1 - ((localProgress - 0.7) / 0.3)
            }

            mat.opacity = opacity * 0.8
        })
    })

    if (!visible) return null

    return (
        <group ref={groupRef} scale={[0.3, 0.3, 0.3]}>
            {/* Horizontal Scan Line - 水平掃描光線 */}
            <mesh ref={scanLineRef} position={[-0.8, 0, 0.1]}>
                <planeGeometry args={[0.02, 1.2]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0.9}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Scan Line Glow */}
            <mesh position={[scanLineRef.current?.position.x || -0.8, 0, 0.09]}>
                <planeGeometry args={[0.08, 1.2]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0.3}
                    side={THREE.DoubleSide}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Tech Frame Lines - 科技邊框 */}
            <lineSegments
                ref={(el) => { if (el) frameRefs.current[0] = el }}
                geometry={frameGeometry}
            >
                <lineBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={0}
                    linewidth={2}
                />
            </lineSegments>

            {/* Corner Accents - 角落強調 */}
            <lineSegments
                ref={(el) => { if (el) frameRefs.current[1] = el }}
                geometry={cornerGeometry}
            >
                <lineBasicMaterial
                    color="#ffffff"
                    transparent
                    opacity={0}
                    linewidth={2}
                />
            </lineSegments>

            {/* Center Flash - 中心閃光點 */}
            <mesh position={[0, 0, 0.05]}>
                <circleGeometry args={[0.03, 16]} />
                <meshBasicMaterial
                    color="#00ffff"
                    transparent
                    opacity={progress > 0.4 && progress < 0.8 ? (1 - Math.abs(progress - 0.6) / 0.2) * 0.8 : 0}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>

            {/* Outer Ring Flash */}
            <mesh position={[0, 0, 0.04]} rotation={[0, 0, progress * Math.PI * 2]}>
                <ringGeometry args={[0.45, 0.48, 32]} />
                <meshBasicMaterial
                    color="#00aaff"
                    transparent
                    opacity={progress > 0.5 ? (1 - ((progress - 0.5) / 0.5)) * 0.5 : 0}
                    blending={THREE.AdditiveBlending}
                />
            </mesh>
        </group>
    )
}
