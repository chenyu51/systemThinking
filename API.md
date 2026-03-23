# 📚 SystemCanvas - API 文档

## 概览

SystemCanvas 的核心由几个主要类组成：

- `CanvasStore` - 数据持久化
- `CanvasNode` - 节点模型
- `CanvasEdge` - 连线模型
- `Canvas` - 核心渲染引擎

---

## CanvasStore 类

数据存储层，管理所有节点和连线数据。

### 属性

```javascript
store.data {
  version: string,        // 版本号
  id: string,            // 画布ID
  name: string,          // 画布名称
  created: string,       // 创建时间
  updated: string,       // 最后更新时间
  canvas: {
    zoom: number,        // 缩放级别
    offsetX: number,     // X轴偏移
    offsetY: number,     // Y轴偏移
    nodes: Array,        // 节点列表
    edges: Array         // 连线列表
  }
}
```

### 方法

#### `async load()`
从浏览器本地存储加载数据。

```javascript
await store.load();
// store.data 现在包含加载的数据
```

#### `async save()`
保存当前数据到浏览器本地存储。

```javascript
await store.save();
// 数据已保存，store.data.updated 自动更新
```

#### `exportJSON()`
将数据导出为 JSON 字符串。

```javascript
const json = store.exportJSON();
console.log(json); // 格式化的 JSON 字符串
```

#### `importJSON(jsonStr)`
从 JSON 字符串导入数据。

```javascript
const success = store.importJSON(jsonString);
if (success) {
  console.log("导入成功");
}
```

#### `addNode(node)`
添加新节点。

```javascript
const nodeData = {
  label: '新节点',
  x: 100,
  y: 200,
  color: '#4A90E2'
};
store.addNode(nodeData);
```

#### `updateNode(nodeId, updates)`
更新节点属性。

```javascript
store.updateNode('node_xxx', {
  label: '更新的标签',
  color: '#E74C3C'
});
```

#### `deleteNode(nodeId)`
删除节点（同时删除相关连线）。

```javascript
store.deleteNode('node_xxx');
```

#### `getNodes()`
获取所有节点。

```javascript
const nodes = store.getNodes();
nodes.forEach(node => {
  console.log(node.label);
});
```

#### `addEdge(edge)`
添加新连线。

```javascript
const edgeData = {
  source: 'node_1',
  target: 'node_2',
  type: 'positive'
};
store.addEdge(edgeData);
```

#### `updateEdge(edgeId, updates)`
更新连线属性。

```javascript
store.updateEdge('edge_xxx', {
  type: 'negative',
  hasDelay: true
});
```

#### `deleteEdge(edgeId)`
删除连线。

```javascript
store.deleteEdge('edge_xxx');
```

#### `getEdges()`
获取所有连线。

```javascript
const edges = store.getEdges();
edges.forEach(edge => {
  console.log(`${edge.source} -> ${edge.target}`);
});
```

#### `getStats()`
获取统计信息。

```javascript
const stats = store.getStats();
console.log(`节点数: ${stats.nodeCount}`);
console.log(`连线数: ${stats.edgeCount}`);
```

#### `clear()`
清空所有节点和连线。

```javascript
store.clear();
```

---

## CanvasNode 类

节点数据模型，代表画布上的一个节点。

### 构造函数

```javascript
const node = new CanvasNode({
  label: '节点标签',
  x: 100,
  y: 200,
  type: 'variable',      // variable | stock | flow
  shape: 'rectangle',    // rectangle | circle | diamond
  color: '#4A90E2',
  width: 120,
  height: 60,
  description: '节点描述'
});
```

### 属性

```javascript
node.id          // string - 唯一标识符
node.type        // string - 节点类型
node.label       // string - 显示文本
node.x           // number - X坐标
node.y           // number - Y坐标
node.shape       // string - 形状
node.color       // string - 颜色
node.width       // number - 宽度
node.height      // number - 高度
node.description // string - 描述
```

### 方法

#### `toJSON()`
序列化为 JSON 对象。

```javascript
const data = node.toJSON();
```

#### `static fromJSON(data)`
从 JSON 对象反序列化。

```javascript
const node = CanvasNode.fromJSON(jsonData);
```

#### `createSVGElement()`
生成 SVG DOM 元素。

```javascript
const svgElement = node.createSVGElement();
document.querySelector('#canvas').appendChild(svgElement);
```

---

## CanvasEdge 类

连线数据模型，代表节点之间的关系。

### 构造函数

```javascript
const edge = new CanvasEdge({
  source: 'node_1',      // 源节点ID
  target: 'node_2',      // 目标节点ID
  type: 'positive',      // positive | negative | neutral
  hasDelay: false,
  label: '标签'
});
```

### 属性

```javascript
edge.id        // string - 唯一标识符
edge.source    // string - 源节点ID
edge.target    // string - 目标节点ID
edge.type      // string - 反馈类型
edge.hasDelay  // boolean - 是否有延迟
edge.label     // string - 标签
edge.color     // string - 颜色（由type决定）
```

### 方法

#### `toJSON()`
序列化为 JSON 对象。

```javascript
const data = edge.toJSON();
```

#### `static fromJSON(data)`
从 JSON 对象反序列化。

