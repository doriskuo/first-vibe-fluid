'use client'

import { useEffect, useState } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useScrollContext } from '@/components/providers/LenisProvider'
import { totalPageHeightVh, getCurrentStageName, scrollConfig } from '@/config/scrollTimeline'
import { motion, useMotionValueEvent } from 'framer-motion'
import { Zap, Power } from 'lucide-react'

export default function CyberpunkOverlay() {
    const { springProgress } = useScrollAnimation()
    const { setLocked } = useScrollContext()
    const [isInitialized, setIsInitialized] = useState(false)
    const [bgOpacity, setBgOpacity] = useState(0)
    const [uiVisible, setUiVisible] = useState(false)

    useMotionValueEvent(springProgress, "change", (latest) => {
        const rawProgress = (latest * 1000) / totalPageHeightVh
        const currentStage = getCurrentStageName(rawProgress)

        // Show Black Background (Patterns) - IMMEDIATE
        if (['cyberpunkEntry', 'descent', 'featureMorph', 'featureProjection'].includes(currentStage)) {
            setBgOpacity(1)
        } else {
            setBgOpacity(0)
        }

        // Show Lock Screen UI - DELAYED (Wait for VR effects to finish)
        // Previous: cyberpunkEntry > 0.8 (approx 4.3) -> Too early, missed rays(4.5) and particles(4.8)
        // New: descent > 0.4 (approx 5.0) -> Allows full VR reveal
        if (currentStage === 'descent' && !isInitialized) {
            const stage = scrollConfig.stages.find(s => s.name === 'descent')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)

                // Trigger around scroll value 5.0 (descent starts at 4.4, length 1.5)
                // 4.4 + 1.5 * 0.4 = 5.0
                if (stageProgress > 0.4) {
                    setUiVisible(true)
                    setLocked(true)
                } else {
                    setUiVisible(false)
                    setLocked(false)
                }
            }
        } else {
            setUiVisible(false)
            if (!isInitialized && currentStage !== 'cyberpunkEntry') {
                setLocked(false)
            }
        }
    })

    const handleInitialize = () => {
        setIsInitialized(true)
        setLocked(false)
    }
    return (
        <>
            {/* 1. Black Background Layer -> CHANGED to Transparent Pattern Layer */}
            {/* We let FluidBackground handle the black color fade. Here we just overlay patterns. */}
            <div
                className="fixed inset-0 z-45 pointer-events-none transition-opacity duration-1000 ease-in-out mix-blend-screen"
                style={{ opacity: bgOpacity }}
            >
                {/* Global Grid Overlay */}
                <div className="absolute inset-0 opacity-10"
                    style={{
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%2300f3ff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                        backgroundSize: '80px'
                    }}
                />
                {/* Scanlines */}
                <div className="absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: 'linear-gradient(rgba(0,243,255,1) 1px, transparent 1px)', backgroundSize: '100% 3px' }}
                />
            </div>

            {/* 2. Lock Screen UI Layer */}
            <motion.div
                className="fixed inset-0 z-60 flex flex-col items-center justify-end pb-12 pointer-events-none"
                animate={{ opacity: uiVisible ? 1 : 0 }}
                transition={{ duration: 0.5 }}
            >
                {/* Header */}
                <div className="absolute top-0 left-0 w-full p-8 flex justify-between items-start">
                    <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md p-4 border-l-2 border-[#00f3ff]">
                        <Zap className="text-[#00f3ff] w-6 h-6 fill-current animate-pulse opacity-80" />
                        <div className="flex flex-col">
                            <h1 className="font-sans text-xl tracking-[0.4em] uppercase text-white font-bold">
                                CORE_SYSTEM
                            </h1>
                            <span className="text-[9px] font-mono tracking-[0.5em] text-[#00f3ff]">LOGIN_REQUIRED</span>
                        </div>
                    </div>
                </div>

                {/* Central Interaction Button - Moved to BOTTOM */}
                <div className="flex flex-col items-center gap-8">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-[#00f3ff] blur-[40px] opacity-20 group-hover:opacity-40 transition-opacity" />
                        <button
                            onClick={handleInitialize}
                            className="pointer-events-auto relative w-64 h-20 bg-black/80 border border-[#00f3ff] text-[#00f3ff] font-bold text-xl tracking-[0.2em] uppercase hover:bg-[#00f3ff] hover:text-black transition-all duration-300 flex items-center justify-center gap-4 group-hover:shadow-[0_0_30px_rgba(0,243,255,0.4)]"
                        >
                            <Power className="w-6 h-6" />
                            Initialize
                        </button>
                    </div>
                    <span className="text-xs text-white/40 font-mono tracking-widest animate-pulse">
                        AWAITING USER INPUT
                    </span>
                </div>

                {/* Decorative Footer */}
                <div className="absolute bottom-12 w-full flex justify-center opacity-30">
                    <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
                </div>

            </motion.div>
        </>
    )
}
