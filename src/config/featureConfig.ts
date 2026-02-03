/**
 * Feature Morph Configuration
 * 定義 VR 耳機旋轉展示的各個特寫點
 */

export interface FeaturePoint {
    id: string
    name: string
    rotationY: number      // 目標 Y 軸旋轉角度 (rad)
    zoomScale: number      // 縮放比例 (1.0 = 原始)
    callout: {
        title: string
        value: string
        description?: string
        position: { x: string, y: string }  // CSS position
    }
    targetPoint: { x: string, y: string }  // 連結線起始點 (VR 耳機上的目標區域)
    progress: [number, number]  // [開始進度, 結束進度] (0-1)
}

// 6 個特寫點，平均分配進度
export const featurePoints: FeaturePoint[] = [
    {
        id: 'lens',
        name: '鏡片',
        rotationY: 0,                    // 正面
        zoomScale: 1.3,
        callout: {
            title: 'RETINA TRACKING',
            value: 'ACTIVE',
            description: 'Eye movement detection',
            position: { x: '82%', y: '35%' }
        },
        targetPoint: { x: '55%', y: '45%' },  // VR 正面鏡片位置
        progress: [0, 0.167]
    },
    {
        id: 'rightEar',
        name: '右耳罩',
        rotationY: Math.PI / 3,          // 60°
        zoomScale: 1.2,
        callout: {
            title: 'SPATIAL AUDIO',
            value: '3D ENABLED',
            description: '360° surround sound',
            position: { x: '85%', y: '50%' }
        },
        targetPoint: { x: '60%', y: '48%' },  // 右側耳罩
        progress: [0.167, 0.333]
    },
    {
        id: 'sideButton',
        name: '側邊按鈕',
        rotationY: Math.PI / 2,          // 90°
        zoomScale: 1.4,
        callout: {
            title: 'HAPTIC CONTROLS',
            value: 'RESPONSIVE',
            description: 'Touch-sensitive interface',
            position: { x: '85%', y: '55%' }
        },
        targetPoint: { x: '62%', y: '50%' },  // 右側邊按鈕
        progress: [0.333, 0.5]
    },
    {
        id: 'headband',
        name: '頭帶',
        rotationY: Math.PI,              // 180° (背面)
        zoomScale: 1.1,
        callout: {
            title: 'ADAPTIVE FIT',
            value: 'AUTO-ADJUST',
            description: 'Pressure distribution',
            position: { x: '15%', y: '35%' }
        },
        targetPoint: { x: '45%', y: '42%' },  // 頭頂頭帶
        progress: [0.5, 0.667]
    },
    {
        id: 'leftEar',
        name: '左耳罩',
        rotationY: Math.PI * 1.5,        // 270°
        zoomScale: 1.2,
        callout: {
            title: 'NOISE CANCEL',
            value: 'ACTIVE',
            description: '-40dB ambient noise',
            position: { x: '15%', y: '50%' }
        },
        targetPoint: { x: '40%', y: '48%' },  // 左側耳罩
        progress: [0.667, 0.833]
    },
    {
        id: 'frontFinal',
        name: '正面完成',
        rotationY: Math.PI * 2,          // 360° (回到正面)
        zoomScale: 1.0,
        callout: {
            title: 'SYSTEM STATUS',
            value: 'READY',
            description: 'All systems online',
            position: { x: '75%', y: '40%' }
        },
        targetPoint: { x: '50%', y: '50%' },  // 中心位置
        progress: [0.833, 1.0]
    },
]

/**
 * 根據進度獲取當前特寫點
 */
export function getCurrentFeature(progress: number): FeaturePoint | null {
    // Clamp progress to 0-1
    const p = Math.max(0, Math.min(1, progress))

    for (const feature of featurePoints) {
        if (p >= feature.progress[0] && p < feature.progress[1]) {
            return feature
        }
    }

    // 最後一個特寫點包含結尾
    if (p >= 0.833) {
        return featurePoints[featurePoints.length - 1]
    }

    return null
}

/**
 * 計算兩個特寫點之間的過渡
 */
export function getFeatureTransition(progress: number): {
    current: FeaturePoint | null
    next: FeaturePoint | null
    blend: number  // 0 = current, 1 = next
} {
    const p = Math.max(0, Math.min(1, progress))

    for (let i = 0; i < featurePoints.length; i++) {
        const feature = featurePoints[i]
        if (p >= feature.progress[0] && p < feature.progress[1]) {
            const localProgress = (p - feature.progress[0]) / (feature.progress[1] - feature.progress[0])
            return {
                current: feature,
                next: featurePoints[i + 1] || null,
                blend: localProgress
            }
        }
    }

    return { current: null, next: null, blend: 0 }
}

/**
 * 計算說明框的顯示狀態（含過渡區）
 * 
 * 每個 feature 的進度範圍分為三個階段（時間統一）：
 * - 進場區 (15%): 說明框進場動畫
 * - 顯示區 (60%): 說明框完全可見，VR 停頓
 * - 退場區 (25%): 說明框退場動畫 + VR 開始旋轉
 */
export function getCalloutVisibility(progress: number): {
    feature: FeaturePoint | null
    visible: boolean
    phase: 'entering' | 'visible' | 'exiting' | 'hidden'
    localProgress: number  // 0-1 within current feature
} {
    const p = Math.max(0, Math.min(1, progress))

    // 定義統一的過渡區比例 (所有說明框都用這個)
    // 增加 visible 區讓使用者有更多時間閱讀
    const enterZone = 0.15   // 15% 用於進場動畫
    const exitZone = 0.25    // 25% 用於退場動畫
    const visibleZone = 1 - enterZone - exitZone  // 60% 完全可見 + VR 停頓

    for (let i = 0; i < featurePoints.length; i++) {
        const feature = featurePoints[i]
        const [start, end] = feature.progress

        if (p >= start && p < end) {
            const featureDuration = end - start
            const localProgress = (p - start) / featureDuration

            if (localProgress < enterZone) {
                // 進場區：說明框正在進場
                return {
                    feature,
                    visible: true,
                    phase: 'entering',
                    localProgress
                }
            } else if (localProgress < enterZone + visibleZone) {
                // 顯示區：說明框完全可見
                return {
                    feature,
                    visible: true,
                    phase: 'visible',
                    localProgress
                }
            } else {
                // 退場區：說明框正在退場
                return {
                    feature,
                    visible: true,
                    phase: 'exiting',
                    localProgress
                }
            }
        }
    }

    // 超過最後一個 feature 的結尾 - 應該隱藏所有說明框
    // 這確保最後一個說明框也會完全退場
    if (p >= 1.0) {
        return { feature: null, visible: false, phase: 'hidden', localProgress: 1 }
    }

    // 最後一個特寫點的結尾處理 (0.833 - 1.0)
    if (p >= 0.833) {
        const feature = featurePoints[featurePoints.length - 1]
        const [start, end] = feature.progress
        const localProgress = (p - start) / (end - start)

        // 在最後階段的退場區
        if (localProgress >= enterZone + visibleZone) {
            return { feature, visible: true, phase: 'exiting', localProgress }
        } else if (localProgress >= enterZone) {
            return { feature, visible: true, phase: 'visible', localProgress }
        }
        return { feature, visible: true, phase: 'entering', localProgress }
    }

    return { feature: null, visible: false, phase: 'hidden', localProgress: 0 }
}
