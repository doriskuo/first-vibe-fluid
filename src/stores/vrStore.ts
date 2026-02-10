/**
 * VR Store — 管理 VR 頭盔及其子元件的可見度/動畫狀態
 * 
 * 取代 GlassWaterDrop.tsx 的 18 個 useState。
 * 關鍵改進：useFrame 中透過 getState() 直接操作，不觸發 React re-render。
 * 子元件用 selector 訂閱各自需要的 slice，只有值改變時才 re-render。
 */
import { create } from 'zustand'

interface VRStore {
    // 拖曳旋轉
    isDragging: boolean
    manualRotation: { x: number; y: number; z: number }
    isResetting: boolean

    // VR 耳罩
    headphonesVisible: boolean
    headphonesOpacity: number

    // 掃描效果
    scanVisible: boolean
    scanProgress: number

    // 粒子效果
    particlesVisible: boolean
    particlesOpacity: number

    // 全息電路
    circuitVisible: boolean
    circuitOpacity: number
    circuitGrowth: number

    // Center Lock 歸位特效
    lockEffectVisible: boolean
    lockEffectProgress: number

    // 全息投影
    holoVisible: boolean
    holoOpacity: number
    vrFlipProgress: number

    // Actions
    setDragging: (v: boolean) => void
    setManualRotation: (r: { x: number; y: number; z: number }) => void
    setIsResetting: (v: boolean) => void

    /**
     * 批次更新可見度狀態 — 專為 useFrame 設計
     * 單次呼叫更新多個值，只觸發一次 store 變更通知
     */
    updateVisibility: (updates: Partial<Omit<VRStore, 'setDragging' | 'setManualRotation' | 'setIsResetting' | 'updateVisibility'>>) => void
}

export const useVRStore = create<VRStore>((set) => ({
    // 拖曳旋轉
    isDragging: false,
    manualRotation: { x: 0, y: 0, z: 0 },
    isResetting: false,

    // VR 耳罩
    headphonesVisible: false,
    headphonesOpacity: 0,

    // 掃描效果
    scanVisible: false,
    scanProgress: 0,

    // 粒子效果
    particlesVisible: false,
    particlesOpacity: 0,

    // 全息電路
    circuitVisible: false,
    circuitOpacity: 0,
    circuitGrowth: 0,

    // Center Lock 歸位特效
    lockEffectVisible: false,
    lockEffectProgress: 0,

    // 全息投影
    holoVisible: false,
    holoOpacity: 0,
    vrFlipProgress: 0,

    // Actions
    setDragging: (v) => set({ isDragging: v }),
    setManualRotation: (r) => set({ manualRotation: r }),
    setIsResetting: (v) => set({ isResetting: v }),

    updateVisibility: (updates) => set(updates),
}))
