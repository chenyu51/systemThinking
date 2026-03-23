# SystemCanvas

轻量级系统思维可视化 Chrome 扩展，用来绘制因果回路图、系统循环图、简单思维结构图。

当前版本已经支持：
- 节点、连线、独立文本的创建与编辑
- 画布拖拽、滚轮缩放、模板居中加载
- 本地保存、模板保存、导出 PNG/SVG/JSON
- 中英文切换
- AI 配置与 AI 辅助生成节点/连线建议

## 当前目录结构

```text
SystemCanvas/
├── manifest.json
├── background.js
├── assets/
├── popup/
│   ├── popup.html
│   └── popup.js
├── panel/
│   └── index.html
├── modules/
│   ├── ai/
│   │   ├── assistant.js
│   │   └── config.js
│   ├── canvas/
│   │   ├── core.js
│   │   ├── events.js
│   │   ├── operations.js
│   │   ├── properties.js
│   │   ├── render.js
│   │   └── view.js
│   ├── data/
│   │   ├── archetypes.js
│   │   └── store.js
│   ├── i18n/
│   │   ├── index.js
│   │   └── messages.js
│   ├── loader/
│   │   ├── index.js
│   │   └── manifest.js
│   ├── models/
│   │   ├── edge.js
│   │   ├── node.js
│   │   └── text.js
│   └── panel/
│       ├── actions.js
│       ├── index.js
│       └── menus.js
├── AGENTS.md
└── README.md
```

## 模块职责

### `panel/`

- `panel/index.html`
  - 主画布页面入口
  - 提供页面 DOM 结构
  - 通过 loader 装配业务模块

### `modules/canvas/`

- `core.js`
  - 画布核心类
  - 初始化入口
- `events.js`
  - 画布和工具交互事件
- `operations.js`
  - 节点、边、文本的增删改查
  - 撤销 / 重做
- `render.js`
  - SVG 渲染
  - 节点、边、文本绘制
- `properties.js`
  - 右侧属性面板联动
- `view.js`
  - 缩放、平移、居中、视口同步、状态栏更新

### `modules/panel/`

- `actions.js`
  - 顶部按钮动作
  - 新建、打开、保存、模板加载、导出等
- `menus.js`
  - 导出菜单、已保存菜单、设置菜单、模板菜单
- `index.js`
  - 顶部按钮和左侧工具绑定入口

### `modules/models/`

- `node.js`
  - 节点模型与 SVG 输出
- `edge.js`
  - 连线模型与 SVG 输出
- `text.js`
  - 独立文本模型与 SVG 输出

### `modules/data/`

- `store.js`
  - Chrome Storage 持久化
  - 快照、模板、本地配置读写
- `archetypes.js`
  - 内置模板数据

### `modules/i18n/`

- `messages.js`
  - 中英文文案
- `index.js`
  - 翻译、语言切换、文案应用

### `modules/ai/`

- `config.js`
  - AI 接口地址、API Key、模型配置读写
- `assistant.js`
  - 调用 AI 接口
  - 生成节点/连线建议
  - 一键写入当前画布

### `modules/loader/`

- `manifest.js`
  - 模块加载清单
- `index.js`
  - 页面启动时按顺序加载各模块

## 当前加载顺序

`panel/index.html` 会先加载：

1. `modules/loader/manifest.js`
2. `modules/loader/index.js`

然后 loader 再按顺序加载：

1. `modules/i18n`
2. `modules/data`
3. `modules/models`
4. `modules/canvas`
5. `modules/ai`
6. `modules/panel`

最后调用 `initializeCanvasApp()` 完成启动。

## 已实现功能

### 画布与编辑

- 选择工具、添加节点、绘制连线、添加独立文本
- 节点拖拽
- 画布拖拽
- 鼠标位置为中心的滚轮缩放
- 节点、连线、文本的属性编辑
- Delete / Backspace 删除选中元素
- 撤销 / 重做

### 节点与连线

- 节点类型：变量、存量、流量
- 节点形状：矩形、圆形、菱形
- 连线类型：正反馈、负反馈、中立
- 多条边自动分离弧度
- 边标签与 `+/-` 同时展示
- 从节点四周链接桩发起连线

### 模板与本地数据

- 本地保存画布
- 已保存列表查看、加载、删除
- 保存为模板
- 模板加载后自动居中
- 当前画布来自模板时，右侧面板显示模板名称和说明

### 导出与国际化

- 导出 PNG / SVG / JSON
- 中英文切换
- 语言设置持久化

### AI 辅助

- 设置菜单中配置：
  - 接口地址
  - API Key
  - 模型
- 顶部工具栏打开 `AI 辅助`
- 输入需求后生成节点与连线建议
- 一键写入当前画布

## 安装与运行

### 本地加载扩展

1. 打开 Chrome
2. 进入 `chrome://extensions/`
3. 打开右上角开发者模式
4. 点击“加载已解压的扩展程序”
5. 选择当前项目目录

### 打开主画布

1. 点击浏览器工具栏扩展图标
2. 在弹窗中选择新建或打开最近的画布
3. 主画布页面会打开 `panel/index.html`

## AI 配置说明

AI 辅助当前通过自定义接口地址接入，你需要在界面里自行配置：

- 接口地址
  - 例如 OpenAI 兼容接口可填写 `https://api.openai.com/v1/chat/completions`
- API Key
- 模型
  - 例如 `gpt-4o-mini`

配置入口：

1. 打开主画布
2. 点击右上角 `设置`
3. 在 `AI 配置` 区域填写并保存

## 快捷键

| 快捷键 | 功能 |
|---|---|
| `Delete` | 删除选中元素 |
| `Backspace` | 删除选中元素 |
| `Ctrl/⌘ + Z` | 撤销 |
| `Ctrl/⌘ + Y` | 重做 |
| `Ctrl/⌘ + S` | 保存 |

## 数据模型摘要

### 节点

```js
{
  id: "node_xxx",
  type: "variable",
  label: "用户增长",
  x: 100,
  y: 200,
  shape: "rectangle",
  color: "#4A90E2",
  width: 120,
  height: 60
}
```

### 连线

```js
{
  id: "edge_xxx",
  source: "node_1",
  target: "node_2",
  type: "positive",
  hasDelay: false,
  label: "促进",
  color: "#27AE60"
}
```

### 文本

```js
{
  id: "text_xxx",
  text: "说明",
  x: 300,
  y: 240,
  color: "#333333",
  fontSize: 24
}
```

## 开发约束

- 源码模块统一放在 `modules/`
- 尽量将单文件控制在 300 行以内
- 文件接近上限时，优先继续拆模块，不要继续堆积职责

## 后续可继续扩展

- AI 生成结果的二次编辑和重试
- AI 对已有画布做“补全分析”
- 模板搜索与分类
- 自定义模板删除 / 重命名
- 文档同步与云端存储
