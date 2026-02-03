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
            position: { x: '70%', y: '25%' }
        },
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
            position: { x: '75%', y: '45%' }
        },
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
            position: { x: '80%', y: '55%' }
        },
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
            position: { x: '25%', y: '30%' }
        },
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
            position: { x: '20%', y: '50%' }
        },
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
            position: { x: '70%', y: '35%' }
        },
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
