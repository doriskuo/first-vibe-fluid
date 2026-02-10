/**
 * UI Store — 管理 CyberpunkOverlay 的 UI 階段狀態
 * 
 * 取代 CyberpunkOverlay.tsx 的 18 個 useState。
 * 子元件（FeatureCallout、FinalLanding、Navbar）從此 store 讀取狀態。
 */
import { create } from 'zustand'
import type { FeaturePoint } from '@/config/featureConfig'

export type IntroPhase = 'tap' | 'move' | 'scroll' | 'done'

interface UIStore {
    // 初始化 & 背景
    isInitialized: boolean
    bgOpacity: number
    uiVisible: boolean

    // Feature Callout
    activeFeature: FeaturePoint | null
    calloutVisible: boolean
    calloutPhase: 'entering' | 'visible' | 'exiting' | 'hidden'

    // Vibe Text
    vibeTextVisible: boolean
    vibeText: string

    // Intro Narrative
    showIntroBrand: boolean
    showIntroPhilosophy: boolean
    introPhase: IntroPhase

    // Final Landing
    showFinalPrompt: boolean
    showFinalCard: boolean

    // 時序控制旗標
    projectionComplete: boolean
    portalSoundPlayed: boolean
    portalExitSoundPlayed: boolean

    // 液態階段偵測
    isInLiquidPhase: boolean

    // Slogan 輪播
    sloganIndex: number

    // Actions
    setInitialized: (v: boolean) => void
    setBgOpacity: (v: number) => void
    setUiVisible: (v: boolean) => void
    setActiveFeature: (f: FeaturePoint | null) => void
    setCalloutVisible: (v: boolean) => void
    setCalloutPhase: (v: 'entering' | 'visible' | 'exiting' | 'hidden') => void
    setVibeTextVisible: (v: boolean) => void
    setVibeText: (v: string) => void
    setShowIntroBrand: (v: boolean) => void
    setShowIntroPhilosophy: (v: boolean) => void
    setIntroPhase: (v: IntroPhase) => void
    setShowFinalPrompt: (v: boolean) => void
    setShowFinalCard: (v: boolean) => void
    setProjectionComplete: (v: boolean) => void
    setPortalSoundPlayed: (v: boolean) => void
    setPortalExitSoundPlayed: (v: boolean) => void
    setIsInLiquidPhase: (v: boolean) => void
    setSloganIndex: (v: number) => void
    nextSlogan: (totalSlogans: number) => void
}

export const useUIStore = create<UIStore>((set) => ({
    // 初始化 & 背景
    isInitialized: false,
    bgOpacity: 0,
    uiVisible: false,

    // Feature Callout
    activeFeature: null,
    calloutVisible: false,
    calloutPhase: 'hidden',

    // Vibe Text
    vibeTextVisible: false,
    vibeText: '',

    // Intro Narrative
    showIntroBrand: true,
    showIntroPhilosophy: false,
    introPhase: 'tap',

    // Final Landing
    showFinalPrompt: false,
    showFinalCard: false,

    // 時序控制旗標
    projectionComplete: false,
    portalSoundPlayed: false,
    portalExitSoundPlayed: false,

    // 液態階段偵測
    isInLiquidPhase: true,

    // Slogan 輪播
    sloganIndex: 0,

    // Actions
    setInitialized: (v) => set({ isInitialized: v }),
    setBgOpacity: (v) => set({ bgOpacity: v }),
    setUiVisible: (v) => set({ uiVisible: v }),
    setActiveFeature: (f) => set({ activeFeature: f }),
    setCalloutVisible: (v) => set({ calloutVisible: v }),
    setCalloutPhase: (v) => set({ calloutPhase: v }),
    setVibeTextVisible: (v) => set({ vibeTextVisible: v }),
    setVibeText: (v) => set({ vibeText: v }),
    setShowIntroBrand: (v) => set({ showIntroBrand: v }),
    setShowIntroPhilosophy: (v) => set({ showIntroPhilosophy: v }),
    setIntroPhase: (v) => set({ introPhase: v }),
    setShowFinalPrompt: (v) => set({ showFinalPrompt: v }),
    setShowFinalCard: (v) => set({ showFinalCard: v }),
    setProjectionComplete: (v) => set({ projectionComplete: v }),
    setPortalSoundPlayed: (v) => set({ portalSoundPlayed: v }),
    setPortalExitSoundPlayed: (v) => set({ portalExitSoundPlayed: v }),
    setIsInLiquidPhase: (v) => set({ isInLiquidPhase: v }),
    setSloganIndex: (v) => set({ sloganIndex: v }),
    nextSlogan: (totalSlogans) =>
        set((state) => ({ sloganIndex: (state.sloganIndex + 1) % totalSlogans })),
}))