```javascript
const edge = CanvasEdge.fromJSON(jsonData);
```

#### `createSVGElement(sourceNode, targetNode)`
生成 SVG 路径元素。

```javascript
const svgEdge = edge.createSVGElement(sourceNode, targetNode);
document.querySelector('#canvas').appendChild(svgEdge);
```

#### `getColorByType(type)`
根据反馈类型获取颜色。

```javascript
const color = edge.getColorByType('positive');
// 返回 '#27AE60' (绿色)
```

#### `static createArrowMarkerDefs()`
创建 SVG 箭头定义。

```javascript
const defs = CanvasEdge.createArrowMarkerDefs();
```

---

## Canvas 类

核心画布渲染引擎，处理交互和渲染。

### 初始化

```javascript
// 全局实例会自动创建
canvas = new Canvas();
```

### 主要方法

#### `addNode(x, y)`
在指定位置添加新节点。

```javascript
canvas.addNode(100, 200);
```

#### `deleteNode(nodeId)`
删除指定节点。

```javascript
canvas.deleteNode('node_xxx');
```

#### `selectNode(nodeId)`
选中节点。

```javascript
canvas.selectNode('node_xxx');
```

#### `addEdge(sourceId, targetId)`
在两个节点之间添加连线。

```javascript
canvas.addEdge('node_1', 'node_2');
```

#### `deleteEdge(edgeId)`
删除连线。

```javascript
canvas.deleteEdge('edge_xxx');
```

#### `selectEdge(edgeId)`
选中连线。

```javascript
canvas.selectEdge('edge_xxx');
```

#### `render()`
重新渲染画布。

```javascript
canvas.render();
```

#### `undo()`
撤销最后一个操作。

```javascript
canvas.undo();
```

#### `redo()`
重做操作。

```javascript
canvas.redo();
```

#### `updateProperties()`
更新右侧属性面板。

```javascript
canvas.updateProperties();
```

#### `updateStatus(message)`
更新状态栏消息。

```javascript
canvas.updateStatus('操作完成');
```

### 属性

```javascript
canvas.currentTool      // string - 当前工具
canvas.selectedNodeId   // string - 选中节点ID
canvas.selectedEdgeId   // string - 选中连线ID
canvas.zoom             // number - 缩放级别
canvas.offsetX          // number - X轴偏移
canvas.offsetY          // number - Y轴偏移
canvas.history          // Array - 操作历史
canvas.historyIndex     // number - 历史索引
```

---

## 使用示例

### 示例 1：程序化创建系统图

```javascript
// 创建节点
const node1 = new CanvasNode({ label: '市场需求', x: 100, y: 100 });
const node2 = new CanvasNode({ label: '产品投入', x: 300, y: 100 });
const node3 = new CanvasNode({ label: '市场反馈', x: 500, y: 100 });

// 添加到存储
store.addNode(node1.toJSON());
store.addNode(node2.toJSON());
store.addNode(node3.toJSON());

// 创建连线
const edge1 = new CanvasEdge({
  source: node1.id,
  target: node2.id,
  type: 'positive'
});

const edge2 = new CanvasEdge({
  source: node2.id,
  target: node3.id,
  type: 'positive'
});

store.addEdge(edge1.toJSON());
store.addEdge(edge2.toJSON());

// 渲染
canvas.render();
```

### 示例 2：导出和导入

```javascript
// 导出
const jsonData = store.exportJSON();
console.log(jsonData);

// 导入
const success = store.importJSON(jsonData);
if (success) {
  canvas.render();
}
```

### 示例 3：处理用户交互

```javascript
// 监听节点选择
document.addEventListener('nodeSelected', (e) => {
  const nodeId = e.detail.nodeId;
  canvas.selectNode(nodeId);
  canvas.updateProperties();
});

// 通过API程序化操作
canvas.currentTool = 'node';
canvas.addNode(200, 300);
```

---

## 事件系统

### 自定义事件（计划中）

```javascript
// 监听节点创建
document.addEventListener('nodeCreated', (e) => {
  console.log('新节点:', e.detail.nodeId);
});

// 监听数据保存
document.addEventListener('dataSaved', (e) => {
  console.log('保存成功');
});
```

---

## 常见问题

### Q: 如何获取当前原始数据？
A:
```javascript
const rawData = store.data;
const nodes = store.getNodes();
const edges = store.getEdges();
```

### Q: 如何快速清空画布？
A:
```javascript
store.clear();
canvas.render();
```

### Q: 如何获取两个节点间的所有连线？
A:
```javascript
const edges = store.getEdges().filter(e => 
  (e.source === nodeId1 && e.target === nodeId2) ||
  (e.source === nodeId2 && e.target === nodeId1)
);
```

### Q: 如何修改节点位置后自动保存？
A:
```javascript
// 在 canvas.makeDraggable() 中的 mouseup 事件里
document.addEventListener('mouseup', () => {
  isDragging = false;
  store.save(); // 自动保存
});
```

---

## 更新日志

- **v0.1.0**: 初始API
- **v0.5.0**: 计划添加回路识别API
- **v1.0.0**: 计划添加分析API

---

**文档版本**: v0.1.0  
**最后更新**: 2024-01-01
