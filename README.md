# NIP 网站

围绕 NSDI '24 论文 **iStack: A General and Stateful Name-based Protocol Stack for Named Data Networking** 构建的双语站点。站点品牌名为 NIP，内容聚焦 iStack 的设计、实现与评测。

- 论文页面：<https://www.usenix.org/conference/nsdi24/presentation/li-tianlong>
- PDF：<https://www.usenix.org/system/files/nsdi24-li-tianlong.pdf>

## 技术栈

- Nuxt 4（Vue 3、Nitro）
- Nuxt UI 4 + Tailwind CSS 4
- @nuxtjs/i18n 10（中文默认，英文使用 `/en` 前缀）
- Notion API（`@notionhq/client`、`notion-to-md`、`marked`）
- Cloudflare Workers + Wrangler
- Cloudflare KV（Notion 内容缓存）
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
Copy-Item .env.example .env
# 在 .env 中填写 NOTION_API_KEY、NOTION_DOCS_DATA_SOURCE_ID、NOTION_BLOG_DATA_SOURCE_ID
pnpm dev
```

打开 <http://localhost:3000>。

Notion 内容在开发环境下使用进程内缓存；生产环境使用 Cloudflare KV。

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
pnpm preview:worker
```

构建目标是 Cloudflare Workers（`cloudflare_module`），产物位于 `.output/`。

本地使用 Worker 运行时预览：

```powershell
Copy-Item .dev.vars.example .dev.vars
# 在 .dev.vars 中填写 Notion 配置
pnpm preview:worker
```

## 目录结构

```text
app/
  assets/css/main.css       全局样式与 Markdown 正文排版
  components/               站点头部、页脚、语言切换与首页图形组件
  composables/useContent.ts  Notion 内容列表/详情请求封装
  layouts/default.vue       默认布局
  pages/
    index.vue               首页
    docs/index.vue          文档列表
    docs/[...slug].vue      文档详情
    blog/index.vue          博客列表
    blog/[...slug].vue      博客详情
  utils/site.ts             论文等外部链接常量
server/
  api/content/              Notion 内容 API（列表、详情、缓存失效）
  utils/notion-content.ts   Notion 查询、Markdown 转换与 KV 缓存
shared/types/content.ts     API 数据结构
scripts/setup-notion.mjs    创建字段并迁移 Markdown 到 Notion
.env.example                Node 开发环境变量示例
.dev.vars.example           Wrangler 本地环境变量示例
wrangler.jsonc              Worker、KV 与 nip.notfatdog.com 配置
i18n/locales/
  zh.json                   中文界面文案
  en.json                   英文界面文案
nuxt.config.ts              Nuxt 模块、i18n 与 Cloudflare preset
```

## Notion 内容模型

运行时内容来自两个 Notion 数据库。请在 Notion 中创建数据库，并把它们共享给同一个 Notion Integration。

