'use client'

import { useEffect, useRef } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 註冊 GSAP 插件
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

/**
 * Lenis 平滑滾動 Provider
 * 
 * 使用方式：在 layout.tsx 或頁面最外層包裹
 */
export default function LenisProvider({
    children
}: {
    children: React.ReactNode
}) {
    const lenisRef = useRef<Lenis | null>(null)

    useEffect(() => {
        // 初始化 Lenis
        const lenis = new Lenis({
            duration: 1.2,           // 滾動動畫持續時間
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
            orientation: 'vertical', // 垂直滾動
            gestureOrientation: 'vertical',
            smoothWheel: true,       // 平滑滾輪
            wheelMultiplier: 1,      // 滾輪速度倍數
            touchMultiplier: 2,      // 觸控速度倍數
        })

        lenisRef.current = lenis

        // 連接 Lenis 和 GSAP ScrollTrigger
        lenis.on('scroll', ScrollTrigger.update)

        // 將 Lenis 加入 GSAP ticker
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000)
        })

        // 設定 GSAP ticker 的 lagSmoothing
        gsap.ticker.lagSmoothing(0)

        return () => {
            lenis.destroy()
            lenisRef.current = null
        }
    }, [])

    return <>{children}</>
}
