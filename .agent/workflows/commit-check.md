---
description: Pre-commit checklist and verification
---

# Commit 前检查流程

> 使用者指令：「准备 commit」「帮我 commit」

## Step 1: 检查 git status
// turbo
git status

## Step 2: 检查最近是否有 Revert 或錯誤
// turbo
git log -10 --oneline --grep="revert\|fix\|bug" -i

⚠️ 如果有 revert 或 fix commit：
- [ ] 是否已記錄到 `開發紀錄_dev_log.md`？
- [ ] 是否需要記錄到 `經驗教訓_lessons.md`？
- [ ] 錯誤原因是否已分析清楚？

## Step 3: 文件同步检查
⚠️ 提醒使用者确认：
- [ ] `進度追蹤_progress.md` 是否需要更新？
- [ ] `開發紀錄_dev_log.md` 是否需要補充今日工作？
- [ ] 有重要經驗要記錄到 `經驗教訓_lessons.md` 嗎？
- [ ] 如果修改了核心功能，`專案規格.md` 或 `技術架構.md` 需要更新嗎？

## Step 4: 代碼品質检查
⚠️ AI 自我檢查：
- [ ] 是否有未處理的 console.log 或 TODO 註解？
- [ ] 是否有未使用的 import？
- [ ] 測試過功能是否正常？

## Step 5: 询问 Commit Message
❓ 根據修改內容建議或詢問 Commit Message

**格式規範**：
- `feat: [功能描述]` - 新功能
- `fix: [問題描述]` - 修復 bug
- `refactor: [重構描述]` - 代碼重構
- `docs: [文件描述]` - 文檔更新
- `style: [樣式描述]` - 樣式調整
- `test: [測試描述]` - 測試相關

## Step 6: 执行 commit
❓ 確認後執行

## Step 7: 完成通知
⚠️ 提醒使用者：
- Commit hash 和訊息
- 是否需要 push
- 建議下一步行動
