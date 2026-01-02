---
description: Initialize a new project with complete structure
---

# 新专案启动流程

> 使用者指令：「开始新专案」「初始化专案」

## Step 0: 询问专案名称
❓ 询问使用者提供专案名称

## Step 1: 检查文件范本
// turbo
if [ ! -d "docs/_templates" ]; then echo "❌ 错误：请先复制开发文件范本"; exit 1; fi
echo "✅ 文件范本已存在"

## Step 2: 建立专案文件架构
❓ 询问同意后建立 docs/projects/[专案名]/

⚠️ 完成后通知使用者

## Step 3: 建立知识库（如不存在）
❓ 询问同意后建立 docs/_knowledge/

## Step 4: 建立 AI 工具（如不存在）  
❓ 询问同意后建立 .agent/workflows/

## Step 5: 设定 .gitignore
❓ 询问同意后加入 docs/

## Step 6: 总结报告
向使用者报告所有已建立的内容
