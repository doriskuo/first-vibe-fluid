'use client'

import { useState, useEffect } from 'react'

interface Viewport {
    width: number
    height: number
    aspectRatio: number
    isPortrait: boolean
    isMobile: boolean  // width < 768px
}

export function useViewport(): Viewport {
    const [viewport, setViewport] = useState<Viewport>({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        aspectRatio: 1920 / 1080,
        isPortrait: false,
        isMobile: false,
    })

    useEffect(() => {
        const update = () => {
            const width = window.innerWidth
            const height = window.innerHeight
            const aspectRatio = width / height

            setViewport({
                width,
                height,
                aspectRatio,
                isPortrait: aspectRatio < 1,
                isMobile: width < 768,
            })
        }

        update()
        window.addEventListener('resize', update)
        return () => window.removeEventListener('resize', update)
    }, [])

    return viewport
}
