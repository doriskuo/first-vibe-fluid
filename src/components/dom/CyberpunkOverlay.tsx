'use client'

import { useEffect, useState } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useScrollContext } from '@/components/providers/LenisProvider'
import { totalPageHeightVh, getCurrentStageName, scrollConfig } from '@/config/scrollTimeline'
import { motion, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { Zap, Power } from 'lucide-react'
import CyberpunkGridCanvas from './CyberpunkGridCanvas'
import FeatureCallout from './FeatureCallout'
import FinalLanding from './FinalLanding'
import { getCalloutVisibility, type FeaturePoint } from '@/config/featureConfig'

export default function CyberpunkOverlay() {
    const { springProgress } = useScrollAnimation()
    const { setLocked, resetRotation } = useScrollContext()
    const [isInitialized, setIsInitialized] = useState(false)
    const [bgOpacity, setBgOpacity] = useState(0)
    const [uiVisible, setUiVisible] = useState(false)
    const [activeFeature, setActiveFeature] = useState<FeaturePoint | null>(null)
    const [calloutVisible, setCalloutVisible] = useState(false)
    const [calloutPhase, setCalloutPhase] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>('hidden')
    const [vibeTextVisible, setVibeTextVisible] = useState(false)
    const [vibeText, setVibeText] = useState('')
    // Intro narrative layers (liquid phase)
    const [showIntroBrand, setShowIntroBrand] = useState(true)
    const [showIntroPhilosophy, setShowIntroPhilosophy] = useState(false)
    const [showIntroPrompt, setShowIntroPrompt] = useState(true)
    // Final landing page (two phases)
    const [showFinalPrompt, setShowFinalPrompt] = useState(false)  // Phase 1: Prompt during projection
    const [showFinalCard, setShowFinalCard] = useState(false)      // Phase 2: Card after scroll
    // Rotating slogans carousel
    const [sloganIndex, setSloganIndex] = useState(0)
    const slogans = [
        'Flow with Possibility',
        'Consciousness in Motion',
        'Fluidity is Freedom',
        'Where Thoughts Take Shape',
        'Let It Flow'
    ]

    // Rotate slogans every 2.5s while brand is visible
    useEffect(() => {
        if (!showIntroBrand) return
        const interval = setInterval(() => {
            setSloganIndex(prev => (prev + 1) % slogans.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [showIntroBrand, slogans.length])

    useMotionValueEvent(springProgress, "change", (latest) => {
        const rawProgress = (latest * 1000) / totalPageHeightVh
        const currentStage = getCurrentStageName(rawProgress)

        // Show Black Background (Patterns) - IMMEDIATE
        if (['cyberpunkEntry', 'descent', 'theaterSpace', 'audioSim', 'visualSim', 'returnToCenter', 'centerLock', 'featureShowcase'].includes(currentStage)) {
            // Default 100% opacity
            let targetOpacity = 1;

            // FADEOUT LOGIC: At 6.2 (Theater Space start + delay), fade out the grid/particles
            // Matches SphericalBackground entry at 6.2
            if (latest > 6.2) {
                // Fade out over 0.8 units (same as sphere fade in)
                const fadeProgress = Math.min((latest - 6.2) / 0.8, 1);
                targetOpacity = 1 - fadeProgress;
            }

            setBgOpacity(targetOpacity);
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

        // ===== FEATURE SHOWCASE: Update active feature callout =====
        if (currentStage === 'featureShowcase') {
            // Get the stage bounds from scrollConfig
            const stage = scrollConfig.stages.find(s => s.name === 'featureShowcase')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)
                const morphProgress = Math.max(0, Math.min(1, stageProgress))

                // 使用新的 visibility 函數來控制說明框顯示
                const visibility = getCalloutVisibility(morphProgress)

                console.log('FeatureMorph:', {
                    morphProgress,
                    feature: visibility.feature?.id,
                    phase: visibility.phase,
                    visible: visibility.visible
                })

                setActiveFeature(visibility.feature)
                setCalloutVisible(visibility.visible)
                setCalloutPhase(visibility.phase)
            }
        } else {
            setActiveFeature(null)
            setCalloutVisible(false)
            setCalloutPhase('hidden')
        }

        // ===== VIBE TEXT: Show slogans with scroll-based timing =====
        // Delayed entry - all slogans appear later as requested

        // "Enjoy the Vibe" - audio waveforms phase
        if (latest >= 6.5 && latest < 7.8) {
            setVibeTextVisible(true)
            setVibeText('Enjoy the Vibe')
        }
        // "Explore the Universe" - sphere phase
        else if (latest >= 8.2 && latest < 8.9) {
            setVibeTextVisible(true)
            setVibeText('Explore the Universe')
        }
        // "Immerse Yourself" - tunnel phase
        else if (latest >= 9.2 && currentStage === 'portal') {
            setVibeTextVisible(true)
            setVibeText('Immerse Yourself')
        }
        else {
            setVibeTextVisible(false)
        }

        // ===== INTRO NARRATIVE: Layered text during liquid phase =====
        // Layer 1: Brand (visible at start, fades out early)
        setShowIntroBrand(latest < 0.6)

        // Layer 2: Philosophy (fades in after brand fades, holds, then fades out)
        setShowIntroPhilosophy(latest >= 0.8 && latest < 1.8)

        // Layer 3: Scroll prompt (visible at start, fades out as user scrolls)
        setShowIntroPrompt(latest < 0.8)

        // ===== FINAL LANDING: Two phases =====
        // Phase 1: Show prompt during late holographicProjection (after carousel cycles)
        // holographicProjection is ~32-35 scrollValue, show prompt near end
        setShowFinalPrompt(currentStage === 'holographicProjection' && latest >= 34.0)

        // Phase 2: Show card when user enters finalLanding stage
        setShowFinalCard(currentStage === 'finalLanding')
    })

    const handleInitialize = () => {
        setIsInitialized(true)
        resetRotation() // Reset VR rotation before unlocking
        setLocked(false)
    }
    return (
        <>
            {/* 0. Intro Narrative Layer - Liquid Phase (consciousness flowing) */}
            <div className="fixed inset-0 z-[100] flex items-center justify-start pl-12 md:pl-24 pointer-events-none">
                <AnimatePresence mode="wait">
                    {/* Layer 1: Brand Name */}
                    {showIntroBrand && (
                        <motion.div
                            key="intro-brand"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute flex flex-col items-center gap-2"
                        >
                            <span className="text-gray-500/80 text-4xl md:text-6xl font-light tracking-[0.5em] uppercase">
                                FLUID
                            </span>
                            {/* Rotating slogan */}
                            <AnimatePresence mode="wait">
                                <motion.span
                                    key={sloganIndex}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.5 }}
                                    className="text-gray-500/50 text-xs md:text-sm font-light tracking-[0.3em] uppercase italic"
                                >
                                    {slogans[sloganIndex]}
                                </motion.span>
                            </AnimatePresence>
                        </motion.div>
                    )}

                    {/* Layer 2: Philosophy */}
                    {showIntroPhilosophy && (
                        <motion.div
                            key="intro-philosophy"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute text-center"
                        >
                            <span className="text-gray-700/60 text-lg md:text-2xl font-light tracking-[0.4em] uppercase italic">
                                Where Thoughts Take Shape
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Layer 3: Scroll Prompt (separate from AnimatePresence for overlay) */}
                <AnimatePresence>
                    {showIntroPrompt && (
                        <motion.div
                            key="intro-prompt"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute bottom-16 flex flex-col items-center gap-4"
                        >
                            {/* Mouse interaction hint */}
                            <span className="text-gray-500/60 text-xs tracking-[0.2em] uppercase">
                                Move to Flow
                            </span>
                            {/* Scroll hint */}
                            <span className="text-gray-600/50 text-xs tracking-[0.3em] uppercase animate-pulse">
                                Scroll to Feel
                            </span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                className="w-[1px] h-8 bg-gradient-to-b from-gray-500/40 to-transparent"
                            />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

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

                {/* 2. Dynamic Light Overlay (Canvas) */}
                <CyberpunkGridCanvas />

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

                {/* Drag Hint UI - Bottom Center (Same position as SCROLL DOWN hint) */}
                {!isInitialized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 20 }}
                        transition={{ duration: 0.5 }}
                        className="absolute bottom-20 w-full flex flex-col items-center gap-2 pointer-events-none z-50"
                    >
                        <span className="text-[#00f3ff] font-bold text-xs tracking-[0.3em] uppercase animate-pulse">
                            DRAG TO ROTATE
                        </span>
                        {/* Animated hand icon */}
                        <motion.div
                            animate={{ x: [0, 12, 0, -12, 0] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            className="text-[#00f3ff] opacity-60"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
                                <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
                                <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
                                <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
                            </svg>
                        </motion.div>
                    </motion.div>
                )}

                {/* Central Interaction Button - Moved to BOTTOM RIGHT */}
                {!isInitialized && (
                    <div className="absolute bottom-8 right-6 md:bottom-10 md:right-16 flex flex-col items-center gap-4 z-50">
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-[#00f3ff] rounded-full blur-[20px] opacity-20 group-hover:opacity-60 transition-opacity duration-500 will-change-transform" />

                            {/* Power Button */}
                            <button
                                onClick={handleInitialize}
                                className="pointer-events-auto relative w-14 h-14 md:w-16 md:h-16 rounded-full bg-black/90 border-2 border-[#00f3ff] text-[#00f3ff] 
                                         hover:bg-[#00f3ff] hover:text-black transition-all duration-300 ease-out 
                                         flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(0,243,255,0.4)]"
                            >
                                <Power className="w-6 h-6 md:w-7 md:h-7 stroke-[2px]" />
                            </button>

                            {/* Orbit Ring Animation */}
                            <div className="absolute inset-[-6px] border border-[#00f3ff]/30 rounded-full w-[calc(100%+12px)] h-[calc(100%+12px)] animate-spin-slow pointer-events-none"
                                style={{ borderTopColor: 'transparent', borderLeftColor: 'transparent' }} />
                        </div>

                        {/* Text Below */}
                        <div className="flex flex-col items-center gap-1">
                            <span className="text-[#00f3ff] font-bold text-xs tracking-[0.2em] uppercase drop-shadow-[0_0_5px_rgba(0,243,255,0.8)]">
                                INITIALIZE
                            </span>
                            <span className="text-[9px] text-white/50 font-mono tracking-widest animate-pulse scale-90">
                                SYSTEM_READY
                            </span>
                        </div>
                    </div>
                )}

                {/* Scroll Hint - Appears AFTER Initialize */}
                {isInitialized && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5, duration: 0.8 }}
                        className="absolute bottom-12 w-full flex flex-col items-center gap-2 pointer-events-none z-50"
                    >
                        <span className="text-[#00f3ff] font-bold text-xs tracking-[0.3em] uppercase animate-pulse">
                            SCROLL DOWN
                        </span>
                        <div className="w-[1px] h-12 bg-gradient-to-b from-[#00f3ff] to-transparent relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-[50%] bg-white blur-[1px] animate-drop-down" />
                        </div>
                    </motion.div>
                )}

                {/* Decorative Footer */}
                <div className="absolute bottom-12 w-full flex justify-center opacity-30">
                    <div className="w-1/2 h-[1px] bg-gradient-to-r from-transparent via-[#00f3ff] to-transparent" />
                </div>

            </motion.div>

            {/* 3. Vibe Text Layer - Shown during audioSim/visualSim */}
            <AnimatePresence>
                {vibeTextVisible && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="fixed bottom-16 w-full flex justify-center pointer-events-none z-50"
                    >
                        <span className="text-white/60 text-sm md:text-base font-light tracking-[0.4em] uppercase italic">
                            {vibeText}
                        </span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* 4. Feature Callout Layer - Only shown during featureMorph */}
            {/* AnimatePresence 需要在父層，用 key 來觸發進退場動畫 */}
            <AnimatePresence mode="wait">
                {activeFeature && calloutVisible && calloutPhase !== 'hidden' && (
                    <FeatureCallout
                        key={activeFeature.id}  // 重要：唯一 key 讓 AnimatePresence 偵測切換
                        title={activeFeature.callout.title}
                        value={activeFeature.callout.value}
                        description={activeFeature.callout.description}
                        position={activeFeature.callout.position}
                        targetPoint={activeFeature.targetPoint}
                        visible={true}
                    />
                )}
            </AnimatePresence>

            {/* Final Landing Page */}
            <FinalLanding showPrompt={showFinalPrompt} showCard={showFinalCard} />
        </>
    )
}
