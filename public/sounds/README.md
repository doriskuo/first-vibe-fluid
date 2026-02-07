# 🔊 Sound Files Guide

## 音效檔案目錄

音效檔案應放在 `public/sounds/` 目錄下。

## 需要的音效檔案

| 檔案名 | 用途 | 建議來源 |
|--------|------|----------|
| `ui-hover.mp3` | 按鈕 hover 音效 | 嗶聲/科幻 UI 音 |
| `ui-click.mp3` | 按鈕點擊音效 | 確認音/選擇音 |
| `system-boot.mp3` | INITIALIZE 按鈕音效 | 系統啟動音 |
| `morph.mp3` | 形變轉換音效 | 變形/過渡音 |
| `hologram.mp3` | 全息投影音效 | 能量/投影音 |
| `whoosh.mp3` | 快速移動音效 | 風聲/加速音 |
| `ambient-cyber.mp3` | 背景環境音（可選） | 賽博朋克氛圍 |

## 免費音效來源

1. **Freesound** - https://freesound.org
   - 搜尋 "sci-fi UI", "cyberpunk", "hologram"
   - 需要註冊帳號

2. **Mixkit** - https://mixkit.co/free-sound-effects/
   - 搜尋 "technology", "sci-fi", "interface"
   - 免費商用

3. **Pixabay** - https://pixabay.com/sound-effects/
   - 搜尋 "futuristic", "interface", "beep"
   - CC0 授權

## 下載後處理

1. 將音效轉換為 MP3 格式
2. 建議音效長度：UI 音效 < 1 秒，過渡音效 1-3 秒
3. 重新命名為上表的檔案名
4. 放入 `public/sounds/` 目錄

## 測試

1. 重啟開發伺服器
2. 點擊右下角 🔊 開啟音效
3. 移動滑鼠、點擊按鈕測試
