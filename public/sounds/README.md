# 🔊 Sound Effects

## 音效系統說明

此專案使用 Howler.js 實現音效系統，音效與背景音樂分開控制。

## 目前配置的音效

| 檔案名 | 音效名稱 | 用途 | 觸發時機 |
|--------|----------|------|----------|
| `ui-hover.wav` | hover | 按鈕 hover | 滑鼠移過按鈕 |
| `ui-click.wav` | click | 按鈕點擊 | 點擊按鈕 |
| `system-boot.wav` | initialize | 系統啟動 | 點擊 INITIALIZE 按鈕 |
| `hologram.wav` | hologram | 全息投影 | 投影開始時 |
| `callout.wav` | callout | 功能說明 | Callout 出現時 |
| `whoosh.wav` | whoosh | 過渡音效 | 導航切換時 |
| `tunnel.wav` | portal | 隧道傳送 | 進入 Portal 階段 |
| `water-swish.wav` | fluidSwish | 液態互動 | 滾動時滑鼠移動在液態區 |
| `ambient.mp3` | ambient | 背景音樂 | 由右上角按鈕控制 |

## 音效配置參數

```typescript
const soundConfig = {
    hover: { src: '/sounds/ui-hover.wav', volume: 0.25 },
    click: { src: '/sounds/ui-click.wav', volume: 0.3 },
    initialize: { src: '/sounds/system-boot.wav', volume: 0.4 },
    hologram: { src: '/sounds/hologram.wav', volume: 0.35 },
    callout: { src: '/sounds/callout.wav', volume: 0.3 },
    whoosh: { src: '/sounds/whoosh.wav', volume: 0.35 },
    portal: { src: '/sounds/tunnel.wav', volume: 0.4 },
    fluidSwish: { src: '/sounds/water-swish.wav', volume: 0.35, rate: 0.55 },
    ambient: { src: '/sounds/ambient.mp3', volume: 0.1, loop: true },
}
```

## 控制邏輯

- **音效 (SFX)** - 預設開啟，只要有任何用戶互動後即可播放
- **背景音樂** - 預設關閉，由右上角 🎵 按鈕控制

## 免費音效來源

1. **Mixkit** - https://mixkit.co/free-sound-effects/
2. **Freesound** - https://freesound.org
3. **Pixabay** - https://pixabay.com/sound-effects/

## 新增音效步驟

1. 在 `soundConfig` 中新增設定
2. 將音效檔放入 `public/sounds/`
3. 在對應組件中呼叫 `playSound('soundName')`
