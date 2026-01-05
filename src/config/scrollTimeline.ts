/**
 * 滾動時間軸配置
 * 
 * 這是整個滾動動畫的核心配置檔案。
 * 新增/修改階段只需要改這裡。
 */

export interface ScrollStage {
    name: string
    /** 滾動範圍 [start, end]，0-1 表示整個頁面 */
    scroll: [number, number]
    /** 這個階段控制的 uniform 及其映射範圍 */
    uniforms?: {
        [key: string]: [number, number]  // [startValue, endValue]
    }
    /** 進入這個階段時觸發的回調 */
    onEnter?: () => void
    /** 離開這個階段時觸發的回調 */
    onLeave?: () => void
}

export const scrollConfig = {
    /** 頁面總高度 */
    pageHeight: '1600vh',

    /** 滾動乘數：scrollValue = scrollProgress * multiplier */
    scrollMultiplier: 1.5,

    /** 各階段配置 */
    stages: [
        {
            name: 'liquid',
            scroll: [0, 0.33],
            uniforms: {
                uMorphProgress: [0, 0.5],  // 形狀開始變化
            },
        },
        {
            name: 'teardrop',
            scroll: [0.33, 0.67],
            uniforms: {
                uMorphProgress: [0.5, 1.0],  // 形狀完成
            },
        },
        {
            name: 'bounce',
            scroll: [0.67, 0.72],
            // 這個階段由 Framer Motion spring 處理
            // 不需要 uniform 映射
        },
        {
            name: 'glass',
            scroll: [0.72, 0.85],
            uniforms: {
                uMaterialProgress: [0, 0.6],  // 變透明
            },
        },
        {
            name: 'rgbGlow',
            scroll: [0.85, 1.0],
            uniforms: {
                uMaterialProgress: [0.6, 1.0],  // RGB 發光
            },
        },
    ] as ScrollStage[],
}

/**
 * 工具函數：根據滾動進度計算某個 uniform 的值
 */
export function getUniformValue(
    scrollProgress: number,
    uniformName: string
): number | null {
    for (const stage of scrollConfig.stages) {
        if (scrollProgress >= stage.scroll[0] && scrollProgress <= stage.scroll[1]) {
            const uniformRange = stage.uniforms?.[uniformName]
            if (uniformRange) {
                // 計算在這個階段內的進度
                const stageProgress = (scrollProgress - stage.scroll[0]) /
                    (stage.scroll[1] - stage.scroll[0])
                // 線性插值
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
    for (const stage of scrollConfig.stages) {
        if (scrollProgress >= stage.scroll[0] && scrollProgress <= stage.scroll[1]) {
            return stage.name
        }
    }
    return scrollProgress < 0.5 ? 'liquid' : 'rgbGlow'
}
