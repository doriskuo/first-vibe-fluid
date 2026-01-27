
'use client'

import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { motion, useTransform } from 'framer-motion'

export default function CyberpunkBorder() {
    // 取得滾動進度: teardrop (Stage 2) ~ cyberpunkEntry (Stage 10)
    // 我們希望:
    // - Stage 2 (teardrop): 淡入
    // - Stage 10 (cyberpunkEntry): 轉變或保持
    const { springProgress } = useScrollAnimation()

    // 根據 scrollTimeline.ts:
    // teardrop start: ~0.03, end: ~0.08 (假設值，需根據實際 config)
    // 我們先用寬鬆的範圍測試，後續精確對位

    const opacity = useTransform(springProgress, [0.03, 0.08], [0, 1])
    const borderColor = useTransform(
        springProgress,
        [0.08, 0.6, 0.8],
        ['rgba(255, 255, 255, 0.1)', 'rgba(0, 243, 255, 0.5)', 'rgba(255, 0, 255, 0.5)']
    )

    return (
        <motion.div
            className="fixed inset-2 z-55 pointer-events-none"
            style={{ opacity }}
        >
            {/* Main Glowing Border with Flicker */}
            <motion.div
                className="absolute inset-0 border-2 rounded-[20px] animate-pulse"
                style={{
                    borderColor,
                    boxShadow: '0 0 30px rgba(0,243,255,0.2) inset, 0 0 20px rgba(0,243,255,0.4)'
                }}
            />

            {/* 角落裝飾 - 左上 */}
            <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-cyan-400 opacity-90 rounded-tl-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            {/* 角落裝飾 - 右上 */}
            <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-cyan-400 opacity-90 rounded-tr-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            {/* 角落裝飾 - 左下 */}
            <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-cyan-400 opacity-90 rounded-bl-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />
            {/* 角落裝飾 - 右下 */}
            <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-cyan-400 opacity-90 rounded-br-xl drop-shadow-[0_0_10px_rgba(34,211,238,0.8)]" />

            {/* 掃描線裝飾 */}
            <div className="absolute top-1/2 left-0 w-1 h-48 bg-cyan-400/50 -translate-y-1/2 blur-[1px] animate-pulse" />
            <div className="absolute top-1/2 right-0 w-1 h-48 bg-cyan-400/50 -translate-y-1/2 blur-[1px] animate-pulse" />
        </motion.div>
    )
}
