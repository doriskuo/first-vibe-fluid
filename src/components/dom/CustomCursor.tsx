'use client'

import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null)
    const cursorDotRef = useRef<HTMLDivElement>(null)
    const [isHovering, setIsHovering] = useState(false)

    useEffect(() => {
        const cursor = cursorRef.current
        const dot = cursorDotRef.current
        if (!cursor || !dot) return

        // 滑鼠移動追蹤
        const onMouseMove = (e: MouseEvent) => {
            gsap.to(cursor, {
                x: e.clientX - 20,
                y: e.clientY - 20,
                duration: 0.5,
                ease: 'power3.out',
            })
            gsap.to(dot, {
                x: e.clientX - 4,
                y: e.clientY - 4,
                duration: 0.1,
            })
        }

        // 監聽可點擊元素
        const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]')

        const onMouseEnter = () => setIsHovering(true)
        const onMouseLeave = () => setIsHovering(false)

        interactiveElements.forEach((el) => {
            el.addEventListener('mouseenter', onMouseEnter)
            el.addEventListener('mouseleave', onMouseLeave)
        })

        window.addEventListener('mousemove', onMouseMove)

        return () => {
            window.removeEventListener('mousemove', onMouseMove)
            interactiveElements.forEach((el) => {
                el.removeEventListener('mouseenter', onMouseEnter)
                el.removeEventListener('mouseleave', onMouseLeave)
            })
        }
    }, [])

    return (
        <>
            {/* 外圈 */}
            <div
                ref={cursorRef}
                className={`fixed top-0 left-0 w-10 h-10 rounded-full pointer-events-none z-[9999] mix-blend-difference transition-transform duration-200 ${isHovering ? 'scale-150' : 'scale-100'
                    }`}
                style={{
                    border: '1px solid rgba(255, 255, 255, 0.5)',
                }}
            />
            {/* 中心點 */}
            <div
                ref={cursorDotRef}
                className="fixed top-0 left-0 w-2 h-2 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
            />
        </>
    )
}
