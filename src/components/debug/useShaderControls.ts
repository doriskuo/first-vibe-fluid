'use client'

import { useControls, folder } from 'leva'

export interface ShaderConfig {
    // 彈跳效果
    bounceStrength: number
    bounceHorizontal: number

    // 材質轉換
    glassOpacity: number
    glassBrightness: number

    // RGB 發光
    rgbIntensity: number
    rgbPulseSpeed: number

    // 邊緣效果
    rimLightStrength: number
    darkEdgeStrength: number

    // 顏色
    cyanColor: { r: number; g: number; b: number }
    pinkColor: { r: number; g: number; b: number }
    lavenderColor: { r: number; g: number; b: number }
}

export function useShaderControls(): ShaderConfig {
    const bounce = useControls('彈跳效果', {
        bounceStrength: { value: 3.5, min: 0, max: 10, step: 0.1 },
        bounceHorizontal: { value: 0.5, min: 0, max: 2, step: 0.1 },
    })

    const material = useControls('材質轉換', {
        glassOpacity: { value: 0.65, min: 0.3, max: 1.0, step: 0.01 },
        glassBrightness: { value: 1.0, min: 0.5, max: 2.0, step: 0.05 },
    })

    const rgb = useControls('RGB 發光', {
        rgbIntensity: { value: 0.8, min: 0, max: 2, step: 0.05 },
        rgbPulseSpeed: { value: 1.0, min: 0.1, max: 3, step: 0.1 },
    })

    const edge = useControls('邊緣效果', {
        rimLightStrength: { value: 0.8, min: 0, max: 2, step: 0.05 },
        darkEdgeStrength: { value: 0.35, min: 0, max: 1, step: 0.05 },
    })

    const colors = useControls('RGB 顏色', {
        cyanColor: { value: { r: 128, g: 217, b: 255 } },
        pinkColor: { value: { r: 255, g: 140, b: 179 } },
        lavenderColor: { value: { r: 191, g: 153, b: 230 } },
    })

    return {
        ...bounce,
        ...material,
        ...rgb,
        ...edge,
        ...colors,
    }
}
