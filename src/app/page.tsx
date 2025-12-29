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
      {/* 全螢幕 3D 流體背景 */}
      <div className="fixed inset-0 w-screen h-screen">
        <Scene>
          <FluidBackground />
        </Scene>
      </div>
    </>
  )
}
