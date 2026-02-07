'use client'

import { useState, useEffect } from 'react'

interface DeviceSize {
    width: number
    height: number
    isMobile: boolean      // < 640px
    isTablet: boolean      // 640px - 1024px
    isDesktop: boolean     // >= 1024px
    isLandscape: boolean
}

export function useDeviceSize(): DeviceSize {
    const [size, setSize] = useState<DeviceSize>({
        width: typeof window !== 'undefined' ? window.innerWidth : 1920,
        height: typeof window !== 'undefined' ? window.innerHeight : 1080,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isLandscape: true,
    })

    useEffect(() => {
        const updateSize = () => {
            const width = window.innerWidth
            const height = window.innerHeight

            setSize({
                width,
                height,
                isMobile: width < 640,
                isTablet: width >= 640 && width < 1024,
                isDesktop: width >= 1024,
                isLandscape: width > height,
            })
        }

        // Initial update
        updateSize()

        // Listen for resize
        window.addEventListener('resize', updateSize)
        return () => window.removeEventListener('resize', updateSize)
    }, [])

    return size
}
