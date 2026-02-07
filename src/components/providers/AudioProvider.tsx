'use client'

import { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { Howl, Howler } from 'howler'

interface AudioContextType {
    // 背景音樂控制
    isMusicPlaying: boolean
    toggleMusic: () => void
    // 音效播放
    playSound: (soundName: string) => void
    // 音量控制
    setVolume: (volume: number) => void
    volume: number
}

const AudioContext = createContext<AudioContextType>({
    isMusicPlaying: false,
    toggleMusic: () => { },
    playSound: () => { },
    setVolume: () => { },
    volume: 0.5
})

export const useAudio = () => useContext(AudioContext)

// 預載音效配置
const soundConfig = {
    // UI 音效（預設開啟）
    hover: { src: '/sounds/ui-hover.wav', volume: 0.25 },
    click: { src: '/sounds/ui-click.wav', volume: 0.3 },
    initialize: { src: '/sounds/system-boot.wav', volume: 0.4 },

    // 階段轉換音效（預設開啟）
    hologram: { src: '/sounds/hologram.wav', volume: 0.35 },
    callout: { src: '/sounds/callout.wav', volume: 0.3 },
    whoosh: { src: '/sounds/whoosh.wav', volume: 0.35 },
    portal: { src: '/sounds/tunnel.wav', volume: 0.4 },  // 進入隧道/傳送門
    fluidSwish: { src: '/sounds/water-swish.wav', volume: 0.35, rate: 0.55 },  // 液態區互動（放慢播放）

    // 環境音效（由按鈕控制）
    ambient: { src: '/sounds/ambient.mp3', volume: 0.1, loop: true },
}

type SoundName = keyof typeof soundConfig

export default function AudioProvider({
    children
}: {
    children: React.ReactNode
}) {
    // 音效預設開啟，背景音樂預設關閉
    const [isMusicPlaying, setIsMusicPlaying] = useState(false)
    const [volume, setVolumeState] = useState(0.5)
    const [isReady, setIsReady] = useState(false)
    const [userInteracted, setUserInteracted] = useState(false)  // 追蹤用戶是否有互動
    const soundsRef = useRef<Map<string, Howl>>(new Map())

    // 監聽用戶互動（解決瀏覽器自動播放限制）
    useEffect(() => {
        const handleInteraction = () => {
            setUserInteracted(true)
            // 移除監聽器
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('touchstart', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }

        window.addEventListener('click', handleInteraction)
        window.addEventListener('touchstart', handleInteraction)
        window.addEventListener('keydown', handleInteraction)

        return () => {
            window.removeEventListener('click', handleInteraction)
            window.removeEventListener('touchstart', handleInteraction)
            window.removeEventListener('keydown', handleInteraction)
        }
    }, [])

    // 初始化音效
    useEffect(() => {
        // 預載所有音效
        Object.entries(soundConfig).forEach(([name, config]) => {
            const sound = new Howl({
                src: [config.src],
                volume: config.volume * volume,
                loop: 'loop' in config ? config.loop : false,
                rate: 'rate' in config ? config.rate : 1.0,  // 支援播放速度
                preload: true,
                onloaderror: () => {
                    console.warn(`Failed to load sound: ${name}`)
                }
            })
            soundsRef.current.set(name, sound)
        })

        setIsReady(true)

        return () => {
            // 清理所有音效
            soundsRef.current.forEach(sound => sound.unload())
            soundsRef.current.clear()
        }
    }, [])

    // 背景音樂控制（淡入淡出）
    const playAmbient = useCallback(() => {
        if (!isReady) return
        const ambient = soundsRef.current.get('ambient')
        if (ambient && !ambient.playing()) {
            ambient.volume(0)
            ambient.play()
            ambient.fade(0, 0.05, 3000)  // 3秒淡入到 5% 音量
        }
    }, [isReady])

    const stopAmbient = useCallback(() => {
        const ambient = soundsRef.current.get('ambient')
        if (ambient && ambient.playing()) {
            ambient.fade(ambient.volume(), 0, 2000)  // 2秒淡出
            setTimeout(() => ambient.stop(), 2000)
        }
    }, [])

    // 背景音樂開關控制
    useEffect(() => {
        if (!isReady) return
        if (isMusicPlaying) {
            playAmbient()
        } else {
            stopAmbient()
        }
    }, [isMusicPlaying, isReady, playAmbient, stopAmbient])

    const toggleMusic = useCallback(() => {
        setIsMusicPlaying(prev => !prev)
    }, [])

    // 播放音效（只要用戶有互動過就可以播放，不受背景音樂開關影響）
    const playSound = useCallback((soundName: string) => {
        // 不播放 ambient（由 toggleMusic 控制）
        if (soundName === 'ambient') return
        if (!isReady || !userInteracted) return

        const sound = soundsRef.current.get(soundName)
        if (sound) {
            sound.play()
        }
    }, [isReady, userInteracted])

    const setVolume = useCallback((newVolume: number) => {
        setVolumeState(Math.max(0, Math.min(1, newVolume)))
    }, [])

    return (
        <AudioContext.Provider value={{
            isMusicPlaying,
            toggleMusic,
            playSound,
            setVolume,
            volume
        }}>
            {children}
        </AudioContext.Provider>
    )
}

