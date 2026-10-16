# plugin-example

uiauto.dev 插件接口示例。基于 Preact + TypeScript + Tailwind CSS，用一个多标签页面演示平台提供给插件的全部 API（`$u`）。

## 功能演示

页面顶部按接口分区，每个标签对应一类能力：

| 标签  | 演示的 API                                                              |
| ----- | ----------------------------------------------------------------------- |
| 信息  | `$u.deviceId`、`$u.plugin`                                              |
| Shell | `$u.shell({ command, timeoutMs })`                                      |
| 按键  | `$u.pressKey(key, metaState?)`                                          |
| 输入  | `$u.inputText(text)`                                                    |
| 点击  | `$u.tap(x, y, screenWidth, screenHeight)`                               |
| 画面  | `$u.screenshotAsBase64()`、`$u.setScreenImage(Blob \| null)`            |
| 交互  | `$u.onScreenTap`、`$u.setMode`、`$u.onModeChange`                       |
| Fetch | `$u.fetch(url, init?)`（需在 `plugin.json` 配置 `allowed_hosts`）       |
| AI    | `$u.openai({ messages, stream })`，支持流式与一次性返回                 |
| Jev   | `$u.jev({ state, questions, model? })`，结构化决策（noul/choice/score） |

## 快速开始

```bash
npm install          # 安装依赖
npm run fetch-types  # 从 uiauto.dev 运行时拉取 plugin-runtime.d.ts
npm run dev          # 开发模式，监听 app.tsx 与 styles.css 自动编译
```

## 项目结构

```
├── plugin.json          # 插件元信息（名称、版本、描述、allowed_hosts）
├── app.tsx              # 插件逻辑入口（开发这个文件）
├── index.html           # 插件 UI 入口
├── styles.css           # Tailwind 样式源文件
├── tailwind.config.js   # Tailwind 配置（含 darkMode: 'class'）
├── app.js               # 编译产物（由 app.tsx 打包，已 gitignore）
├── app.css              # 编译产物（由 styles.css 生成，已 gitignore）
├── plugin-runtime.d.ts  # 平台 API 类型定义（fetch-types 拉取，已 gitignore）
└── CLAUDE.md            # AI 开发指引
```

## 可用 API

通过全局变量 `$u` 访问平台 API（完整签名见 `plugin-runtime.d.ts`）：

```typescript
// 执行 shell 命令
const r = await $u.shell({ command: 'getprop ro.product.model', timeoutMs: 10000 });
console.log(r.output);

// 设备与插件信息
console.log($u.deviceId, $u.plugin.name);

// 按键 / 输入 / 点击
await $u.pressKey('home');
await $u.inputText('hello');
await $u.tap(540, 1200, 1080, 2400); // x, y, screenWidth, screenHeight

// 截屏（返回 data:image/png;base64,...）
const base64 = await $u.screenshotAsBase64();
await $u.setScreenImage(blob); // 冻结画面，传 null 恢复

// 订阅屏幕点击 / 切换屏幕模式
const offTap = $u.onScreenTap((e) => console.log(e.x, e.y, e.screenWidth, e.screenHeight));
const offMode = $u.onModeChange((mode) => console.log(mode)); // control / readonly / recording
await $u.setMode(ScreenModes.Recording);

// 代理请求（绕过 CORS，需在 plugin.json 的 allowed_hosts 中声明域名）
const res = await $u.fetch('https://httpbin.org/get');

// 调用 OpenAI 兼容接口
const result = await $u.openai({ messages: [{ role: 'user', content: '你好' }], stream: true });

// 调用 Jev 决策接口（TypeSafe System One），返回结构化 answers
const decision = await $u.jev({
  state: '用户请求删除一条消息',
  questions: {
    is_safe: { type: 'noul', instructions: '是否安全？' },
    urgency: { type: 'choice', instructions: '紧急程度', criteria: { low: '稍后', high: '立即' } },
    risk: { type: 'score', instructions: '风险等级', criteria: ['很低', '低', '中', '高', '很高'] },
  },
});
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

之后每次 `git commit` 都会自动格式化改动文件。

## 技术栈

- **Preact** — 轻量 UI 框架
- **TypeScript** — 类型安全
- **Tailwind CSS** — v3，由 `tailwindcss` CLI 编译 `styles.css` 生成 `app.css`。`darkMode: 'class'` 跟随 `html.dark`，默认颜色用语义化 CSS 变量（`background`/`foreground`/`primary`）自动切换明暗
- **lucide-preact** — 图标库
- **esbuild** — 快速编译打包