### Docs 数据库

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Name` | Title | 文档标题 |
| `Slug` | Rich text | URL slug，例如 `getting-started` |
| `Description` | Rich text | 列表摘要 |
| `Locale` | Select | `zh` 或 `en` |
| `Order` | Number | 侧边栏排序 |
| `Published` | Checkbox | 未勾选的内容不会返回 |

### Blog 数据库

| 属性 | 类型 | 说明 |
| --- | --- | --- |
| `Name` | Title | 文章标题 |
| `Slug` | Rich text | URL slug |
| `Description` | Rich text | 列表摘要 |
| `Locale` | Select | `zh` 或 `en` |
| `Date` | Date | 发布日期 |
| `Tags` | Multi-select | 文章标签 |
| `Published` | Checkbox | 未勾选的内容不会返回 |

每个数据库页面的正文就是文档/博客内容。`notion-to-md` 会递归读取页面块并转成 Markdown，再由 `marked` 渲染为 HTML。

当前数据库的 title 属性是 `名称`，代码会自动识别任意 title 属性；其余字段默认使用上表中的英文名称。

默认属性名就是上表列出的名称。如果实际名称不同，可以在 `.env` 或 `.dev.vars` 中覆盖，例如：

```dotenv
NOTION_TITLE_PROPERTY=Title
NOTION_SLUG_PROPERTY=Slug
NOTION_DESCRIPTION_PROPERTY=Summary
NOTION_LOCALE_PROPERTY=Language
NOTION_ORDER_PROPERTY=Order
NOTION_DATE_PROPERTY=Date
NOTION_TAGS_PROPERTY=Tags
NOTION_PUBLISHED_PROPERTY=Published
NOTION_DEFAULT_LOCALE=zh
```

如果数据库没有 `Slug`，会先尝试从标题生成；中文标题通常无法生成稳定 slug，因此建议显式填写。标题属性可以是任意名称，代码会回退到数据库的 title 属性。

如果要从仓库中的旧 Markdown 初始化 Notion，运行：

```powershell
pnpm setup:notion
```

该脚本会补齐缺失字段、跳过已存在的同 `Locale + Slug` 页面，并创建新页面。当前仓库内容已经迁移完成，`content/` 已移除；脚本保留用于以后恢复旧 Markdown 或重新导入时使用。


## Cloudflare 部署

`wrangler.jsonc` 已配置：

- Worker 名称：`nip-website`
- KV binding：`NIP_CACHE`
- Custom Domain：`nip.notfatdog.com`

首次部署：

```powershell
conda activate nip-website
pnpm install

# 创建 KV namespace，把返回的 id 填到 wrangler.jsonc
pnpm exec wrangler kv namespace create NIP_CACHE

# 不要把 token 写进代码仓库
pnpm exec wrangler secret put NOTION_API_KEY
# 优先使用 data source ID；没有 data source ID 时才使用 database ID
pnpm exec wrangler secret put NOTION_DOCS_DATA_SOURCE_ID
pnpm exec wrangler secret put NOTION_BLOG_DATA_SOURCE_ID

# pnpm deploy 是 pnpm 自带命令，不能直接执行 npm script
pnpm run deploy:worker
```

`nip.notfatdog.com` 必须位于同一个 Cloudflare 账户的 `notfatdog.com` zone 下。部署后 Cloudflare 会自动创建 DNS 记录并签发证书，不需要手动上传证书。

如果 `nip` 子域已有 CNAME 或其他记录，请先处理记录冲突。

## 缓存与失效

- 列表缓存：5 分钟
- 详情缓存：1 小时
- 生产环境使用 KV binding `NIP_CACHE`；Node 开发环境使用进程内缓存
- 所有缓存键以 `nip:v1:` 开头

手动清理缓存：

```powershell
$token = $env:NIP_REVALIDATE_TOKEN
Invoke-RestMethod -Method Post `
  -Uri https://nip.notfatdog.com/api/content/revalidate `
  -Headers @{ 'x-revalidate-token' = $token }
```

需要在 Cloudflare 中配置 `NIP_REVALIDATE_TOKEN` secret 才能使用该接口。

Notion 托管的图片 URL 有时效性；详情缓存为 1 小时，如果图片在缓存末尾失效，可以缩短详情缓存 TTL，或后续增加图片代理。

## 说明

站点内容目前基于论文摘要整理，技术细节以论文原文为准。论文与 PDF 链接集中在 `app/utils/site.ts`。

## 首页设计

首页参考 [Named Data Networking](https://named-data.net/) 的编辑式排版：白底、黑色正文、橙色强调色与紧凑的大写标题。品牌主色使用 `#fd7800`，与 iStack 的论文气质和 NDN 项目的视觉语言保持一致。

- `app/pages/index.vue` 负责 landing 页面的内容编排，包括论文摘要、指标、四条研究支柱、内核数据路径、评测与内容入口。
- `app/components/LandingFeatureVisual.vue` 使用静态 SVG 绘制四组研究视觉：内核栈、名字前缀树、双层 face 与评测柱状图。
- `app/components/LandingStackDiagram.vue` 绘制 iStack 的静态数据平面示意。
- 页面不包含任何动态背景、Canvas 动画或 WebGL 渲染；所有图形均为静态 SVG/CSS。

