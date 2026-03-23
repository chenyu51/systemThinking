/**
 * 核心画布类 - 处理SVG渲染和交互
 */

class Canvas {
  constructor() {
    this.svgElement = document.getElementById('canvas');
    this.currentTool = 'select';
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.isDrawingEdge = false;
    this.edgeStartNode = null;
    this.tempLine = null;
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.history = [];
    this.historyIndex = -1;
    
    // 画布拖拽状态
    this.isCanvasDragging = false;
    this.canvasDragStartX = 0;
    this.canvasDragStartY = 0;
    this.canvasDragStartOffsetX = 0;
    this.canvasDragStartOffsetY = 0;
    this.spaceKeyPressed = false;

    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    // 设置SVG属性
    this.svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svgElement.setAttribute('viewBox', '0 0 1600 900');

    // 添加箭头定义
    this.svgElement.appendChild(CanvasEdge.createArrowMarkerDefs());

    // 加载数据
    await store.load();

    // 恢复缩放和偏移
    this.zoom = store.data.canvas.zoom || 1;
    this.offsetX = store.data.canvas.offsetX || 0;
    this.offsetY = store.data.canvas.offsetY || 0;
    this.currentTool = store.data.canvas.currentTool || 'select';

    // 绘制画布
    this.render();
    this.syncViewport();
    this.syncToolSelection();
    i18n.applyTranslations();
    this.updateProperties();

    // 绑定事件
    this.bindEvents();
    this.saveHistory();

    console.log('Canvas initialized');
  }

