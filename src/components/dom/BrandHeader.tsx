
import React from 'react'

export default function BrandHeader() {
    return (
        <header className="fixed top-0 left-0 w-full z-60 p-8 flex justify-between items-start pointer-events-none mix-blend-difference text-white">
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 border border-white/30 flex items-center justify-center rounded-full">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                </div>
                <div className="flex flex-col">
                    <h1 className="font-sans text-lg tracking-[0.2em] font-bold uppercase">
                        Fluid<span className="opacity-50">_Dynamic</span>
                    </h1>
                    <span className="text-[10px] font-mono tracking-[0.4em] opacity-60">
                        SYSTEM.STATE: LIQUID
                    </span>
                </div>
            </div>
        </header>
    )
}
