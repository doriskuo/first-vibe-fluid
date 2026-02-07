'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAudio } from '@/components/providers/AudioProvider'
import { useDeviceSize } from '@/hooks/useDeviceSize'

interface FeatureCalloutProps {
    title: string
    value: string
    description?: string
    position: { x: string, y: string }
    visible: boolean
    targetPoint?: { x: string, y: string }
}

/**
 * FeatureCallout - Cyberpunk 風格的特寫說明框
 * 
 * 動畫順序 (進場)：
 * 1. 靠近中心的那一側出現垂直線
 * 2. 向外側水平展開成完整框
 * 3. 內容淡入
 * 4. 連結線從框邊緣畫出，延伸到 VR 主體
 * 
 * 退場：完全反向播放
 */
export default function FeatureCallout({
    title,
    value,
    description,
    position,
    visible,
    targetPoint = { x: '50%', y: '50%' }
}: FeatureCalloutProps) {
    const [blink, setBlink] = useState(true)
    const calloutRef = useRef<HTMLDivElement>(null)
    const { playSound } = useAudio()
    const hasPlayedRef = useRef(false)
    const { isMobile } = useDeviceSize()

    // Responsive sizing
    const boxPadding = isMobile ? '10px 12px' : '14px 18px'
    const minWidth = isMobile ? '160px' : '200px'
    const minHeight = isMobile ? '50px' : '70px'
    const titleSize = isMobile ? '9px' : '11px'
    const valueSize = isMobile ? '16px' : '22px'
    const descSize = isMobile ? '8px' : '10px'

    // 閃爍動畫
    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(prev => !prev)
        }, 500)
        return () => clearInterval(interval)
    }, [])

    // 播放 callout 音效
    useEffect(() => {
        if (visible && !hasPlayedRef.current) {
            playSound('callout')
            hasPlayedRef.current = true
        } else if (!visible) {
            hasPlayedRef.current = false
        }
    }, [visible, playSound])

    // 計算位置
    const calloutX = parseFloat(position.x)
    const calloutY = parseFloat(position.y)
    const targetX = parseFloat(targetPoint.x)
    const targetY = parseFloat(targetPoint.y)

    // 判斷 callout 在左側還是右側
    // 左側 callout: 從右邊緣開始，向左展開 (transformOrigin: right)
    // 右側 callout: 從左邊緣開始，向右展開 (transformOrigin: left)
    const isLeftSide = calloutX < 50

    // 連結線：從 callout 靠近中心的邊緣，連到 VR 目標點
    const lineStartX = isLeftSide ? calloutX + 10 : calloutX - 10  // 從框的內側邊緣開始
    const lineMidX = (lineStartX + targetX) / 2  // 中間轉折點

    const linePath = `M ${lineStartX} ${calloutY} L ${lineMidX} ${calloutY} L ${lineMidX} ${targetY} L ${targetX} ${targetY}`

    // 動畫時間配置 - 放慢讓動畫更清楚
    const timings = {
        lineAppear: 0.35,      // 垂直線出現
        boxExpand: 0.55,       // 框展開
        contentFade: 0.25,     // 內容淡入
        connectorDraw: 0.6,    // 連結線繪製
    }

    // 退場時間 (反向順序，同樣慢)
    const exitTimings = {
        connectorRetract: 0.4,   // 連結線縮回
        contentFade: 0.15,       // 內容淡出
        boxShrink: 0.45,         // 框收縮
        lineDisappear: 0.3,      // 垂直線消失
    }

    const totalEnterTime = timings.lineAppear + timings.boxExpand + timings.contentFade
    const connectorDelay = totalEnterTime
    const totalExitTime = exitTimings.connectorRetract + exitTimings.boxShrink + exitTimings.lineDisappear

    // 如果不可見就不渲染
    if (!visible) return null

    return (
        <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{ display: 'contents' }}
        >
            {/* ===== 連結線 SVG - 獨立在最外層 ===== */}
            <motion.svg
                key="connector-svg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    width: '100vw',
                    height: '100vh',
                    pointerEvents: 'none',
                    zIndex: 99,
                }}
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
            >
                <defs>
                    <filter id="lineGlow" x="-100%" y="-100%" width="300%" height="300%">
                        <feGaussianBlur stdDeviation="0.4" result="blur" />
                        <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                </defs>

                {/* 連結線 - 外層光暈 */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="rgba(0, 255, 255, 0.4)"
                    strokeWidth="0.6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    filter="url(#lineGlow)"
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: 1,
                        transition: {
                            duration: timings.connectorDraw,
                            delay: connectorDelay,
                            ease: "easeOut"
                        }
                    }}
                    exit={{
                        pathLength: 0,
                        transition: {
                            duration: exitTimings.connectorRetract,
                            ease: "easeIn"
                        }
                    }}
                />

                {/* 連結線 - 核心線 */}
                <motion.path
                    d={linePath}
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth="0.18"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    initial={{ pathLength: 0 }}
                    animate={{
                        pathLength: 1,
                        transition: {
                            duration: timings.connectorDraw,
                            delay: connectorDelay,
                            ease: "easeOut"
                        }
                    }}
                    exit={{
                        pathLength: 0,
                        transition: {
                            duration: exitTimings.connectorRetract,
                            ease: "easeIn"
                        }
                    }}
                />

                {/* 目標點 - 內圈閃爍 */}
                <motion.circle
                    cx={targetX}
                    cy={targetY}
                    r="0.8"
                    fill={blink ? '#00ffff' : '#005555'}
                    filter="url(#lineGlow)"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{
                        opacity: 1,
                        scale: 1,
                        transition: {
                            duration: 0.2,
                            delay: connectorDelay + timings.connectorDraw
                        }
                    }}
                    exit={{
                        opacity: 0,
                        scale: 0,
                        transition: { duration: 0.15 }
                    }}
                />

                {/* 目標點 - 外圈 */}
                <motion.circle
                    cx={targetX}
                    cy={targetY}
                    r="1.5"
                    fill="none"
                    stroke="#00ffff"
                    strokeWidth="0.1"
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: 0.5,
                        transition: {
                            duration: 0.2,
                            delay: connectorDelay + timings.connectorDraw
                        }
                    }}
                    exit={{ opacity: 0, transition: { duration: 0.15 } }}
                />
            </motion.svg>

            {/* ===== 說明框容器 ===== */}
            <motion.div
                key="callout-box"
                ref={calloutRef}
                initial={{ opacity: 1 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 1 }}
                style={{
                    position: 'fixed',
                    left: position.x,
                    top: position.y,
                    transform: 'translate(-50%, -50%)',
                    pointerEvents: 'none',
                    zIndex: 100,
                }}
            >
                {/* 邊框線（展開前可見的垂直線）- 在內側邊緣 */}
                <motion.div
                    style={{
                        position: 'absolute',
                        // 左側 callout：垂直線在右邊 (靠近中心)
                        // 右側 callout：垂直線在左邊 (靠近中心)
                        [isLeftSide ? 'right' : 'left']: '-1px',
                        top: '0',
                        width: '2px',
                        height: '100%',
                        background: '#00ffff',
                        boxShadow: '0 0 10px #00ffff, 0 0 20px #00ffff50',
                        zIndex: 10,
                    }}
                    initial={{ scaleY: 0 }}
                    animate={{
                        scaleY: 1,
                        transition: { duration: timings.lineAppear, ease: 'easeOut' }
                    }}
                    exit={{
                        scaleY: 0,
                        transition: {
                            duration: exitTimings.lineDisappear,
                            delay: exitTimings.connectorRetract + exitTimings.boxShrink,
                            ease: 'easeIn'
                        }
                    }}
                />

                {/* 框體 - 從內側向外展開 */}
                <motion.div
                    style={{
                        // 左側 callout：從右邊開始向左展開
                        // 右側 callout：從左邊開始向右展開
                        transformOrigin: isLeftSide ? 'right center' : 'left center',
                    }}
                    initial={{ scaleX: 0 }}
                    animate={{
                        scaleX: 1,
                        transition: {
                            duration: timings.boxExpand,
                            delay: timings.lineAppear,
                            ease: [0.25, 0.1, 0.25, 1]
                        }
                    }}
                    exit={{
                        scaleX: 0,
                        transition: {
                            duration: exitTimings.boxShrink,
                            delay: exitTimings.connectorRetract + exitTimings.contentFade,
                            ease: [0.55, 0.05, 0.55, 0.95]
                        }
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(0, 10, 20, 0.92)',
                            border: '1px solid rgba(0, 255, 255, 0.6)',
                            borderRadius: '2px',
                            padding: boxPadding,
                            minWidth: minWidth,
                            minHeight: minHeight,
                            boxShadow: `
                                        0 0 15px rgba(0, 255, 255, 0.3),
                                        0 0 30px rgba(0, 255, 255, 0.1),
                                        inset 0 0 30px rgba(0, 255, 255, 0.03)
                                    `,
                            backdropFilter: 'blur(12px)',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* 角落裝飾 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                transition: { delay: timings.lineAppear + timings.boxExpand, duration: 0.15 }
                            }}
                            exit={{ opacity: 0, transition: { duration: exitTimings.contentFade, delay: exitTimings.connectorRetract } }}
                            style={{ position: 'absolute', inset: '-6px', pointerEvents: 'none' }}
                        >
                            <div style={{ position: 'absolute', top: 0, left: 0, width: '12px', height: '12px', borderTop: '2px solid #00ffff', borderLeft: '2px solid #00ffff' }} />
                            <div style={{ position: 'absolute', top: 0, right: 0, width: '12px', height: '12px', borderTop: '2px solid #00ffff', borderRight: '2px solid #00ffff' }} />
                            <div style={{ position: 'absolute', bottom: 0, left: 0, width: '12px', height: '12px', borderBottom: '2px solid #00ffff', borderLeft: '2px solid #00ffff' }} />
                            <div style={{ position: 'absolute', bottom: 0, right: 0, width: '12px', height: '12px', borderBottom: '2px solid #00ffff', borderRight: '2px solid #00ffff' }} />
                        </motion.div>

                        {/* 掃描線 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                transition: { delay: totalEnterTime }
                            }}
                            exit={{ opacity: 0, transition: { duration: exitTimings.contentFade, delay: exitTimings.connectorRetract } }}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: '1px',
                                background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
                                animation: 'calloutScan 2s ease-in-out infinite',
                            }}
                        />

                        {/* 內容 */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{
                                opacity: 1,
                                transition: {
                                    duration: timings.contentFade,
                                    delay: timings.lineAppear + timings.boxExpand
                                }
                            }}
                            exit={{
                                opacity: 0,
                                transition: { duration: exitTimings.contentFade, delay: exitTimings.connectorRetract }
                            }}
                        >
                            {/* 標題 */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                                <div style={{
                                    width: '8px', height: '8px', borderRadius: '50%',
                                    background: blink ? '#00ffff' : '#003333',
                                    boxShadow: blink ? '0 0 12px #00ffff' : 'none',
                                    transition: 'all 0.15s',
                                }} />
                                <span style={{
                                    color: '#00ffff',
                                    fontSize: titleSize,
                                    fontFamily: '"Orbitron", "Courier New", monospace',
                                    fontWeight: 700,
                                    letterSpacing: '2px',
                                    textTransform: 'uppercase',
                                    textShadow: '0 0 8px rgba(0, 255, 255, 0.6)',
                                }}>
                                    {title}
                                </span>
                            </div>

                            {/* 數值 */}
                            <div style={{
                                color: '#ffffff',
                                fontSize: valueSize,
                                fontFamily: '"Orbitron", "Courier New", monospace',
                                fontWeight: 700,
                                letterSpacing: '3px',
                                textShadow: '0 0 15px rgba(0, 255, 255, 0.6)',
                            }}>
                                {value}
                            </div>

                            {/* 描述 */}
                            {description && (
                                <div style={{
                                    color: 'rgba(0, 200, 220, 0.7)',
                                    fontSize: descSize,
                                    fontFamily: '"Courier New", monospace',
                                    marginTop: '6px',
                                    letterSpacing: '1px',
                                    borderTop: '1px solid rgba(0, 255, 255, 0.2)',
                                    paddingTop: '6px',
                                }}>
                                    {'> '}{description}
                                </div>
                            )}

                            {/* 數據條 */}
                            <div style={{
                                position: 'absolute',
                                bottom: '4px',
                                right: '8px',
                                display: 'flex',
                                gap: '3px',
                            }}>
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} style={{
                                        width: '3px',
                                        height: `${6 + (i % 3) * 4}px`,
                                        background: i < 3 ? '#00ffff' : 'rgba(0, 255, 255, 0.3)',
                                        opacity: 0.6,
                                    }} />
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </motion.div>
            </motion.div>

            {/* CSS 動畫 */}
            <style jsx global>{`
                        @keyframes calloutScan {
                            0%, 100% { transform: translateX(-100%); opacity: 0; }
                            50% { transform: translateX(100%); opacity: 1; }
                        }
                    `}</style>
        </motion.div>
    )
}
