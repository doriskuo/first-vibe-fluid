# 💧 FLUID_DYNAMIC ｜ Vibe Coding 互動式 3D 視覺體驗

🔗 **[Live Demo](https://first-vibe-fluid-doriskuos-projects.vercel.app/)**

An immersive **3D interactive web experience** built with Next.js, Three.js, and GSAP.  
以 **Vibe Coding** 理念打造的沉浸式網頁體驗，  
結合 **液態流體效果、VR 頭戴式裝置 3D 變形、賽博朋克 UI、全息投影** 等視覺元素，  
透過 **滾動驅動動畫（Scroll-Driven Animation）** 呈現完整品牌敘事旅程。

---

## 🚀 功能特色 ｜ Features

- 💧 **液態流體效果** — 使用 WebGL Shader 呈現即時互動的流體視覺
- 🎧 **3D VR 頭戴裝置** — 從水滴漸變為 VR 造型，內含機械齒輪與粒子效果
- 🌀 **隧道穿越動畫** — 沉浸式粒子隧道，模擬進入虛擬世界的體驗
- 🔮 **全息投影展示** — VR 翻轉後投射出 3D 全息圖案輪播
- 🎛️ **功能特寫 Callout** — 360° 旋轉展示 VR 各部件功能
- 🖱️ **自訂流體游標** — 虹彩光暈跟隨滑鼠，增強沉浸感
- 📱 **平滑滾動體驗** — 使用 Lenis 實現絲滑滾動
- 🎨 **賽博朋克 UI** — Glassmorphism 風格介面與動態邊框

---

## 🧩 使用技術 ｜ Tech Stack

**Framework 框架**
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS

**3D & Animation 動畫**
- Three.js + React Three Fiber
- @react-three/drei（3D 輔助元件）
- GSAP + ScrollTrigger（滾動動畫）
- Framer Motion（UI 動效）
- Lenis（平滑滾動）

**Visual Effects 視覺效果**
- Custom WebGL Shaders（自訂著色器）
- MeshTransmissionMaterial（玻璃材質）
- Particle Systems（粒子系統）

---

## ⚙️ 專案啟動方式 ｜ Installation & Setup

### 1️⃣ Clone 專案

```bash
git clone https://github.com/doriskuo/first-vibe-fluid.git
cd first-vibe-fluid
```

### 2️⃣ 安裝套件

```bash
npm install
```

### 3️⃣ 啟動開發伺服器

```bash
npm run dev
```

### 4️⃣ 開啟瀏覽器

前往 http://localhost:3000 體驗

---

## 📂 專案結構 ｜ Project Structure

```bash
first-vibe-fluid/
├── src/
│   ├── app/                 # Next.js App Router 頁面
│   ├── components/
│   │   ├── canvas/          # Three.js 3D 元件
│   │   │   ├── GlassWaterDrop.tsx    # 主要 3D 物件（水滴→VR）
│   │   │   ├── FluidBackground.tsx   # 液態背景
│   │   │   ├── HolographicProjection.tsx  # 全息投影
│   │   │   └── ...
│   │   ├── dom/             # DOM UI 元件
│   │   │   ├── CyberpunkOverlay.tsx  # 賽博朋克覆蓋層
│   │   │   ├── Navbar.tsx            # 導航列
│   │   │   ├── FinalLanding.tsx      # 產品頁
│   │   │   └── ...
│   │   └── providers/       # Context Providers
│   ├── config/              # 設定檔
│   │   └── scrollTimeline.ts  # 滾動階段配置
│   └── hooks/               # 自訂 Hooks
├── public/                  # 靜態資源
└── README.md
```

---

## 🎬 滾動旅程階段 ｜ Scroll Journey Stages

| 階段 | 名稱 | 視覺效果 |
|------|------|----------|
| 1 | Liquid | 液態流體 + 品牌文字 |
| 2 | Teardrop → Glass | 水滴成形 + 玻璃質感 |
| 3 | Shape Morph | 水滴變形為 VR 頭戴裝置 |
| 4 | Headphones | VR 完整呈現 + 齒輪動畫 |
| 5 | Cyberpunk Entry | 賽博朋克 UI + 鎖定畫面 |
| 6 | Descent | 粒子下降 + 電路板效果 |
| 7 | Portal Tunnel | 沉浸式隧道穿越 |
| 8 | Feature Showcase | 360° VR 功能展示 |
| 9 | Holographic Projection | 全息投影播放 |
| 10 | Final Landing | 產品頁 + CTA |

---

## 📜 專案亮點 ｜ Highlights

- 🌊 **Vibe Coding 理念** — 專注於視覺體驗與創意表達
- 🎨 **全程視覺敘事** — 從液態到產品的完整品牌旅程
- ⚡ **高效能 WebGL** — 60fps 流暢動畫體驗
- 🖼️ **自訂 Shader** — 獨特的視覺效果與材質
- 📱 **響應式設計** — 支援桌機與行動裝置
- 🔧 **模組化架構** — 清晰的元件結構便於維護

---

## 🔧 後續優化方向 ｜ Future Improvements

- 🎵 加入音效與背景音樂
- 📱 優化行動裝置效能
- 🌐 部署至 Vercel 正式環境
- 🧪 加入載入進度條與預載
- 🎮 更多互動元素與手勢操作

---

## 🌍 部署說明 ｜ Deployment

**Vercel（推薦）**

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 部署
vercel
```

或直接在 [Vercel Dashboard](https://vercel.com) 連接 GitHub repo 自動部署。

---

## 👩‍💻 作者 ｜ Author

**Doris Kuo**  
📧 Email: doris730105@gmail.com  
🌐 Portfolio: [https://doriskuo.github.io/](https://doriskuo.github.io/)  
💻 GitHub: [https://github.com/doriskuo](https://github.com/doriskuo)

---

## 📄 授權 ｜ License

MIT License © 2026 Doris Kuo
