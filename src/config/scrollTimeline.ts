/**
 * 滾動時間軸配置 (VH-Based)
 * 
 * 每個效果定義自己需要的滾動距離（vh）
 * 總頁面高度 = 所有效果的 vh 累加
 */

export interface ScrollStage {
    name: string
    /** 這個效果需要的滾動距離（vh） */
    durationVh: number
    /** 這個階段控制的 uniform 及其映射範圍 */
    uniforms?: {
        [key: string]: [number, number]
    }
}

// 每個效果的滾動距離定義
export const stages: ScrollStage[] = [
    {
        name: 'liquid',
        durationVh: 200,
        uniforms: {
            uMorphProgress: [0, 0.5],
        },
    },
    {
        name: 'teardrop',
        durationVh: 300,
        uniforms: {
            uMorphProgress: [0.5, 1.0],
        },
    },
    {
        name: 'bounce',
        durationVh: 100,
        // Framer Motion spring 處理
    },
    {
        name: 'glass',
        durationVh: 400,  // 調大這個值 = 2D 玻璃效果更長
        uniforms: {
            uMaterialProgress: [0, 0.6],
        },
    },
    {
        name: 'rgbGlow',
        durationVh: 500,  // 調大這個值 = RGB 發光效果更長
        uniforms: {
            uMaterialProgress: [0.6, 1.0],
        },
    },
    {
        name: '2dFadeout',
        durationVh: 600,  // 調大 = 淡出更慢
        uniforms: {
            u2DOpacity: [1.0, 0.0],
        },
    },
    {
        name: '3dGlass',
        durationVh: 300,
        uniforms: {
            u3DOpacity: [0.0, 1.0],
        },
    },
    {
        name: 'shapeMorph',
        durationVh: 500,  // 水滴 → VR 耳機形狀變形
        uniforms: {
            uShapeMorph: [0.0, 1.0],
        },
    },
    {
        name: 'headphones',
        durationVh: 1000,
    },
    {
        name: 'cyberpunkEntry',
        durationVh: 500, // Background turns black, UI appears, PREPARE FOR LOCK
    },
    {
        name: 'descent',
        durationVh: 1500, // Particles move UP, VR moves DOWN
    },
    {
        name: 'theaterSpace',
        durationVh: 1000, // Spherical Wireframe Grid, Space environment
    },
    {
        name: 'audioSim',
        durationVh: 1000, // Audio Visualization
    },
    {
        name: 'visualSim',
        durationVh: 1000, // Visual Visualization
    },
    {
        name: 'portal',
        durationVh: 10000, // Reduced from "infinity" but effectively 30s scroll feel
    },
]

// 自動計算總頁面高度
export const totalPageHeightVh = stages.reduce((sum, stage) => sum + stage.durationVh, 0)

// 計算每個階段的起止滾動位置 (累加)
export interface ComputedStage extends ScrollStage {
    startVh: number
    endVh: number
    startProgress: number  // 0-1 進度
    endProgress: number    // 0-1 進度
}

export const computedStages: ComputedStage[] = (() => {
    let currentVh = 0
    return stages.map(stage => {
        const startVh = currentVh
        const endVh = currentVh + stage.durationVh
        currentVh = endVh
        return {
            ...stage,
            startVh,
            endVh,
            startProgress: startVh / totalPageHeightVh,
            endProgress: endVh / totalPageHeightVh,
        }
    })
})()

// 為了向後兼容，保留 scrollConfig 格式
export const scrollConfig = {
    pageHeight: `${totalPageHeightVh}vh`,
    scrollMultiplier: totalPageHeightVh / 1000,  // 動態計算
    stages: computedStages.map(s => ({
        name: s.name,
        scroll: [s.startProgress, s.endProgress] as [number, number],
        uniforms: s.uniforms,
    })),
}

/**
 * 根據滾動進度計算某個 uniform 的值
 */
export function getUniformValue(
    scrollProgress: number,
    uniformName: string
): number | null {
    for (const stage of computedStages) {
        if (scrollProgress >= stage.startProgress && scrollProgress <= stage.endProgress) {
            const uniformRange = stage.uniforms?.[uniformName]
            if (uniformRange) {
                const stageProgress = (scrollProgress - stage.startProgress) /
                    (stage.endProgress - stage.startProgress)
                return uniformRange[0] + stageProgress * (uniformRange[1] - uniformRange[0])
            }
        }
    }
    return null
}

/**
 * 計算當前階段名稱
 */
export function getCurrentStageName(scrollProgress: number): string {
    for (const stage of computedStages) {
        if (scrollProgress >= stage.startProgress && scrollProgress <= stage.endProgress) {
            return stage.name
        }
    }
    return scrollProgress < 0.5 ? 'liquid' : '3dGlass'
}

/**
 * 獲取某個階段的信息
 */
export function getStageInfo(stageName: string): ComputedStage | undefined {
    return computedStages.find(s => s.name === stageName)
}
