# 项目记忆

## 代码组织约束

- 尽量将每个源码文件控制在 300 行以内。
- 当文件接近上限时，优先拆分职责，不要继续堆在同一个文件里。
- 模块代码统一放在根目录的 `modules/` 下。
- `panel/` 目录当前主要保留页面入口，不再承载核心业务逻辑。

## 当前目录结构

- `modules/canvas/`
  - `core.js`：画布核心类与初始化入口。
  - `events.js`：画布事件、工具切换、鼠标键盘交互。
  - `operations.js`：节点、边、文本的增删改查与撤销重做。
  - `render.js`：SVG 渲染、节点/边/文本绘制、拖拽渲染逻辑。
  - `properties.js`：右侧属性面板联动与字段更新。
  - `view.js`：视口、缩放、居中、右键菜单、状态同步。

- `modules/panel/`
  - `actions.js`：顶部按钮动作，如新建、打开、保存、导出、加载模板。
  - `menus.js`：导出菜单、已保存菜单、设置菜单、模板菜单。
  - `index.js`：顶部按钮和左侧工具的事件绑定入口。

- `modules/models/`
  - `node.js`：节点模型与节点 SVG 渲染。
  - `edge.js`：边模型与边 SVG 渲染。
  - `text.js`：独立文本模型与文本 SVG 渲染。

- `modules/data/`
  - `store.js`：本地存储、快照、模板、画布数据读写。
  - `archetypes.js`：内置模板数据。

- `modules/i18n/`
  - `messages.js`：中英文文案数据。
  - `index.js`：国际化方法、语言切换、翻译应用。

- `modules/loader/`
  - `manifest.js`：模块加载清单。
  - `index.js`：模块加载器。
  - 当前页面默认仍采用静态脚本顺序加载，这个目录暂时作为加载配置保留。

- `panel/`
  - `index.html`：主画布页面入口，负责页面 DOM 结构与脚本装配。

## 当前运行方式

- 主界面入口是 `panel/index.html`。
- 页面会按顺序加载 `modules/i18n -> modules/data -> modules/models -> modules/canvas -> modules/panel`。
- 画布实例通过 `window.canvas` 暴露。
- `store`、`i18n`、`CanvasNode`、`CanvasEdge`、`CanvasText`、`Canvas` 也都显式挂在 `window` 上，避免模块拆分后的隐式全局问题。
