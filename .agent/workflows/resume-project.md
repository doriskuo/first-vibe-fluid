---
description: Resume project development after AI session restart
---

# AI 专案恢复流程

## 执行步骤

### Step 1: 读取开发者设定
// turbo
cat docs/_developer/Doris.md

### Step 2: 读取开发流程 SOP
// turbo
cat docs/_templates/01_開發流程SOP_workflow.md

### Step 3: 读取专案状态
// turbo
cat docs/projects/*/進度追蹤_progress.md

### Step 4: 读取开发纪录
// turbo
tail -100 docs/projects/*/開發紀錄_dev_log.md

### Step 5: 读取经验教训
// turbo
cat docs/projects/*/經驗教訓_lessons.md 2>/dev/null || echo "尚无经验教训记录"

### Step 6: 读取相关技术知识
// turbo
if grep -q "framer-motion" package.json 2>/dev/null; then cat docs/_knowledge/libraries/framer-motion.md 2>/dev/null || true; fi

### Step 6.5: 检查最近错误记录
// turbo
echo "=== 检查未解决错误 ===" && tail -50 docs/projects/*/經驗教訓_lessons.md 2>/dev/null | grep -A 10 "最終解決：未解決\|進行中\|Level 3" || echo "无未解决错误"

### Step 7: 检查程式码版本
// turbo
git log -5 --oneline --decorate

### Step 8: 向使用者报告
⚠️ 必须通知使用者当前状态并等待指示
