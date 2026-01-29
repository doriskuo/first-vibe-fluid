'use client'

import BrandHeader from '@/components/dom/BrandHeader'
import CyberpunkBorder from '@/components/dom/CyberpunkBorder'
import CyberpunkOverlay from '@/components/dom/CyberpunkOverlay'
import dynamic from 'next/dynamic'
import { totalPageHeightVh } from '@/config/scrollTimeline'

// 動態載入 Scene 避免 SSR 問題
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
})

const FluidBackground = dynamic(() => import('@/components/canvas/FluidBackground'), {
  ssr: false,
})

const GlassWaterDrop = dynamic(() => import('@/components/canvas/GlassWaterDrop'), {
  ssr: false,
})

const AudioVisualizer = dynamic(() => import('@/components/canvas/AudioVisualizer'), {
  ssr: false,
})

const VisualParticles = dynamic(() => import('@/components/canvas/VisualParticles'), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      {/* Phase 0: Early Polish UI */}
      <BrandHeader />
      <CyberpunkBorder />

      {/* Phase 2: Cyberpunk Overlay & Lock */}
      <CyberpunkOverlay />

      <div className="fixed inset-0 w-screen h-screen z-40 pointer-events-none">
        <Scene>
          <FluidBackground />
          <AudioVisualizer />
          <VisualParticles />
          <GlassWaterDrop />
        </Scene>
      </div>

      {/* Scrollable Area - 高度根據效果自動計算 */}
      <div
        className="relative w-full pointer-events-none"
        style={{ height: `${totalPageHeightVh}vh` }}
      />
    </>
  )
}
