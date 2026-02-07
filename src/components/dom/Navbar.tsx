'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useScrollContext } from '@/components/providers/LenisProvider'
import { useAudio } from '@/components/providers/AudioProvider'
import { computedStages } from '@/config/scrollTimeline'

// 定義要顯示在 navbar 的階段及其顯示名稱
// 根據 scrollTimeline.ts 的階段順序對應
const navLinks = [
    { stage: 'liquid', label: 'Fluid', offsetVh: 0 },           // 0-2: 液體流動
    { stage: 'shapeMorph', label: 'Transform', offsetVh: 0 },   // 24-29: 形狀變形為VR
    { stage: 'descent', label: 'Descent', offsetVh: 0 },        // 44-59: 粒子下降
    { stage: 'portal', label: 'Tunnel', offsetVh: 0 },          // 89-249: 隧道穿越
    { stage: 'featureShowcase', label: 'Features', offsetVh: 0 },// 269-319: 功能展示
    { stage: 'finalLanding', label: 'Product', offsetVh: 0 },   // 349-369: 最終產品頁
]

interface NavbarProps {
    autoExpand?: boolean  // true = finalLanding 自動展開（水平中央），false = 右側直排可收縮
}

export default function Navbar({ autoExpand = false }: NavbarProps) {
    const { lenis, setLocked } = useScrollContext()
    const { playSound } = useAudio()
    const [isExpanded, setIsExpanded] = useState(autoExpand)

    useEffect(() => {
        setIsExpanded(autoExpand)
    }, [autoExpand])

    const handleNavClick = (stageName: string, offsetVh: number = 0) => {
        playSound('click')
        playSound('whoosh')  // 導航時播放過渡音效
        scrollToStage(stageName, offsetVh)
    }

    const scrollToStage = (stageName: string, offsetVh: number = 0) => {
        const stage = computedStages.find(s => s.name === stageName)
        if (!stage || !lenis) return

        // 確保滾輪解鎖（防止在投影鎖定時無法導航）
        setLocked(false)

        const targetScrollPx = ((stage.startVh + offsetVh) / 100) * window.innerHeight

        if (!autoExpand) {
            setIsExpanded(false)
        }

        lenis.scrollTo(targetScrollPx, {
            duration: 2,
            easing: (t: number) => 1 - Math.pow(1 - t, 3),
        })
    }

    const glassStyle = {
        background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 50%, rgba(0,243,255,0.05) 100%)',
        backdropFilter: 'blur(10px) saturate(1.5)',
        WebkitBackdropFilter: 'blur(10px) saturate(1.5)',
        border: '1px solid rgba(255,255,255,0.15)',
        boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.1), 0 8px 32px rgba(0,243,255,0.1)'
    }

    // ===== finalLanding 模式：水平居中展開 =====
    if (autoExpand) {
        return (
            <nav className="fixed top-0 left-0 right-0 z-[200] flex justify-center pt-8 pb-4 pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex gap-1 px-2 py-2 rounded-full pointer-events-auto"
                    style={glassStyle}
                >
                    {navLinks.map((link, index) => (
                        <button
                            key={link.stage}
                            onClick={() => handleNavClick(link.stage, link.offsetVh)}
                            onMouseEnter={() => playSound('hover')}
                            className="relative px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-300 rounded-full group"
                            style={{ color: 'rgba(255,255,255,0.6)' }}
                        >
                            <span
                                className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                style={{
                                    background: 'linear-gradient(135deg, rgba(255,0,255,0.2) 0%, rgba(139,92,246,0.2) 50%, rgba(0,243,255,0.2) 100%)',
                                }}
                            />
                            <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                                {link.label}
                            </span>
                            {index < navLinks.length - 1 && (
                                <span
                                    className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full"
                                    style={{
                                        background: 'linear-gradient(135deg, #ff00ff, #00f3ff)',
                                        opacity: 0.4,
                                    }}
                                />
                            )}
                        </button>
                    ))}
                </motion.div>
            </nav>
        )
    }

    // ===== 非 finalLanding 模式：右側直排 =====
    return (
        <nav className="fixed top-1/2 -translate-y-1/2 right-4 z-[200] pointer-events-none">
            <AnimatePresence mode="wait">
                {isExpanded ? (
                    // 展開狀態：直排導航
                    <motion.div
                        key="expanded-vertical"
                        initial={{ opacity: 0, x: 20, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: 20, scale: 0.9 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        className="flex flex-col gap-1 px-2 py-3 rounded-2xl pointer-events-auto"
                        style={glassStyle}
                    >
                        {/* 收起按鈕 */}
                        <button
                            onClick={() => { playSound('click'); setIsExpanded(false) }}
                            onMouseEnter={() => playSound('hover')}
                            className="px-3 py-2 text-white/40 hover:text-white transition-colors duration-300 self-end"
                            title="收起"
                        >
                            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                                <path d="M2 2L8 8M8 2L2 8" />
                            </svg>
                        </button>

                        {navLinks.map((link) => (
                            <button
                                key={link.stage}
                                onClick={() => handleNavClick(link.stage, link.offsetVh)}
                                onMouseEnter={() => playSound('hover')}
                                className="relative px-4 py-2 text-xs font-mono tracking-wider uppercase transition-all duration-300 rounded-lg group text-right"
                                style={{ color: 'rgba(255,255,255,0.6)' }}
                            >
                                <span
                                    className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                                    style={{
                                        background: 'linear-gradient(135deg, rgba(255,0,255,0.2) 0%, rgba(139,92,246,0.2) 50%, rgba(0,243,255,0.2) 100%)',
                                    }}
                                />
                                <span className="relative z-10 group-hover:text-white transition-colors duration-300">
                                    {link.label}
                                </span>
                            </button>
                        ))}
                    </motion.div>
                ) : (
                    // 收起狀態：小箭頭
                    <motion.button
                        key="collapsed-arrow"
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, ease: 'easeOut' }}
                        onClick={() => { playSound('click'); setIsExpanded(true) }}
                        onMouseEnter={() => playSound('hover')}
                        className="pointer-events-auto w-10 h-10 rounded-full flex items-center justify-center group"
                        style={glassStyle}
                        title="展開導航"
                    >
                        <motion.span
                            className="text-white/50 group-hover:text-white transition-colors duration-300 text-lg font-light"
                            animate={{ x: [0, 2, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                        >
                            ‹
                        </motion.span>
                    </motion.button>
                )}
            </AnimatePresence>
        </nav>
    )
}
