'use client'

import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import SplitType from 'split-type'

interface AnimatedTextProps {
    children: string
    className?: string
    delay?: number
    stagger?: number
    as?: 'h1' | 'h2' | 'h3' | 'p' | 'span'
}

export default function AnimatedText({
    children,
    className = '',
    delay = 0,
    stagger = 0.03,
    as: Component = 'h1',
}: AnimatedTextProps) {
    const textRef = useRef<HTMLHeadingElement>(null)

    useEffect(() => {
        if (!textRef.current) return

        // 分割文字
        const split = new SplitType(textRef.current, {
            types: 'chars,words',
            tagName: 'span',
        })

        // 設置初始狀態
        gsap.set(split.chars, {
            opacity: 0,
            y: 50,
            rotateX: -90,
        })

        // 創建動畫
        gsap.to(split.chars, {
            opacity: 1,
            y: 0,
            rotateX: 0,
            duration: 0.8,
            stagger: stagger,
            delay: delay,
            ease: 'power3.out',
        })

        // 清理
        return () => {
            split.revert()
        }
    }, [children, delay, stagger])

    return (
        <Component
            ref={textRef}
            className={`${className} overflow-hidden`}
            style={{ perspective: '1000px' }}
        >
            {children}
        </Component>
    )
}
