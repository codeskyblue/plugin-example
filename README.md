# uiautodev Preact Plugin Template

基于 Preact + TypeScript + Tailwind CSS 的 [uiauto.dev](https://github.com/nicepkg/uiautodev) 插件开发模板。内置 AI 开发引导，用 Claude Code 打开项目即可开始。

## 快速开始

### 1. 克隆模板

```bash
git clone https://github.com/uiautodev-plugins/preact-template ~/.config/uiautodev/plugins/my-plugin
cd !$
```

### 2. 安装依赖

```bash
npm install
```

### 3. 用 AI 开发插件

本项目内置了 `CLAUDE.md`，Claude Code 会自动读取其中的开发指引。

```bash
# 在项目目录下启动 Claude Code
claude
```

进入后对 AI 说 **"初始化项目"**，AI 会引导你：

1. 描述你想做的插件功能
2. 推荐插件名称
3. 自动配置 `plugin.json`
4. 拉取最新的类型定义
5. 确认方案后直接开始开发

你也可以直接告诉 AI 你想做什么，比如：

> "帮我做一个插件，点击按钮后截屏并保存到相册"

AI 会读取 `plugin-runtime.d.ts` 中的平台 API 类型，自动完成开发。

## 项目结构

```
├── plugin.json          # 插件元信息（名称、版本、描述）
├── app.tsx              # 插件逻辑入口（开发这个文件）
├── index.html           # 插件 UI 入口
├── styles.css           # Tailwind 样式源文件
├── tailwind.config.js   # Tailwind 配置（含 darkMode: 'class'）
├── app.js               # 编译产物（由 app.tsx 打包）
├── app.css              # 编译产物（由 styles.css 生成）
├── plugin-runtime.d.ts  # 平台 API 类型定义
└── CLAUDE.md            # AI 开发指引（Claude Code 自动读取）
```

## 可用 API

通过全局变量 `$u` 访问平台 API（详见 `plugin-runtime.d.ts`）：

```typescript
// 执行 shell 命令
const result = await $u.shell('getprop ro.product.model');
console.log(result.output); // 设备型号

// 当前设备 ID
console.log($u.deviceId);

// 截屏（返回 data:image/png;base64,...）
const base64 = await $u.screenshotAsBase64();

// 当前插件信息
console.log($u.plugin.name);
```

## 开发命令

```bash
npm run dev          # 开发模式，同时监听 app.tsx 与 styles.css 自动编译
npm run build        # 编译为 app.js 和 app.css
npm run build:css    # 仅重新生成 app.css
npm run format       # 使用 prettier 格式化代码
npm run fetch-types  # 拉取最新类型定义（需 uiauto.dev 运行中）
```

## 代码规范

项目使用 [pre-commit](https://pre-commit.com/) 在提交前自动运行 prettier 格式化。首次克隆后执行一次：

```bash
pre-commit install
```

之后每次 `git commit` 都会自动格式化改动文件（构建产物 `app.js`、`app.css` 已在 `.prettierignore` 中排除）。

## 技术栈

- **Preact** — 轻量 UI 框架
- **TypeScript** — 类型安全
- **Tailwind CSS** — v3，由 `tailwindcss` CLI 编译 `styles.css` 生成 `app.css`。`darkMode: 'class'` 跟随 `html.dark`，默认颜色用语义化 CSS 变量（`background`/`foreground`/`primary`）自动切换明暗
- **lucide-preact** — 图标库
- **esbuild** — 快速编译打包
