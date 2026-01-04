'use client'

import dynamic from 'next/dynamic'

// 動態載入 Scene 避免 SSR 問題
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
})

const FluidBackground = dynamic(() => import('@/components/canvas/FluidBackground'), {
  ssr: false,
})

export default function Home() {
  return (
    <>
      <div className="fixed inset-0 w-screen h-screen z-0">
        <Scene>
          <FluidBackground />
        </Scene>
      </div>

      {/* Scrollable Area - Extended for balanced transitions */}
      {/* Shape ~650vh, Buffer ~150vh, Material ~700vh */}
      <div className="relative w-full h-[1600vh] pointer-events-none" />
    </>
  )
}
