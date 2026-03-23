# 🎨 SystemCanvas 图标设计指南

## 图标概述

SystemCanvas 的图标设计理念：**系统思维 + 现代简洁**

- 🎯 主色调：紫蓝色 (#667eea)
- 🌟 元素：节点、连线、正反馈标记
- 📐 含义：代表系统循环图的因果关系

---

## 图标规格

| 尺寸 | 用途 | 文件名 |
|------|------|---------|
| 16×16 px | 浏览器菜单栏 | `icon-16.png` |
| 48×48 px | 扩展程序管理页面 | `icon-48.png` |
| 128×128 px | Chrome Web Store | `icon-128.png` |

---

## 图标设计元素

### 主要构成
```
┌─────────────────┐
│   紫蓝背景      │  #667eea
│   ┌─────────┐   │
│   │  黄圆   │   │  #FFD700 (左上)
│   └─────────┘   │
│     ↗️ ↖️        │
│   ┌─────────┐   │
│   │  红圆   │   │  #FF6B6B (右上)
│   └─────────┘   │
│       ↙️         │
│   ┌─────────┐   │
│   │  绿圆   │   │  #51CF66 (下方)
│   └─────────┘   │
└─────────────────┘
```

### 颜色含义
- 🟡 **黄色节点** - 输入/起点
- 🔴 **红色节点** - 挑战/反馈
- 🟢 **绿色节点** - 结果/流出
- 🟣 **箭头连线** - 因果关系

### 特殊标记
- ✅ **绿箭头 (+)** - 正反馈（增强）
- ❌ **红箭头 (-)** - 负反馈（调节）
- 🔵 **蓝箭头** - 循环返回

---

## 快速生成图标

### 方法 1：使用 Node.js 脚本（推荐）

#### 第1步：安装依赖
```bash
cd /Users/yuchen/Documents/my-github/canvas
npm install
```

#### 第2步：生成图标
```bash
npm run generate-icons
```

#### 输出结果
```
✅ 已保存: assets/icon-16.png
✅ 已保存: assets/icon-48.png
✅ 已保存: assets/icon-128.png
```

---

### 方法 2：在线转换（无需安装）

**推荐工具**：
1. [Convertio](https://convertio.co/svg-png/)
2. [CloudConvert](https://cloudconvert.com/svg-to-png)
3. [Vectr](https://vectr.com/)

**步骤**：
1. 打开在线工具
2. 上传 `assets/icon.svg`
3. 分别以 16、48、128 尺寸导出 PNG
4. 将文件保存到 `assets/` 文件夹

---

### 方法 3：macOS 快速转换

#### 使用 ImageMagick（如果已安装）
```bash
# 安装 ImageMagick
brew install imagemagick

# 生成图标
convert -density 300 assets/icon.svg -resize 16x16 assets/icon-16.png
convert -density 300 assets/icon.svg -resize 48x48 assets/icon-48.png
convert -density 300 assets/icon.svg -resize 128x128 assets/icon-128.png
```

#### 使用 Safari 和预览
1. 打开 `assets/icon.svg` 用 Safari
2. 右键 → 储存为图像
3. 在预览中调整尺寸和导出

---

### 方法 4：使用在线 SVG 编辑器

1. 访问 [Figma](https://www.figma.com) 或 [Sketch](https://www.sketch.com)
2. 导入 `icon.svg`
3. 创建 1:1 副本并调整为目标尺寸
4. 导出为 PNG

---

## 自定义图标

### 颜色变更

编辑 `assets/icon.svg`，修改以下值：

```xml
<!-- 背景色 -->
<rect fill="#667eea"/>    <!-- 改为你的颜色 -->

<!-- 节点颜色 -->
<circle fill="#FFD700"/>  <!-- 黄色 -->
<circle fill="#FF6B6B"/>  <!-- 红色 -->
<circle fill="#51CF66"/>  <!-- 绿色 -->
```

**常用颜色方案**：

| 方案 | 背景 | 节点1 | 节点2 | 节点3 | 用途 |
|------|------|-------|-------|-------|------|
| 紫蓝 | #667eea | #FFD700 | #FF6B6B | #51CF66 | 默认 |
| 深暗 | #2c3e50 | #e74c3c | #f39c12 | #27ae60 | 暗黑模式 |
| 清爽 | #3498db | #f1c40f | #e67e22 | #2ecc71 | 明亮风格 |
| 极简 | #34495e | #ecf0f1 | #95a5a6 | #bdc3c7 | 灰度风格 |

### 文本变更

```xml
<!-- 修改中心文字 -->
<text>Canvas</text>  <!-- 改为 Logo 名字 -->
```

### 样式调整

```xml
<!-- 修改线条粗细 -->
<line stroke-width="3"/>  <!-- 3 改为其他值 -->

<!-- 修改节点大小 -->
<circle r="35"/>  <!-- 35 改为其他值 -->

<!-- 修改透明度 -->
<circle opacity="0.8"/>  <!-- 添加透明度 -->
```

---

## 现有图标预览

### 当前设计
- ✅ 3 个彩色节点（黄、红、绿）
- ✅ 系统循环关系（3个连线）
- ✅ 正负反馈标记（+、-、→）
- ✅ 紫蓝色背景
- ✅ 白色边框描边

---

## 文件清单

```
assets/
├── icon.svg              ✅ SVG 源文件（可编辑）
├── icon-16.png           ✅ 16×16 图标
├── icon-48.png           ✅ 48×48 图标
└── icon-128.png          ✅ 128×128 图标
```

---

## 图标使用

### 在 manifest.json 中声明
```json
"icons": {
  "16": "assets/icon-16.png",
  "48": "assets/icon-48.png",
  "128": "assets/icon-128.png"
}
```

### 在 HTML 中使用
```html
<link rel="icon" type="image/png" href="assets/icon-16.png">
```

### CSS 背景
```css
.extension-icon {
  background-image: url('assets/icon-128.png');
  width: 128px;
  height: 128px;
}
```

---

## 高级图标变体（可选）

### 暗黑模式版本
新建文件：`assets/icon-dark.svg`
- 浅色背景（#f5f5f5）
- 深色节点（#333）
- 高对比度

### 单色版本
新建文件：`assets/icon-mono.svg`
- 纯蓝或纯黑
- 用于某些场景

### 动态图标
新建文件：`assets/icon-animated.gif`
- 节点间的流动动画
- 用于广告或演示

---

## 测试图标

### 在本地测试
1. 生成或准备 PNG 文件
2. 确保放在 `assets/` 文件夹
3. 在 Chrome 加载扩展
4. 检查工具栏是否显示正确

### 在 Chrome Web Store 中
1. 在 Web Store 上传前测试
2. 检查不同分辨率显示情况
3. 确保在小尺寸下仍清晰可见

---

## 设计建议

### ✅ 最佳实践
- 保留清晰的线条和边界
- 使用高对比度背景和前景
- 在小尺寸下仍可识别
- 避免过度细节
- 符合 Chrome 设计规范

### ❌ 避免
- 过于复杂的渐变
- 细小的字体
- 过多颜色（超过5种）
- 模糊的图像
- 与其他扩展雷同

---

## 常见问题

### Q: 生成的 PNG 虚糊？
A: 增加 `-density` 参数或使用更高质量转换工具

### Q: 怎样制作透明背景？
A: 在 SVG 中删除背景 rect，导出时选择 PNG（支持透明）

### Q: 如何适配深色模式？
A: 创建两个版本（亮/暗），或使用 CSS 媒体查询

### Q: 可否使用 emoji？
A: 不推荐，emoij 在不同平台显示不同，最好用矢量图形

### Q: 多久更新一次图标？
A: 建议每个主版本（v1.0、v2.0）更新一次

---

## 资源下载

- 📥 [Figma 模板](https://www.figma.com/community)
- 📥 [Icon8 图标库](https://icons8.com/)
- 📥 [Iconmonstr](https://iconmonstr.com/)

---

## 许可和属性

- 设计来源：原创
- 许可证：MIT（可自由使用和修改）
- 供应方：SystemCanvas Project

---

**版本**: v0.1.0  
**最后更新**: 2024-01-01  
**下一步**: 生成 PNG 并在 Chrome 中测试 ✨
