'use client'

import dynamic from 'next/dynamic'

// 動態載入 Scene 避免 SSR 問題
const Scene = dynamic(() => import('@/components/canvas/Scene'), {
  ssr: false,
})

const FluidSphere = dynamic(() => import('@/components/canvas/FluidSphere'), {
  ssr: false,
})

export default function Home() {
  return (
    <main className="relative w-full h-screen bg-gradient-to-b from-[#FFF5F0] to-[#FEF3E8]">
      {/* 3D 場景 */}
      <Scene>
        <FluidSphere />
      </Scene>

      {/* UI 覆蓋層 */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <p className="text-gray-400 text-sm animate-pulse">
            滾動開始體驗
          </p>
        </div>
      </div>
    </main>
  )
}
