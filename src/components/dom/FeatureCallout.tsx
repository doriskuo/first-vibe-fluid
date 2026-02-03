'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface FeatureCalloutProps {
    title: string
    value: string
    description?: string
    position: { x: string, y: string }
    visible: boolean
}

/**
 * FeatureCallout - Cyberpunk 風格的特寫說明框
 * 
 * 特點：
 * - 半透明黑底 + 霓虹邊框
 * - 閃爍的資料點
 * - 平滑淡入淡出動畫
 */
export default function FeatureCallout({
    title,
    value,
    description,
    position,
    visible
}: FeatureCalloutProps) {
    // 閃爍動畫
    const [blink, setBlink] = useState(true)

    useEffect(() => {
        const interval = setInterval(() => {
            setBlink(prev => !prev)
        }, 500)
        return () => clearInterval(interval)
    }, [])

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, x: 20 }}
                    animate={{ opacity: 1, scale: 1, x: 0 }}
                    exit={{ opacity: 0, scale: 0.9, x: -20 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    style={{
                        position: 'absolute',
                        left: position.x,
                        top: position.y,
                        transform: 'translate(-50%, -50%)',
                        pointerEvents: 'none',
                        zIndex: 100,
                    }}
                >
                    <div
                        style={{
                            background: 'rgba(0, 10, 20, 0.85)',
                            border: '1px solid rgba(0, 255, 255, 0.6)',
                            borderRadius: '4px',
                            padding: '12px 16px',
                            minWidth: '180px',
                            boxShadow: `
                                0 0 10px rgba(0, 255, 255, 0.3),
                                0 0 20px rgba(0, 255, 255, 0.1),
                                inset 0 0 20px rgba(0, 255, 255, 0.05)
                            `,
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        {/* 標題行 */}
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            marginBottom: '6px'
                        }}>
                            {/* 閃爍的資料點 */}
                            <div
                                style={{
                                    width: '6px',
                                    height: '6px',
                                    borderRadius: '50%',
                                    background: blink ? '#00ffff' : '#004444',
                                    boxShadow: blink ? '0 0 8px #00ffff' : 'none',
                                    transition: 'all 0.15s',
                                }}
                            />
                            <span
                                style={{
                                    color: 'rgba(0, 255, 255, 0.9)',
                                    fontSize: '10px',
                                    fontFamily: 'monospace',
                                    fontWeight: 600,
                                    letterSpacing: '1.5px',
                                    textTransform: 'uppercase',
                                }}
                            >
                                {title}
                            </span>
                        </div>

                        {/* 數值 */}
                        <div
                            style={{
                                color: '#ffffff',
                                fontSize: '18px',
                                fontFamily: 'monospace',
                                fontWeight: 700,
                                letterSpacing: '2px',
                                textShadow: '0 0 10px rgba(0, 255, 255, 0.5)',
                            }}
                        >
                            {value}
                        </div>

                        {/* 描述 (可選) */}
                        {description && (
                            <div
                                style={{
                                    color: 'rgba(150, 200, 220, 0.8)',
                                    fontSize: '9px',
                                    fontFamily: 'monospace',
                                    marginTop: '4px',
                                    letterSpacing: '0.5px',
                                }}
                            >
                                {description}
                            </div>
                        )}

                        {/* 底部裝飾線 */}
                        <div
                            style={{
                                position: 'absolute',
                                bottom: '-1px',
                                left: '10%',
                                width: '80%',
                                height: '2px',
                                background: 'linear-gradient(90deg, transparent, #00ffff, transparent)',
                                opacity: 0.6,
                            }}
                        />
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}
