'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

// 註冊 GSAP 插件
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

interface ScrollContextType {
    lenis: Lenis | null
    isLocked: boolean
    setLocked: (locked: boolean) => void
    shouldResetRotation: boolean
    resetRotation: () => void
    clearResetFlag: () => void
    // 投影狀態
    projectionStarted: boolean
    onProjectionStart: () => void
    resetProjection: () => void
}

const ScrollContext = createContext<ScrollContextType>({
    lenis: null,
    isLocked: false,
    setLocked: () => { },
    shouldResetRotation: false,
    resetRotation: () => { },
    clearResetFlag: () => { },
    projectionStarted: false,
    onProjectionStart: () => { },
    resetProjection: () => { },
})

export const useScrollContext = () => useContext(ScrollContext)

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
    const [lenis, setLenisInstance] = useState<Lenis | null>(null)
    const [isLocked, setIsLocked] = useState(false)
    const [shouldResetRotation, setShouldResetRotation] = useState(false)
    const [projectionStarted, setProjectionStarted] = useState(false)

    const resetRotation = useCallback(() => {
        setShouldResetRotation(true)
    }, [])

    const clearResetFlag = useCallback(() => {
        setShouldResetRotation(false)
    }, [])

    const onProjectionStart = useCallback(() => {
        setProjectionStarted(true)
    }, [])

    const resetProjection = useCallback(() => {
        setProjectionStarted(false)
    }, [])

    useEffect(() => {
        // 初始化 Lenis
        const lenisInstance = new Lenis({
            duration: 1.2,           // 滾動動畫持續時間
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // easeOutExpo
            orientation: 'vertical', // 垂直滾動
            gestureOrientation: 'vertical',
            smoothWheel: true,       // 平滑滾輪
            wheelMultiplier: 1,      // 滾輪速度倍數
            touchMultiplier: 2,      // 觸控速度倍數
        })

        setLenisInstance(lenisInstance)

        // 連接 Lenis 和 GSAP ScrollTrigger
        lenisInstance.on('scroll', ScrollTrigger.update)

        // 將 Lenis 加入 GSAP ticker
        gsap.ticker.add((time) => {
            lenisInstance.raf(time * 1000)
        })

        // 設定 GSAP ticker 的 lagSmoothing
        gsap.ticker.lagSmoothing(0)

        return () => {
            lenisInstance.destroy()
            setLenisInstance(null)
        }
    }, [])

    // 處理鎖定邏輯
    useEffect(() => {
        if (!lenis) return

        if (isLocked) {
            lenis.stop()
            document.body.style.overflow = 'hidden' // 防止原生滾動
        } else {
            lenis.start()
            document.body.style.overflow = ''
        }
    }, [isLocked, lenis])

    return (
        <ScrollContext.Provider value={{
            lenis,
            isLocked,
            setLocked: setIsLocked,
            shouldResetRotation,
            resetRotation,
            clearResetFlag,
            projectionStarted,
            onProjectionStart,
            resetProjection
        }}>
            {children}
        </ScrollContext.Provider>
    )
}
