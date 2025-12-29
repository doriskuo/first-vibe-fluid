'use client'

import { useEffect, useRef, ReactNode } from 'react'
import Lenis from '@studio-freight/lenis'

interface SmoothScrollProps {
    children: ReactNode
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
    const lenisRef = useRef<Lenis | null>(null)

    useEffect(() => {
        // 初始化 Lenis
        const lenis = new Lenis({
            duration: 1.2,           // 滾動持續時間
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // 緩動函數
            orientation: 'vertical', // 滾動方向
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        })

        lenisRef.current = lenis

        // 動畫循環
        function raf(time: number) {
            lenis.raf(time)
            requestAnimationFrame(raf)
        }

        requestAnimationFrame(raf)

        // 清理
        return () => {
            lenis.destroy()
        }
    }, [])

    return <>{children}</>
}

// 導出 Lenis 實例供其他組件使用
export function useLenis() {
    return null // 簡化版，可透過 context 擴展
}
