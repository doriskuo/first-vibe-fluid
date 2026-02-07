'use client'

import { Volume2, VolumeX, Music, Music2 } from 'lucide-react'
import { motion } from 'framer-motion'
import { useAudio } from '@/components/providers/AudioProvider'

/**
 * SoundToggle - 背景音樂開關按鈕
 * 固定在右上角，只控制背景音樂
 * 音效（hover, click, callout 等）預設開啟，不受此按鈕影響
 */
export default function SoundToggle() {
    const { isMusicPlaying, toggleMusic, playSound } = useAudio()

    const handleClick = () => {
        playSound('click')
        toggleMusic()
    }

    return (
        <motion.button
            onClick={handleClick}
            className="fixed top-6 right-6 z-[100] p-2 flex items-center justify-center cursor-pointer pointer-events-auto"
            style={{
                filter: isMusicPlaying
                    ? 'drop-shadow(0 0 8px rgba(0,243,255,0.6))'
                    : 'drop-shadow(0 0 4px rgba(255,255,255,0.3))'
            }}
            whileHover={{
                scale: 1.15,
                filter: isMusicPlaying
                    ? 'drop-shadow(0 0 12px rgba(0,243,255,0.9))'
                    : 'drop-shadow(0 0 8px rgba(255,255,255,0.6))'
            }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            title={isMusicPlaying ? '關閉背景音樂' : '開啟背景音樂'}
        >
            {isMusicPlaying ? (
                <Music2 className="w-5 h-5 text-[#00f3ff]" />
            ) : (
                <Music className="w-5 h-5 text-white/50" />
            )}
        </motion.button>
    )
}

