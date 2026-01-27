'use client'

import BrandHeader from '@/components/dom/BrandHeader'
import CyberpunkBorder from '@/components/dom/CyberpunkBorder'
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

export default function Home() {
  return (
    <>
      {/* Phase 0: Early Polish UI */}
      <BrandHeader />
      <CyberpunkBorder />

      <div className="fixed inset-0 w-screen h-screen z-0">
        <Scene>
          <FluidBackground />
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
