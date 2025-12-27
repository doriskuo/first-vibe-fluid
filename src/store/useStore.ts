import { create } from 'zustand'

interface AppState {
    // 互動狀態
    currentState: 'liquid' | 'ripple' | 'condensing' | 'forming' | 'solid' | 'exploded'
    scrollProgress: number

    // 滑鼠資訊
    mousePosition: { x: number; y: number }
    mouseVelocity: number

    // Actions
    setCurrentState: (state: AppState['currentState']) => void
    setScrollProgress: (progress: number) => void
    setMousePosition: (x: number, y: number) => void
    setMouseVelocity: (velocity: number) => void
}

export const useStore = create<AppState>((set) => ({
    // 初始狀態
    currentState: 'liquid',
    scrollProgress: 0,
    mousePosition: { x: 0, y: 0 },
    mouseVelocity: 0,

    // Actions
    setCurrentState: (state) => set({ currentState: state }),
    setScrollProgress: (progress) => set({ scrollProgress: progress }),
    setMousePosition: (x, y) => set({ mousePosition: { x, y } }),
    setMouseVelocity: (velocity) => set({ mouseVelocity: velocity }),
}))
