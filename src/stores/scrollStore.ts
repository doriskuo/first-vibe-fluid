/**
 * Scroll Store — 管理滾動相關的共享狀態
 * 
 * 取代 LenisProvider 中的共享狀態部分。
 * Lenis 實例的生命週期仍由 LenisProvider 管理。
 */
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface ScrollStore {
  // 滾動鎖定
  isLocked: boolean
  setLocked: (locked: boolean) => void

  // VR 旋轉重置
  shouldResetRotation: boolean
  resetRotation: () => void
  clearResetFlag: () => void

  // 投影狀態
  projectionStarted: boolean
  onProjectionStart: () => void
  resetProjection: () => void

  // 當前階段
  currentStage: string
  setCurrentStage: (stage: string) => void

  // 手動旋轉重置觸發器（每次 +1 觸發 GlassWaterDrop 歸零手動旋轉）
  manualResetTrigger: number
}

export const useScrollStore = create<ScrollStore>()(subscribeWithSelector((set) => ({
  isLocked: false,
  setLocked: (locked) => set({ isLocked: locked }),

  shouldResetRotation: false,
  resetRotation: () => set({ shouldResetRotation: true }),
  clearResetFlag: () => set({ shouldResetRotation: false }),

  projectionStarted: false,
  onProjectionStart: () => set({ projectionStarted: true }),
  resetProjection: () => set({ projectionStarted: false }),

  currentStage: '',
  setCurrentStage: (stage) =>
    set((state) => {
      if (state.currentStage !== stage) {
        return {
          currentStage: stage,
          manualResetTrigger: state.manualResetTrigger + 1,
        }
      }
      return state // 不觸發更新
    }),

  manualResetTrigger: 0,
})))