  /**
   * 绑定事件
   */
  bindEvents() {
    // 工具选择
    document.querySelectorAll('.tool-item[data-tool]').forEach(item => {
      item.addEventListener('click', (e) => {
        this.currentTool = item.dataset.tool;
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        this.syncToolSelection();
        this.render();
        this.updateProperties();
        this.persistCanvasState();
      });
    });

    // 画布点击
    this.svgElement.addEventListener('click', (e) => {
      if (e.target === this.svgElement && this.currentTool === 'node') {
        const rect = this.svgElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom + this.offsetX;
        const y = (e.clientY - rect.top) / this.zoom + this.offsetY;
        this.addNode(x, y);
      }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
      // 空格键 - 用于画布拖拽
      if (e.key === ' ' || e.code === 'Space') {
        this.spaceKeyPressed = true;
        this.svgElement.style.cursor = 'grab';
        e.preventDefault();
      }
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (this.selectedNodeId) {
          this.deleteNode(this.selectedNodeId);
        }
        if (this.selectedEdgeId) {
          this.deleteEdge(this.selectedEdgeId);
        }
      }
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault();
          this.undo();
        }
        if (e.key === 'y') {
          e.preventDefault();
          this.redo();
        }
        if (e.key === 's') {
          e.preventDefault();
          saveCanvas();
        }
      }
    });

    document.addEventListener('keyup', (e) => {
      // 释放空格键
      if (e.key === ' ' || e.code === 'Space') {
        this.spaceKeyPressed = false;
        this.isCanvasDragging = false;
        this.svgElement.style.cursor = 'default';
      }
    });

    // 拖拽支持
    this.svgElement.addEventListener('mousedown', (e) => {
      // 空格+鼠标拖拽画布
      if (this.spaceKeyPressed && e.target === this.svgElement) {
        this.isCanvasDragging = true;
        this.canvasDragStartX = e.clientX;
        this.canvasDragStartY = e.clientY;
        this.canvasDragStartOffsetX = this.offsetX;
        this.canvasDragStartOffsetY = this.offsetY;
        this.svgElement.style.cursor = 'grabbing';
        e.preventDefault();
      }
    });

    this.svgElement.addEventListener('mousemove', (e) => {
      // 画布拖拽
      if (this.isCanvasDragging) {
        const dx = (e.clientX - this.canvasDragStartX) / this.zoom;
        const dy = (e.clientY - this.canvasDragStartY) / this.zoom;
        
        this.offsetX = this.canvasDragStartOffsetX - dx;
        this.offsetY = this.canvasDragStartOffsetY - dy;
        
        // 实时更新 SVG viewBox 以移动画面
        const viewBox = [-this.offsetX * this.zoom, -this.offsetY * this.zoom, 1600, 900];
        this.svgElement.setAttribute('viewBox', viewBox.join(' '));
        return;
      }
      
      if (this.isDrawingEdge && this.edgeStartNode) {
        const rect = this.svgElement.getBoundingClientRect();
        const x = (e.clientX - rect.left) / this.zoom + this.offsetX;
        const y = (e.clientY - rect.top) / this.zoom + this.offsetY;

        // 更新临时线
        if (!this.tempLine) {
          this.tempLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
          this.tempLine.setAttribute('stroke', '#999');
          this.tempLine.setAttribute('stroke-width', '2');
          this.tempLine.setAttribute('fill', 'none');
          this.svgElement.appendChild(this.tempLine);
        }

        this.tempLine.setAttribute('x1', this.edgeStartNode.x);
        this.tempLine.setAttribute('y1', this.edgeStartNode.y);
        this.tempLine.setAttribute('x2', x);
        this.tempLine.setAttribute('y2', y);
      }
    });

    this.svgElement.addEventListener('mouseup', (e) => {
      if (this.isCanvasDragging) {
        this.isCanvasDragging = false;
        this.svgElement.style.cursor = this.spaceKeyPressed ? 'grab' : 'default';
        this.persistCanvasState();
      }
      
      if (this.isDrawingEdge && this.tempLine) {
        this.isDrawingEdge = false;
        this.tempLine.remove();
        this.tempLine = null;
      }
    });
  }

  /**
   * 添加节点
   */
  addNode(x, y) {
    const node = new CanvasNode({
      x, y,
      label: '新节点',
      color: '#4A90E2'
    });

    store.addNode(node.toJSON());
    this.selectNode(node.id);
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.nodeAdded'));
  }

  /**
   * 删除节点
   */
  deleteNode(nodeId) {
    store.deleteNode(nodeId);
    this.selectedNodeId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
  }

  /**
   * 选择节点
   */
  selectNode(nodeId) {
    this.selectedNodeId = nodeId;
    this.selectedEdgeId = null;
    this.updateProperties();
  }

  /**
   * 添加连线
   */
  addEdge(sourceId, targetId) {
    if (sourceId === targetId) return; // 不能自己连自己

    const edge = new CanvasEdge({
      source: sourceId,
      target: targetId,
      type: 'neutral'
    });

    store.addEdge(edge.toJSON());
    this.render();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.edgeAdded'));
  }

  /**
   * 删除连线
   */
  deleteEdge(edgeId) {
    store.deleteEdge(edgeId);
    this.selectedEdgeId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
  }

  /**
   * 选择连线
   */
  selectEdge(edgeId) {
    this.selectedEdgeId = edgeId;
    this.selectedNodeId = null;
    this.updateProperties();
  }

  /**
   * 开始绘制连线
   */
  startDrawingEdge(nodeId) {
    if (this.currentTool !== 'edge') return;
    this.isDrawingEdge = true;
    this.edgeStartNode = store.getNodes().find(n => n.id === nodeId);
  }

  /**
   * 完成绘制连线
   */
  endDrawingEdge(targetId) {
    if (!this.isDrawingEdge) return;
    
    const sourceId = this.edgeStartNode.id;
    if (sourceId !== targetId) {
      this.addEdge(sourceId, targetId);
    }

    this.isDrawingEdge = false;
    this.edgeStartNode = null;
  }

  /**
   * 渲染画布
   */
  render() {
    // 清空SVG（保留defs）
    const defs = this.svgElement.querySelector('defs');
    this.svgElement.innerHTML = '';
    if (defs) this.svgElement.appendChild(defs);

    // 背景网格（可选）
    this.drawGrid();

    // 绘制连线（先绘制，使其在后面层）
    const edges = store.getEdges();
    const nodes = store.getNodes();

    // 计算每条边的多重度（同源目标的边数和索引）
    const edgeMultiplicity = new Map();
    edges.forEach((edgeData, idx) => {
      const key = `${edgeData.source}-${edgeData.target}`;
      const reverseKey = `${edgeData.target}-${edgeData.source}`;
      
      if (!edgeMultiplicity.has(key)) {
        edgeMultiplicity.set(key, []);
      }
      edgeMultiplicity.get(key).push(idx);
      
      // 同时记录反向连线
      if (!edgeMultiplicity.has(reverseKey)) {
        edgeMultiplicity.set(reverseKey, []);
      }
    });

    edges.forEach((edgeData, idx) => {
      const sourceNode = nodes.find(n => n.id === edgeData.source);
      const targetNode = nodes.find(n => n.id === edgeData.target);

      if (sourceNode && targetNode) {
        const edge = new CanvasEdge(edgeData);
        const sn = new CanvasNode(sourceNode);
        const tn = new CanvasNode(targetNode);
        
        // 获取边的多重度信息
        const key = `${edgeData.source}-${edgeData.target}`;
        const reverseKey = `${edgeData.target}-${edgeData.source}`;
        const sameDirectionEdges = edgeMultiplicity.get(key) || [];
        const reverseEdges = edgeMultiplicity.get(reverseKey) || [];
        const edgeIndex = sameDirectionEdges.indexOf(idx);
        const totalBidirectional = Math.max(sameDirectionEdges.length, 1) + Math.max(reverseEdges.length, 0);
        
        const svgEdge = edge.createSVGElement(sn, tn, edgeIndex, sameDirectionEdges.length, totalBidirectional);

        if (this.selectedEdgeId === edgeData.id) {
          svgEdge.querySelector('line, path').setAttribute('stroke-width', '4');
        }

        // 添加连线点击选择事件
        svgEdge.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectEdge(edgeData.id);
        });

        this.svgElement.appendChild(svgEdge);
      }
    });

    // 绘制节点
    nodes.forEach(nodeData => {
      const node = new CanvasNode(nodeData);
      const svgNode = node.createSVGElement();

      if (this.selectedNodeId === nodeData.id) {
        svgNode.querySelector('.node-shape').setAttribute('stroke', '#FFD700');
        svgNode.querySelector('.node-shape').setAttribute('stroke-width', '3');
      }

      // 添加拖拽功能
      this.makeDraggable(svgNode, nodeData.id);

      // 添加节点点击选择事件（select 工具）
      if (this.currentTool === 'select') {
        svgNode.addEventListener('click', (e) => {
          e.stopPropagation();
          this.selectNode(nodeData.id);
        });
      }

      // 如果当前工具是连线工具，添加连线绘制事件
      if (this.currentTool === 'edge') {
        svgNode.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.startDrawingEdge(nodeData.id);
        });
        svgNode.addEventListener('mouseenter', (e) => {
          if (this.isDrawingEdge && this.edgeStartNode?.id !== nodeData.id) {
            svgNode.style.cursor = 'crosshair';
          }
        });
        svgNode.addEventListener('mouseup', (e) => {
          if (this.isDrawingEdge) {
            this.endDrawingEdge(nodeData.id);
          }
        });
      }

      this.svgElement.appendChild(svgNode);
    });

    // 更新状态
    const stats = store.getStats();
    document.getElementById('nodeCount').textContent = i18n.t('status.nodes', { count: stats.nodeCount });
    document.getElementById('edgeCount').textContent = i18n.t('status.edges', { count: stats.edgeCount });
  }

  /**
   * 绘制背景网格
   */
  drawGrid() {
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    g.setAttribute('class', 'grid');
    g.setAttribute('opacity', '0.1');

    for (let x = 0; x < 1600; x += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', x);
      line.setAttribute('y1', 0);
      line.setAttribute('x2', x);
      line.setAttribute('y2', 900);
      line.setAttribute('stroke', '#999');
      g.appendChild(line);
    }

    for (let y = 0; y < 900; y += 50) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', 0);
      line.setAttribute('y1', y);
      line.setAttribute('x2', 1600);
      line.setAttribute('y2', y);
      line.setAttribute('stroke', '#999');
      g.appendChild(line);
    }

    this.svgElement.appendChild(g);
  }

  /**
   * 使节点可拖拽
   */
  makeDraggable(element, nodeId) {
    let isDragging = false;
    let startX, startY;

    element.addEventListener('mousedown', (e) => {
      if (this.currentTool === 'select' || this.currentTool === 'edge') {
        // 选中节点（用于删除和属性修改）
        this.selectNode(nodeId);
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
      }
    });

    let isDraggingSaved = false;
    document.addEventListener('mousemove', (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        const node = store.getNodes().find(n => n.id === nodeId);
        if (node) {
          node.x += dx;
          node.y += dy;
          store.updateNode(nodeId, { x: node.x, y: node.y });
          this.render();
          isDraggingSaved = true;
        }

        startX = e.clientX;
        startY = e.clientY;
      }
    });

    document.addEventListener('mouseup', () => {
      if (isDragging && isDraggingSaved) {
        this.persistCanvasState();
      }
      isDragging = false;
      if (this.selectedNodeId === nodeId) {
        this.saveHistory();
      }
    });
  }

  /**
   * 撤销
   */
  undo() {
    if (this.historyIndex > 0) {
      this.historyIndex--;
      this.restoreFromHistory(this.historyIndex);
    }
  }

  /**
   * 重做
   */
  redo() {
    if (this.historyIndex < this.history.length - 1) {
      this.historyIndex++;
      this.restoreFromHistory(this.historyIndex);
    }
  }

  /**
   * 保存历史
   */
  saveHistory() {
    // 只保留当前索引之前的历史
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(JSON.parse(JSON.stringify(store.data)));
    this.historyIndex++;

    // 限制历史记录数量
    if (this.history.length > 50) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  /**
   * 从历史恢复
   */
  restoreFromHistory(index) {
    if (index >= 0 && index < this.history.length) {
      store.data = JSON.parse(JSON.stringify(this.history[index]));
      this.syncToolSelection();
      this.persistCanvasState();
      this.render();
    }
  }

  /**
   * 更新属性面板
   */
  updateProperties() {
    const selectedInfo = document.getElementById('selectedInfo');
    const nodeProperties = document.getElementById('nodeProperties');
    const edgeProperties = document.getElementById('edgeProperties');

    nodeProperties.style.display = 'none';
    edgeProperties.style.display = 'none';

    if (this.selectedNodeId) {
      const node = store.getNodes().find(n => n.id === this.selectedNodeId);
      if (node) {
        selectedInfo.textContent = i18n.t('selected.node', { label: node.label });
        nodeProperties.style.display = 'block';

        document.getElementById('nodeLabel').value = node.label;
        document.getElementById('nodeColor').value = node.color;
        document.getElementById('nodeShape').value = node.shape;

        document.getElementById('nodeLabel').onchange = () => {
          node.label = document.getElementById('nodeLabel').value;
          store.updateNode(this.selectedNodeId, { label: node.label });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };

        document.getElementById('nodeColor').onchange = () => {
          node.color = document.getElementById('nodeColor').value;
          store.updateNode(this.selectedNodeId, { color: node.color });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };

        document.getElementById('nodeShape').onchange = () => {
          node.shape = document.getElementById('nodeShape').value;
          store.updateNode(this.selectedNodeId, { shape: node.shape });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };
      }
    } else if (this.selectedEdgeId) {
      const edge = store.getEdges().find(e => e.id === this.selectedEdgeId);
      if (edge) {
        selectedInfo.textContent = i18n.t('selected.edge');
        edgeProperties.style.display = 'block';

        document.getElementById('edgeType').value = edge.type;
        document.getElementById('edgeLabel').value = edge.label;
        document.getElementById('edgeDelay').checked = edge.hasDelay;

        document.getElementById('edgeType').onchange = () => {
          edge.type = document.getElementById('edgeType').value;
          edge.color = new CanvasEdge(edge).getColorByType(edge.type);
          store.updateEdge(this.selectedEdgeId, { type: edge.type, color: edge.color });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };

        document.getElementById('edgeLabel').onchange = () => {
          edge.label = document.getElementById('edgeLabel').value;
          store.updateEdge(this.selectedEdgeId, { label: edge.label });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };

        document.getElementById('edgeDelay').onchange = () => {
          edge.hasDelay = document.getElementById('edgeDelay').checked;
          store.updateEdge(this.selectedEdgeId, { hasDelay: edge.hasDelay });
          this.render();
          this.saveHistory();
          this.persistCanvasState();
        };
      }
    } else {
      selectedInfo.textContent = i18n.t('selected.none');
    }
  }

  syncToolSelection() {
    document.querySelectorAll('.tool-item[data-tool]').forEach((item) => {
      item.classList.toggle('active', item.dataset.tool === this.currentTool);
    });
  }

  syncViewport() {
    const viewBox = [-this.offsetX * this.zoom, -this.offsetY * this.zoom, 1600, 900];
    this.svgElement.setAttribute('viewBox', viewBox.join(' '));
    document.getElementById('zoom').textContent = i18n.t('status.zoom', {
      percent: Math.round(this.zoom * 100)
    });
  }

  persistCanvasState() {
    store.data.canvas.zoom = this.zoom;
    store.data.canvas.offsetX = this.offsetX;
    store.data.canvas.offsetY = this.offsetY;
    store.data.canvas.currentTool = this.currentTool;
    this.syncViewport();
    store.save();
  }

  /**
   * 更新状态栏
   */
  updateStatus(message) {
    document.getElementById('status').textContent = message;
  }
}

// 全局实例
let canvas;

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
  canvas = new Canvas();
  
  // Canvas 初始化完成后，初始化事件监听（在 panel.js 中定义）
  if (typeof initializeEventListeners === 'function') {
    initializeEventListeners();
  }
});
