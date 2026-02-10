'use client'

import { useEffect, useRef } from 'react'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useScrollStore } from '@/stores/scrollStore'
import { useUIStore } from '@/stores/uiStore'
import { useAudio } from '@/components/providers/AudioProvider'
import { totalPageHeightVh, getCurrentStageName, scrollConfig } from '@/config/scrollTimeline'
import { motion, useMotionValueEvent, AnimatePresence } from 'framer-motion'
import { Zap, Power } from 'lucide-react'
import CyberpunkGridCanvas from './CyberpunkGridCanvas'
import FeatureCallout from './FeatureCallout'
import FinalLanding from './FinalLanding'
import Navbar from './Navbar'
import { getCalloutVisibility, featurePoints, type FeaturePoint } from '@/config/featureConfig'

const slogans = [
    'Flow with Possibility',
    'Consciousness in Motion',
    'Fluidity is Freedom',
    'Where Thoughts Take Shape',
    'Let It Flow'
]

export default function CyberpunkOverlay() {
    const { springProgress } = useScrollAnimation()
    // scrollStore selectors
    const setLocked = useScrollStore(s => s.setLocked)
    const resetRotation = useScrollStore(s => s.resetRotation)
    const projectionStarted = useScrollStore(s => s.projectionStarted)
    const resetProjection = useScrollStore(s => s.resetProjection)
    const setCurrentStage = useScrollStore(s => s.setCurrentStage)
    // uiStore selectors — 僅 JSX 需要讀取的狀態
    const isInitialized = useUIStore(s => s.isInitialized)
    const bgOpacity = useUIStore(s => s.bgOpacity)
    const uiVisible = useUIStore(s => s.uiVisible)
    const activeFeature = useUIStore(s => s.activeFeature)
    const calloutVisible = useUIStore(s => s.calloutVisible)
    const calloutPhase = useUIStore(s => s.calloutPhase)
    const vibeTextVisible = useUIStore(s => s.vibeTextVisible)
    const vibeText = useUIStore(s => s.vibeText)
    const showIntroBrand = useUIStore(s => s.showIntroBrand)
    const showIntroPhilosophy = useUIStore(s => s.showIntroPhilosophy)
    const introPhase = useUIStore(s => s.introPhase)
    const showFinalPrompt = useUIStore(s => s.showFinalPrompt)
    const showFinalCard = useUIStore(s => s.showFinalCard)
    const projectionComplete = useUIStore(s => s.projectionComplete)
    const isInLiquidPhase = useUIStore(s => s.isInLiquidPhase)
    const sloganIndex = useUIStore(s => s.sloganIndex)
    // uiStore actions — useMotionValueEvent 中用 getState() 調用
    const ui = useUIStore

    const { playSound, playAudioVisBgm, stopAudioVisBgm } = useAudio()
    // Refs — 不需進 store 的純計時/追蹤值
    const fluidSwishCooldownRef = useRef(false)
    const audioVisBgmPlayingRef = useRef(false)

    // Handle mouse move on liquid phase - play swish sound (using window event listener)
    useEffect(() => {
        const handleMouseMove = () => {
            if (!isInLiquidPhase || fluidSwishCooldownRef.current) return

            fluidSwishCooldownRef.current = true

            // 延遲 300ms 後播放音效，讓液態視覺先反應
            setTimeout(() => {
                playSound('fluidSwish')
            }, 300)

            // 冷卻時間 1800ms，讓音效更加緩和
            setTimeout(() => {
                fluidSwishCooldownRef.current = false
            }, 1800)
        }

        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [playSound, isInLiquidPhase])

    // Three-step intro phase transitions (global listeners)
    useEffect(() => {
        const handleClick = () => {
            if (ui.getState().introPhase === 'tap') ui.getState().setIntroPhase('move')
        }
        const handleMouseMove = () => {
            if (ui.getState().introPhase === 'move') ui.getState().setIntroPhase('scroll')
        }

        window.addEventListener('click', handleClick)
        window.addEventListener('mousemove', handleMouseMove)
        return () => {
            window.removeEventListener('click', handleClick)
            window.removeEventListener('mousemove', handleMouseMove)
        }
    }, [])

    // Rotate slogans every 2.5s while brand is visible
    useEffect(() => {
        if (!showIntroBrand) return
        const interval = setInterval(() => {
            ui.getState().nextSlogan(slogans.length)
        }, 2500)
        return () => clearInterval(interval)
    }, [showIntroBrand])

    // 投影鎖定：當投影真正開始時（從 HolographicProjection 觸發）鎖住滾輪，20秒後解鎖顯示提示
    useEffect(() => {
        if (projectionStarted && !projectionComplete) {
            // 播放全息投影音效
            playSound('hologram')

            // 鎖住滾輪
            setLocked(true)

            // 20秒後解鎖並顯示提示
            const timer = setTimeout(() => {
                ui.getState().setProjectionComplete(true)
                ui.getState().setShowFinalPrompt(true)
                setLocked(false)
            }, 20000)  // 20秒投影時間

            return () => clearTimeout(timer)
        }
    }, [projectionStarted, projectionComplete, setLocked, playSound])

    useMotionValueEvent(springProgress, "change", (latest) => {
        const rawProgress = (latest * 1000) / totalPageHeightVh
        const currentStage = getCurrentStageName(rawProgress)
        const s = ui.getState()

        // Update current stage in context (triggers rotation reset if needed)
        setCurrentStage(currentStage)

        // 更新液態階段狀態（用於滑鼠互動音效）
        s.setIsInLiquidPhase(['liquid', 'teardrop', 'bounce', 'glass', 'rgbGlow'].includes(currentStage))

        // ===== AUDIO VISUALIZER BGM: 三層音頻區背景音樂 =====
        // 檢查是否應該開始播放（在 theaterSpace 50% 進度後）
        let shouldPlay = false
        if (currentStage === 'theaterSpace') {
            const stage = scrollConfig.stages.find(st => st.name === 'theaterSpace')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)
                shouldPlay = stageProgress > 0.5  // 50% 進度後才開始
            }
        } else if (['audioSim', 'visualSim'].includes(currentStage)) {
            shouldPlay = true  // audioSim/visualSim 直接播放
        }

        // 檢查是否應該提前淡出（在 visualSim 80% 進度時）
        let shouldFadeOut = false
        if (currentStage === 'visualSim') {
            const stage = scrollConfig.stages.find(st => st.name === 'visualSim')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)
                shouldFadeOut = stageProgress > 0.3  // 30% 就開始淡出
            }
        }

        if (shouldPlay && !shouldFadeOut && !audioVisBgmPlayingRef.current) {
            playAudioVisBgm()
            audioVisBgmPlayingRef.current = true
        } else if ((!shouldPlay || shouldFadeOut) && audioVisBgmPlayingRef.current) {
            stopAudioVisBgm()
            audioVisBgmPlayingRef.current = false
        }


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

            s.setBgOpacity(targetOpacity);
        } else {
            s.setBgOpacity(0)
        }

        // Show Lock Screen UI - DELAYED (Wait for VR effects to finish)
        // Only trigger lock if user is actually IN descent stage (not jumping past it)
        // Check: currentStage is descent AND not yet initialized AND not in later stages
        if (currentStage === 'descent' && !s.isInitialized) {
            const stage = scrollConfig.stages.find(st => st.name === 'descent')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)

                // Trigger around scroll value 5.0 (descent starts at 4.4, length 1.5)
                // Only lock if we are within descent range (not jumping past)
                if (stageProgress > 0.4 && stageProgress < 1.0) {
                    s.setUiVisible(true)
                    setLocked(true)
                } else {
                    s.setUiVisible(false)
                    // Don't unlock here - let navbar or INITIALIZE handle it
                }
            }
        } else {
            s.setUiVisible(false)
            // Only unlock if we've moved past descent naturally and haven't initialized
            if (!s.isInitialized && currentStage !== 'cyberpunkEntry' && currentStage !== 'descent') {
                setLocked(false)
            }
        }

        // ===== PORTAL EXIT: 穿出隧道變星際時播放音效 =====
        // 在 portal 階段的尾端觸發（約 95% 進度）
        if (currentStage === 'portal') {
            const stage = scrollConfig.stages.find(st => st.name === 'portal')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)
                // 當 portal 進度超過 98% 時觸發
                if (stageProgress > 0.98 && !s.portalExitSoundPlayed) {
                    playSound('portalExit')
                    s.setPortalExitSoundPlayed(true)
                }
            }
        }

        // ===== FEATURE SHOWCASE: Update active feature callout =====
        if (currentStage === 'featureShowcase') {

            // Get the stage bounds from scrollConfig
            const stage = scrollConfig.stages.find(st => st.name === 'featureShowcase')
            if (stage && stage.scroll) {
                const [start, end] = stage.scroll
                const stageProgress = (rawProgress - start) / (end - start)
                const morphProgress = Math.max(0, Math.min(1, stageProgress))

                // 使用新的 visibility 函數來控制說明框顯示
                const visibility = getCalloutVisibility(morphProgress)


                s.setActiveFeature(visibility.feature)
                s.setCalloutVisible(visibility.visible)
                s.setCalloutPhase(visibility.phase)
            }
        } else {
            s.setActiveFeature(null)
            s.setCalloutVisible(false)
            s.setCalloutPhase('hidden')
        }

        // ===== VIBE TEXT: Show slogans with scroll-based timing =====
        // Delayed entry - all slogans appear later as requested

        // "Enjoy the Vibe" - audio waveforms phase
        if (latest >= 6.5 && latest < 7.8) {
            s.setVibeTextVisible(true)
            s.setVibeText('Enjoy the Vibe')
        }
        // "Explore the Universe" - sphere phase
        else if (latest >= 8.2 && latest < 8.9) {
            s.setVibeTextVisible(true)
            s.setVibeText('Explore the Universe')
        }
        // "Immerse Yourself" - tunnel phase
        else if (latest >= 9.2 && currentStage === 'portal') {
            s.setVibeTextVisible(true)
            s.setVibeText('Immerse Yourself')
            // 進入隧道時播放 portal 音效（只播放一次）
            if (!s.portalSoundPlayed) {
                playSound('portal')
                s.setPortalSoundPlayed(true)
            }
        }
        else {
            s.setVibeTextVisible(false)
            // 離開 portal 階段時重設，讓下次進入可以再播放
            if (currentStage !== 'portal') {
                s.setPortalSoundPlayed(false)
            }
            // 離開 portal 階段時重設 portalExit 音效
            if (currentStage !== 'portal') {
                s.setPortalExitSoundPlayed(false)
            }
        }

        // ===== INTRO NARRATIVE: Layered text during liquid phase =====
        // Layer 1: Brand (visible at start, fades out early)
        s.setShowIntroBrand(latest < 0.6)

        // Layer 2: Philosophy (fades in after brand fades, holds, then fades out)
        s.setShowIntroPhilosophy(latest >= 0.8 && latest < 1.8)

        // Layer 3: Intro prompts - hide when user scrolls past liquid phase
        if (latest >= 0.8 && s.introPhase !== 'done') {
            s.setIntroPhase('done')
        }

        // ===== FINAL LANDING: Reset projection state when leaving =====
        // 離開 holographicProjection 時重設狀態（為下次使用 navbar 跳轉做準備）
        if (currentStage !== 'holographicProjection' && currentStage !== 'finalLanding') {
            resetProjection()
            s.setProjectionComplete(false)
            s.setShowFinalPrompt(false)
        }

        // Phase 2: Show card when user enters finalLanding stage
        // 同時隱藏滾動提示
        if (currentStage === 'finalLanding') {
            s.setShowFinalPrompt(false)  // 繼續滾動後隱藏提示
            s.setShowFinalCard(true)
        } else {
            s.setShowFinalCard(false)
        }
    })

    const handleInitialize = () => {
        playSound('initialize')  // Play system boot sound
        ui.getState().setInitialized(true)
        resetRotation() // Reset VR rotation before unlocking
        setLocked(false)
    }
    return (
        <>

            {/* Collapsible Navbar - visible in all stages except finalLanding (FinalLanding has its own) */}
            {!showFinalCard && (
                <Navbar autoExpand={false} />
            )}

            {/* 0. Intro Narrative Layer - Liquid Phase (consciousness flowing) */}
            <div className="fixed inset-0 z-[100] flex items-center justify-start pl-6 sm:pl-12 md:pl-24 pointer-events-none">
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
                            <span className="text-gray-500/80 text-2xl sm:text-4xl md:text-6xl font-light tracking-[0.3em] sm:tracking-[0.5em] uppercase">
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
                                    className="text-gray-500/50 text-[10px] sm:text-xs md:text-sm font-light tracking-[0.2em] sm:tracking-[0.3em] uppercase italic"
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
                            <span className="text-gray-700/60 text-sm sm:text-lg md:text-2xl font-light tracking-[0.2em] sm:tracking-[0.4em] uppercase italic">
                                Where Thoughts Take Shape
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Layer 3: Three-Step Intro Prompts */}
                <AnimatePresence mode="wait">
                    {introPhase !== 'done' && (
                        <motion.div
                            key={introPhase}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.5 }}
                            className="absolute bottom-12 sm:bottom-16 lg:bottom-12 lg:right-12 flex flex-col items-center lg:items-end gap-3 sm:gap-4 cursor-pointer"
                            onClick={() => {
                                if (introPhase === 'tap') ui.getState().setIntroPhase('move')
                            }}
                            onMouseMove={() => {
                                if (introPhase === 'move') ui.getState().setIntroPhase('scroll')
                            }}
                        >
                            {introPhase === 'tap' && (
                                <span className="text-gray-400/60 text-xs tracking-[0.25em] uppercase animate-pulse mb-10">
                                    Tap to Begin
                                </span>
                            )}
                            {introPhase === 'move' && (
                                <span className="text-gray-400/60 text-xs tracking-[0.25em] uppercase mb-10">
                                    Move to Flow
                                </span>
                            )}
                            {introPhase === 'scroll' && (
                                <div className="flex flex-col items-center gap-3">
                                    <span className="text-gray-400/60 text-xs tracking-[0.25em] uppercase animate-pulse">
                                        Scroll to Explore
                                    </span>
                                    <motion.div
                                        animate={{ y: [0, 8, 0] }}
                                        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                                        className="w-[1px] h-8 bg-gradient-to-b from-gray-500/40 to-transparent"
                                    />
                                </div>
                            )}
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
                    <div className="absolute bottom-6 right-4 sm:bottom-8 sm:right-6 md:bottom-10 md:right-16 flex flex-col items-center gap-3 sm:gap-4 z-50">
                        <div className="relative group">
                            {/* Glow Effect */}
                            <div className="absolute inset-0 bg-[#00f3ff] rounded-full blur-[20px] opacity-20 group-hover:opacity-60 transition-opacity duration-500 will-change-transform" />

                            {/* Power Button */}
                            <button
                                onClick={handleInitialize}
                                onMouseEnter={() => playSound('hover')}
                                className="pointer-events-auto relative w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 rounded-full bg-black/90 border-2 border-[#00f3ff] text-[#00f3ff] 
                                         hover:bg-[#00f3ff] hover:text-black transition-all duration-300 ease-out 
                                         flex items-center justify-center group-hover:scale-110 group-hover:shadow-[0_0_40px_rgba(0,243,255,0.4)]"
                            >
                                <Power className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 stroke-[2px]" />
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
                        className="fixed bottom-12 sm:bottom-16 w-full flex justify-center pointer-events-none z-50"
                    >
                        <span className="text-white/60 text-xs sm:text-sm md:text-base font-light tracking-[0.2em] sm:tracking-[0.4em] uppercase italic">
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
                        index={featurePoints.findIndex(f => f.id === activeFeature.id)}
                    />
                )}
            </AnimatePresence>

            {/* Final Landing Page */}
            <FinalLanding showPrompt={showFinalPrompt} showCard={showFinalCard} />
        </>
    )
}
