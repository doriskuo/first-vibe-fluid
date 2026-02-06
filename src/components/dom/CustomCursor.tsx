'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

/**
 * CustomCursor - 流體風格自訂游標
 * 白色圓點 + 虹彩光暈，配合液態/玻璃視覺風格
 */
export default function CustomCursor() {
    const haloRef = useRef<HTMLDivElement>(null)
    const dotRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)
    const [isDragging, setIsDragging] = useState(false)
    const [isScrolling, setIsScrolling] = useState(false)

    useEffect(() => {
        const halo = haloRef.current
        const dot = dotRef.current
        if (!halo || !dot) return

        // 滑鼠移動追蹤
        const onMouseMove = (e: MouseEvent) => {
            // 光暈：稍微延遲跟隨（流動感）
            gsap.to(halo, {
                x: e.clientX - 24,
                y: e.clientY - 24,
                duration: 0.15,
                ease: 'power2.out',
            })
            // 中心點：完全即時跟隨
            dot.style.transform = `translate(${e.clientX - 4}px, ${e.clientY - 4}px)`
        }

        // 滾動偵測
        let scrollTimeout: NodeJS.Timeout
        const onScroll = () => {
            setIsScrolling(true)
            clearTimeout(scrollTimeout)
            scrollTimeout = setTimeout(() => setIsScrolling(false), 150)
        }

        // 拖曳偵測
        const onMouseDown = () => setIsDragging(true)
        const onMouseUp = () => setIsDragging(false)

        // Hover 偵測
        const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]')
        const onMouseEnter = () => setIsHovering(true)
        const onMouseLeave = () => setIsHovering(false)

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', onMouseEnter)
            el.addEventListener('mouseleave', onMouseLeave)
        })

        window.addEventListener('mousemove', onMouseMove)
        window.addEventListener('scroll', onScroll)
        window.addEventListener('mousedown', onMouseDown)
        window.addEventListener('mouseup', onMouseUp)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            window.removeEventListener('scroll', onScroll)
            window.removeEventListener('mousedown', onMouseDown)
            window.removeEventListener('mouseup', onMouseUp)
            clearTimeout(scrollTimeout)
            interactiveElements.forEach((el) => {
                el.removeEventListener('mouseenter', onMouseEnter)
                el.removeEventListener('mouseleave', onMouseLeave)
            })
        }
    }, [])

    // 動態樣式計算
    const haloScale = isDragging ? 1.5 : isScrolling ? 1.3 : isHovering ? 1.4 : 1
    const dotScale = isDragging ? 0.5 : isHovering ? 1.5 : 1

    return (
        <>
            {/* 虹彩光暈 */}
            <div
                ref={haloRef}
                className="fixed top-0 left-0 w-12 h-12 rounded-full pointer-events-none z-[9999]"
                style={{
                    background: 'conic-gradient(from 0deg, rgba(255,200,200,0.4), rgba(200,255,200,0.4), rgba(200,200,255,0.4), rgba(255,255,200,0.4), rgba(255,200,255,0.4), rgba(255,200,200,0.4))',
                    filter: 'blur(8px)',
                    transform: `scale(${haloScale})`,
                    transition: 'transform 0.3s ease-out, opacity 0.3s',
                    opacity: isDragging || isScrolling || isHovering ? 0.9 : 0.6,
                }}
            />
            {/* 中心白點 */}
            <div
                ref={dotRef}
                className="fixed top-0 left-0 w-2 h-2 rounded-full pointer-events-none z-[9999]"
                style={{
                    backgroundColor: 'white',
                    boxShadow: '0 0 4px rgba(255,255,255,0.8)',
                    transform: `scale(${dotScale})`,
                    transition: 'transform 0.15s ease-out',
                }}
            />
        </>
    )
}
