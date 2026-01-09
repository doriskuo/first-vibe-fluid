'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useSpring } from 'framer-motion'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { scrollConfig } from '@/config/scrollTimeline'

// 註冊 GSAP 插件
if (typeof window !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger)
}

export interface ScrollAnimationState {
    /** 原始滾動進度 0-1 */
    scrollProgress: number
    /** 乘以 multiplier 後的值（與舊系統相容） */
    scrollValue: number
    /** 材質轉換進度 0-1 */
    materialProgress: number
    /** 當前階段名稱 */
    currentStage: string
}

interface UseScrollAnimationOptions {
    /** 是否使用 Framer Motion spring（彈跳效果） */
    useSpringPhysics?: boolean
    /** Spring 配置 */
    springConfig?: { stiffness: number; damping: number }
}

/**
 * 整合 GSAP ScrollTrigger 的滾動動畫 hook
 * 
 * 設計原則：
 * 1. 輸出與舊系統相同的值，確保視覺效果不變
 * 2. 使用配置驅動，容易新增/修改階段
 * 3. 保留 Framer Motion spring 用於彈跳效果
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
    const {
        useSpringPhysics = true,
        springConfig = { stiffness: 90, damping: 5 },
    } = options

    // State refs for performance
    const stateRef = useRef<ScrollAnimationState>({
        scrollProgress: 0,
        scrollValue: 0,
        materialProgress: 0,
        currentStage: 'liquid',
    })

    // Framer Motion spring for bounce effect (same as before)
    const springProgress = useSpring(0, springConfig)

    // GSAP ScrollTrigger setup
    useEffect(() => {
        // 計算滾動進度
        const scrollTrigger = ScrollTrigger.create({
            trigger: document.body,
            start: 'top top',
            end: 'bottom bottom',
            scrub: 0.5,  // 平滑跟隨
            onUpdate: (self) => {
                const rawProgress = self.progress

                // 乘以 multiplier（與舊系統相容）
                const scaledProgress = rawProgress * scrollConfig.scrollMultiplier

                // === 彈跳效果已停用 ===
                // 改為線性滾動，避免超調導致的閃爍問題
                springProgress.jump(scaledProgress)  // 立即跳到目標值，無彈跳

                // 更新 state ref（用於非 spring 讀取）
                stateRef.current.scrollProgress = rawProgress
                stateRef.current.scrollValue = scaledProgress

                // 計算材質進度（與舊邏輯相同）
                let materialProgress = 0
                if (scaledProgress > 1.0) {
                    materialProgress = Math.min((scaledProgress - 1.0) / 0.5, 1.0)
                }
                stateRef.current.materialProgress = materialProgress

                // 計算當前階段
                stateRef.current.currentStage = getCurrentStageName(rawProgress)
            },
        })

        return () => {
            scrollTrigger.kill()
        }
    }, [springProgress, useSpringPhysics])

    // 獲取當前狀態的函數
    const getState = useCallback((): ScrollAnimationState => {
        if (useSpringPhysics) {
            const scrollValue = springProgress.get()
            return {
                scrollProgress: scrollValue / scrollConfig.scrollMultiplier,
                scrollValue,
                materialProgress: scrollValue > 1.0
                    ? Math.min((scrollValue - 1.0) / 0.5, 1.0)
                    : 0,
                currentStage: stateRef.current.currentStage,
            }
        }
        return stateRef.current
    }, [springProgress, useSpringPhysics])

    return {
        springProgress,  // 給 useFrame 使用
        getState,
    }
}

// Helper function
function getCurrentStageName(progress: number): string {
    for (const stage of scrollConfig.stages) {
        if (progress >= stage.scroll[0] && progress <= stage.scroll[1]) {
            return stage.name
        }
    }
    return progress < 0.5 ? 'liquid' : 'rgbGlow'
}
