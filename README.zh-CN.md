# Obsidian Table Exporter

[English](README.md) | [简体中文](README.zh-CN.md)

[![Release](https://img.shields.io/badge/release-v0.1.0-2ea44f)](https://github.com/wikty/obsidian-table-exporter/releases/tag/v0.1.0)
[![Platform](https://img.shields.io/badge/platform-Obsidian-7c3aed)](https://obsidian.md/)
[![License](https://img.shields.io/badge/license-MIT-0f172a)](LICENSE)

把 Obsidian 里已经渲染好的 Markdown 表格导出成 `PNG`、`CSV`、`Excel (.xlsx)` 和 `PDF`。

`Obsidian Table Exporter` 主要解决一个很具体的问题：表格在 Obsidian 里已经整理好了，但要把它稳定、体面地带到笔记之外，往往还得手工截图、复制或重新排版。这个插件直接基于当前笔记里的渲染结果导出，所以图片和 PDF 会更接近你在阅读视图里真正看到的样子。

## 目录

- [它适合什么场景](#它适合什么场景)
- [效果预览](#效果预览)
- [快速开始](#快速开始)
- [功能](#功能)
- [安装](#安装)
- [开发](#开发)
- [故障排查](#故障排查)
- [当前限制](#当前限制)

## 它适合什么场景

- 长表格不想再手工拼截图
- 想把表格数据直接交给 `CSV` / `Excel` 继续处理
- 想导出一个更稳定的 `PDF`，而不是依赖默认打印流程
- 一篇笔记里有多张表时，希望命中你刚刚 hover 或点击的那张

## 效果预览

### 宽表格导出为 PDF

适合需要按文档审阅、转发或归档的场景。

![宽表格 PDF 预览](docs/assets/wide-operational-table-pdf-preview.png)

### 中英混排内容

插件也针对中英文混排做了可读性验证。

![中英混排导出效果](docs/assets/mixed-language-table.png)

<details>
<summary>长表格 PNG 预览</summary>

这类长状态表、研究表通常最不适合用系统截图解决。

![长表格 PNG 预览](docs/assets/long-planning-table.png)

</details>

## 快速开始

1. 在 Obsidian 里打开阅读视图或 Live Preview。
2. 把鼠标移动到你要导出的表格上。
3. 运行 `Table Exporter: Export Markdown table as PNG / CSV / Excel / PDF`。
4. 如果是 `PNG` 或 `PDF`，可以在导出弹窗里按需调整样式和参数。
5. 到导出目录里拿结果文件。

## 功能

- 导出渲染后的 Markdown 表格为 `PNG`
- 导出表格数据为 `CSV`
- 导出表格数据为 `Excel (.xlsx)`
- 导出渲染后的 Markdown 表格为分页 `PDF`
- 支持 `Clean export` 和 `Current rendered style` 两种视觉模式
- 支持每次导出时单独调整参数
- 支持把导出的 `PNG` 直接复制到剪贴板
- 支持导出后在 Finder 中显示或直接打开文件
- 自动识别当前笔记中的多张表格
- 优先命中最近 hover 或点击的表格
- 支持把结果保存到 vault 内可配置的目录

## 典型用法

- 把产品规格、研究笔记、对比表导成图片发给别人
- 把 Markdown 表格继续交给 `Excel` 或 `Google Sheets`
- 处理 Obsidian 默认打印成 PDF 时容易出问题的长表格
- 在多表笔记里快速导出你当前真正关心的那一张

## 命令

- `Export Markdown table`
- `Export Markdown table as PNG`
- `Export Markdown table as PNG and copy to clipboard`
- `Export Markdown table as CSV`
- `Export Markdown table as Excel`
- `Export Markdown table as PDF`

## 设置项

- `Export folder`：导出文件保存目录
- `Image scale`：控制 PNG / PDF 清晰度
- `Image background`：图片导出的背景色
- `Default visual style`：默认视觉模式
- `Default post-export action`：导出后动作
- `Default copy PNG to clipboard`：是否默认复制 PNG 到剪贴板
- `PNG filename template`：支持 `{{note}}` 和 `{{index}}`
- `CSV delimiter`：逗号、分号或制表符
- `PDF page size`：`A4` 或 `Letter`
- `PDF orientation`：纵向或横向
- `PDF margin`：页边距

## 导出选项弹窗

`PNG` 和 `PDF` 会打开每次导出的配置弹窗，方便你临时调整，而不用反复改全局设置。

- `Visual style`：`Clean export` 会清理 inline code、mark 高亮和一些 Obsidian 专属视觉痕迹；`Current rendered style` 更接近当前笔记显示效果
- `Scale`：控制导出清晰度
- `Background`：设置背景色
- `PDF page size / orientation / margin`：控制 PDF 分页表现
- `After export`：导出后显示文件或直接打开
- `Copy PNG to clipboard`：导出 PNG 时可直接复制到剪贴板

## 安装

### 本地安装

1. 构建插件：

```bash
npm install
npm run build
```

2. 把下面三个文件复制到 vault 插件目录：

- `main.js`
- `manifest.json`
- `styles.css`

目标目录：

```text
<your-vault>/.obsidian/plugins/table-exporter/
```

3. 在 Obsidian 中：

- 打开 `Settings -> Community plugins`
- 如有需要，重新加载社区插件
- 启用 `Table Exporter`

### 发布包

也可以直接使用 [GitHub Releases](https://github.com/wikty/obsidian-table-exporter/releases) 里的预构建版本。

## 开发

```bash
npm install
npm run dev
```

常用检查：

```bash
npm run check
npm test
npm run build
npm run release:check
npm run package
```

项目维护文档：

- `CHANGELOG.md`
- `CONTRIBUTING.md`
- `CODE_OF_CONDUCT.md`
- `RELEASE_CHECKLIST.md`
- `SECURITY.md`

## 故障排查

- `PNG` 或 `PDF` 是空白的
  请确认使用的是最新构建。旧版本曾有克隆 DOM 渲染导致白图的问题。
- `导出的不是我想要的那张表`
  先 hover 或点击目标表格，再重新运行导出命令。
- `导出结果看起来还是太像 Obsidian`
  在导出弹窗里切换到 `Clean export`。
- `PDF 太拥挤`
  适当调大 `Margin`，或者切换方向、提高 `Scale`。
- `我需要 PDF 里的文字可选中`
  当前还不支持，现阶段 PDF 仍然是基于图像导出的。

## 技术实现

- 通过活动 `MarkdownView` 扫描当前渲染出的表格
- 视觉导出使用混合方案：
  `Clean export` 走归一化 SVG/HTML 渲染，`Current rendered style` 使用 `html2canvas` 捕获当前 DOM
- `PDF` 采用按行分页优先的策略，尽量避免在任意像素位置硬切
- 数据导出基于标准化表格矩阵，减少 `colspan` / `rowspan` 对输出形状的影响

## 当前限制

- 目前主要面向阅读视图 / 预览模式下的渲染表格，不支持直接从源码模式文本选区导出
- `PDF` 是图像型导出，因此文字不可选中
- 极大的表格仍可能受到浏览器 canvas 内存限制
- 首个版本暂不支持 Excel 公式导出

## 后续方向

- 直接导出当前选区中的表格
- 在导出弹窗里临时覆盖文件名
- 可选 HTML 导出
- 更好地处理单元格内复杂 Markdown
- 支持可选中文字的 PDF

## 链接

- 仓库：[github.com/wikty/obsidian-table-exporter](https://github.com/wikty/obsidian-table-exporter)
- 问题反馈：[github.com/wikty/obsidian-table-exporter/issues](https://github.com/wikty/obsidian-table-exporter/issues)
- 发布页：[github.com/wikty/obsidian-table-exporter/releases](https://github.com/wikty/obsidian-table-exporter/releases)

## License

MIT
