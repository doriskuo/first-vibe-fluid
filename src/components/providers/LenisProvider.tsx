'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import Lenis from '@studio-freight/lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useScrollStore } from '@/stores/scrollStore'

// 註冊 GSAP 插件
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

interface ScrollContextType {
    lenis: Lenis | null
}

const ScrollContext = createContext<ScrollContextType>({
    lenis: null,
})

export const useScrollContext = () => useContext(ScrollContext)

/**
 * Lenis 平滑滾動 Provider
 * 
 * 僅管理 Lenis 實例的生命週期。
 * 共享狀態（鎖定、階段、旋轉重置等）已遷移到 scrollStore。
 */
export default function LenisProvider({
    children
}: {
    children: React.ReactNode
}) {
    const [lenis, setLenisInstance] = useState<Lenis | null>(null)

    useEffect(() => {
        // 初始化 Lenis
        const lenisInstance = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            orientation: 'vertical',
            gestureOrientation: 'vertical',
            smoothWheel: true,
            wheelMultiplier: 1,
            touchMultiplier: 2,
        })

        setLenisInstance(lenisInstance)

        // 連接 Lenis 和 GSAP ScrollTrigger
        lenisInstance.on('scroll', ScrollTrigger.update)

        // 將 Lenis 加入 GSAP ticker
        gsap.ticker.add((time) => {
            lenisInstance.raf(time * 1000)
        })

        gsap.ticker.lagSmoothing(0)

        return () => {
            lenisInstance.destroy()
            setLenisInstance(null)
        }
    }, [])

    // 訂閱 scrollStore.isLocked 來控制 Lenis 的 stop/start
    useEffect(() => {
        if (!lenis) return

        const unsubscribe = useScrollStore.subscribe(
            (state) => state.isLocked,
            (isLocked) => {
                if (isLocked) {
                    lenis.stop()
                    document.body.style.overflow = 'hidden'
                } else {
                    lenis.start()
                    document.body.style.overflow = ''
                }
            },
            { fireImmediately: true }
        )

        return () => unsubscribe()
    }, [lenis])

    return (
        <ScrollContext.Provider value={{ lenis }}>
            {children}
        </ScrollContext.Provider>
    )
}
