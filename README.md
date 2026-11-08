# NIP 网站

围绕 NSDI '24 论文 **iStack: A General and Stateful Name-based Protocol Stack for Named Data Networking** 构建的双语站点。站点品牌名为 NIP，内容聚焦 iStack 的设计、实现与评测。

- 论文页面：<https://www.usenix.org/conference/nsdi24/presentation/li-tianlong>
- PDF：<https://www.usenix.org/system/files/nsdi24-li-tianlong.pdf>

## 技术栈

- Nuxt 4（Vue 3、Nitro）
- Nuxt UI 4 + Tailwind CSS 4
- Nuxt Content 3（Markdown 内容）
- @nuxtjs/i18n 10（中文默认，英文使用 `/en` 前缀）
- pnpm 12 + Node.js 24（安装在 conda 环境中）

## 开发环境

项目使用 conda 环境 `nip-website`，其中安装了 Node.js 24 与 pnpm，并写入了代理环境变量：

| 变量 | 值 |
| --- | --- |
| `HTTP_PROXY` | `http://127.0.0.1:7890` |
| `HTTPS_PROXY` | `http://127.0.0.1:7890` |
| `NO_PROXY` | `localhost` |

```powershell
conda activate nip-website
pnpm install
pnpm dev
```

打开 <http://localhost:3000>。

如果代理不可用，可以临时清除环境变量后再运行：

```powershell
conda env config vars unset -n nip-website HTTP_PROXY HTTPS_PROXY
conda deactivate
conda activate nip-website
```

## 构建与预览

```powershell
conda activate nip-website
pnpm build
pnpm preview
```

默认产物为 Node 服务器（`.output/server/index.mjs`），也可以接入任意支持 Nitro 的部署平台。

## 目录结构

```text
app/
  assets/css/main.css       全局样式与 Markdown 正文排版
  components/               站点头部、页脚、语言切换与首页图形组件
  layouts/default.vue       默认布局
  pages/
    index.vue               首页
    docs/index.vue          文档列表
    docs/[...slug].vue      文档详情
    blog/index.vue          博客列表
    blog/[...slug].vue      博客详情
  utils/site.ts             论文等外部链接常量
content/
  docs/zh/*.md              中文文档
  docs/en/*.md              英文文档
  blog/zh/*.md              中文博客
  blog/en/*.md              英文博客
i18n/locales/
  zh.json                   中文界面文案
  en.json                   英文界面文案
content.config.ts           Nuxt Content 集合定义
nuxt.config.ts              Nuxt 模块与 i18n 配置
```

## 添加内容

### 文档

在 `content/docs/zh/<slug>.md` 与 `content/docs/en/<slug>.md` 中各创建一份：

```md
---
title: 标题
description: 一句话摘要
order: 4
---

正文……
```

`order` 决定侧边栏排序。

### 博客

在 `content/blog/zh/<slug>.md` 与 `content/blog/en/<slug>.md` 中各创建一份：

```md
---
title: 标题
description: 一句话摘要
date: '2026-11-02'
tags:
  - NDN
---

正文……
```

### 界面文案

`i18n/locales/zh.json` 与 `en.json` 保存导航、首页、页脚等文案，键名保持一致。

## 说明

站点内容目前基于论文摘要整理，技术细节以论文原文为准。论文与 PDF 链接集中在 `app/utils/site.ts`。

## 首页设计

首页参考 [Named Data Networking](https://named-data.net/) 的编辑式排版：白底、黑色正文、橙色强调色与紧凑的大写标题。品牌主色使用 `#fd7800`，与 iStack 的论文气质和 NDN 项目的视觉语言保持一致。

- `app/pages/index.vue` 负责 landing 页面的内容编排，包括论文摘要、指标、四条研究支柱、内核数据路径、评测与内容入口。
- `app/components/LandingFeatureVisual.vue` 使用静态 SVG 绘制四组研究视觉：内核栈、名字前缀树、双层 face 与评测柱状图。
- `app/components/LandingStackDiagram.vue` 绘制 iStack 的静态数据平面示意。
- 页面不包含任何动态背景、Canvas 动画或 WebGL 渲染；所有图形均为静态 SVG/CSS。

