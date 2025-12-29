'use client'

import { useEffect, useState } from 'react'

export function useScrollProgress() {
    const [progress, setProgress] = useState(0)

    useEffect(() => {
        function handleScroll() {
            const scrollTop = window.scrollY
            const docHeight = document.documentElement.scrollHeight - window.innerHeight
            const scrollProgress = docHeight > 0 ? scrollTop / docHeight : 0
            setProgress(Math.min(1, Math.max(0, scrollProgress)))
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll() // 初始化

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return progress
}

export function useScrollY() {
    const [scrollY, setScrollY] = useState(0)

    useEffect(() => {
        function handleScroll() {
            setScrollY(window.scrollY)
        }

        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()

        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    return scrollY
}
