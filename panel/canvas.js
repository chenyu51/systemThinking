/**
 * 核心画布类 - 处理SVG渲染和交互
 */

class Canvas {
  constructor() {
    this.baseViewWidth = 1600;
    this.baseViewHeight = 900;
    this.svgElement = document.getElementById('canvas');
    this.currentTool = 'select';
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.isDrawingEdge = false;
    this.edgeStartNode = null;
    this.edgeHoverTargetId = null;
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

    this.init();
  }

  /**
   * 初始化
   */
  async init() {
    // 设置SVG属性
    this.svgElement.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    this.svgElement.setAttribute('viewBox', `0 0 ${this.baseViewWidth} ${this.baseViewHeight}`);

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
    this.updateCanvasCursor();

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
        this.cancelEdgeDrawing();
        this.currentTool = item.dataset.tool;
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        this.syncToolSelection();
        this.render();
        this.updateProperties();
        this.updateCanvasCursor();
        this.persistCanvasState();
      });
    });

    // 画布点击
    this.svgElement.addEventListener('click', (e) => {
      this.hideContextMenu();

      if (e.target === this.svgElement && this.currentTool === 'node') {
        const { x, y } = this.screenToWorld(e.clientX, e.clientY);
        this.addNode(x, y);
        return;
      }

      if (e.target === this.svgElement) {
        this.selectedNodeId = null;
        this.selectedEdgeId = null;
        this.render();
        this.updateProperties();
      }
    });

    this.svgElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.showContextMenu(e.clientX, e.clientY);
    });

    this.svgElement.addEventListener('wheel', (e) => {
      e.preventDefault();

      const rect = this.svgElement.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const { x: worldX, y: worldY } = this.screenToWorld(e.clientX, e.clientY);

      const zoomDelta = e.deltaY < 0 ? 1.1 : 0.9;
      const nextZoom = Math.min(3, Math.max(0.2, this.zoom * zoomDelta));

      if (nextZoom === this.zoom) {
        return;
      }

      this.zoom = nextZoom;
      const viewWidth = this.baseViewWidth / this.zoom;
      const viewHeight = this.baseViewHeight / this.zoom;
      this.offsetX = worldX - (mouseX / rect.width) * viewWidth;
      this.offsetY = worldY - (mouseY / rect.height) * viewHeight;
      this.syncViewport();
      this.persistCanvasState();
    }, { passive: false });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
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

    // 拖拽支持
    this.svgElement.addEventListener('mousedown', (e) => {
      const clickedCanvasElement = e.target.closest('.node, .edge');
      const canPanCanvas = this.currentTool !== 'node' && !clickedCanvasElement;

      if (canPanCanvas) {
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
        const rect = this.svgElement.getBoundingClientRect();
        const viewWidth = this.baseViewWidth / this.zoom;
        const viewHeight = this.baseViewHeight / this.zoom;
        const dx = ((e.clientX - this.canvasDragStartX) / rect.width) * viewWidth;
        const dy = ((e.clientY - this.canvasDragStartY) / rect.height) * viewHeight;
        
        this.offsetX = this.canvasDragStartOffsetX - dx;
        this.offsetY = this.canvasDragStartOffsetY - dy;
        this.syncViewport();
        return;
      }
      
      if (this.isDrawingEdge && this.edgeStartNode) {
        const { x, y } = this.screenToWorld(e.clientX, e.clientY);

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

    document.addEventListener('mouseup', () => {
      if (this.isCanvasDragging) {
        this.isCanvasDragging = false;
        this.updateCanvasCursor();
        this.persistCanvasState();
      }
      
      if (this.isDrawingEdge) {
        if (this.edgeHoverTargetId && this.edgeStartNode?.id !== this.edgeHoverTargetId) {
          this.addEdge(this.edgeStartNode.id, this.edgeHoverTargetId);
        }
        this.cancelEdgeDrawing();
      }
    });

    document.addEventListener('click', () => {
      this.hideContextMenu();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.hideContextMenu();
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
    this.render();
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
    this.render();
    this.updateProperties();
  }

  clearCanvas() {
    if (!confirm(i18n.t('dialog.clearCanvasConfirm'))) {
      return;
    }

    store.clear();
    this.selectedNodeId = null;
    this.selectedEdgeId = null;
    this.render();
    this.updateProperties();
    this.saveHistory();
    this.persistCanvasState();
    this.updateStatus(i18n.t('message.canvasCleared'));
  }

  /**
   * 开始绘制连线
   */
  startDrawingEdge(nodeId, side = 'right') {
    if (this.currentTool !== 'edge') return;
    this.isDrawingEdge = true;
    this.edgeHoverTargetId = null;
    const node = store.getNodes().find(n => n.id === nodeId);
    if (!node) return;
    const position = new CanvasNode(node).getPortPosition(side);
    this.edgeStartNode = {
      id: nodeId,
      side,
      x: position.x,
      y: position.y
    };
  }

  /**
   * 完成绘制连线
   */
  endDrawingEdge(targetId) {
    if (!this.isDrawingEdge || !this.edgeStartNode) return;
    const sourceId = this.edgeStartNode.id;
    if (sourceId !== targetId) {
      this.addEdge(sourceId, targetId);
    }
    this.cancelEdgeDrawing();
  }

  cancelEdgeDrawing() {
    this.isDrawingEdge = false;
    this.edgeStartNode = null;
    this.edgeHoverTargetId = null;
    if (this.tempLine) {
      this.tempLine.remove();
      this.tempLine = null;
    }
    this.render();
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

    // 计算每对节点之间的边集合，用于为多条边分配不同弧度
    const edgeMultiplicity = new Map();
    edges.forEach((edgeData, idx) => {
      const key = [edgeData.source, edgeData.target].sort().join('::');
      
      if (!edgeMultiplicity.has(key)) {
        edgeMultiplicity.set(key, []);
      }
      edgeMultiplicity.get(key).push(idx);
    });

    edges.forEach((edgeData, idx) => {
      const sourceNode = nodes.find(n => n.id === edgeData.source);
      const targetNode = nodes.find(n => n.id === edgeData.target);

      if (sourceNode && targetNode) {
        const edge = new CanvasEdge(edgeData);
        const sn = new CanvasNode(sourceNode);
        const tn = new CanvasNode(targetNode);
        
        const key = [edgeData.source, edgeData.target].sort().join('::');
        const pairEdges = edgeMultiplicity.get(key) || [];
        const edgeIndex = pairEdges.indexOf(idx);
        const pairNodeIds = [edgeData.source, edgeData.target].sort();
        const curveDirection = edgeData.source === pairNodeIds[0] ? 1 : -1;
        
        const svgEdge = edge.createSVGElement(sn, tn, edgeIndex, pairEdges.length, curveDirection);

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
      const svgNode = node.createSVGElement({
        showPorts: this.currentTool === 'edge' || this.isDrawingEdge
      });

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
        svgNode.addEventListener('mouseenter', (e) => {
          if (this.isDrawingEdge && this.edgeStartNode?.id !== nodeData.id) {
            this.edgeHoverTargetId = nodeData.id;
            svgNode.style.cursor = 'crosshair';
          }
        });
        svgNode.addEventListener('mouseleave', () => {
          if (this.edgeHoverTargetId === nodeData.id) {
            this.edgeHoverTargetId = null;
          }
        });
      }

      svgNode.querySelectorAll('.link-port').forEach((port) => {
        port.addEventListener('mousedown', (e) => {
          e.stopPropagation();
          this.startDrawingEdge(nodeData.id, port.dataset.side);
        });
      });

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
      if (this.currentTool === 'select') {
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
    const templateInfoGroup = document.getElementById('templateInfoGroup');
    const templateName = document.getElementById('templateName');
    const templateDescription = document.getElementById('templateDescription');
    const selectedInfo = document.getElementById('selectedInfo');
    const nodeProperties = document.getElementById('nodeProperties');
    const edgeProperties = document.getElementById('edgeProperties');

    if (store.data.templateInfo?.name) {
      templateInfoGroup.style.display = 'block';
      templateName.textContent = store.data.templateInfo.name;
      templateDescription.textContent = store.data.templateInfo.description || i18n.t('template.noDescription');
    } else {
      templateInfoGroup.style.display = 'none';
      templateName.textContent = '';
      templateDescription.textContent = '';
    }

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
    const viewBox = [
      this.offsetX,
      this.offsetY,
      this.baseViewWidth / this.zoom,
      this.baseViewHeight / this.zoom
    ];
    this.svgElement.setAttribute('viewBox', viewBox.join(' '));
    document.getElementById('zoom').textContent = i18n.t('status.zoom', {
      percent: Math.round(this.zoom * 100)
    });
  }

  resetView() {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.syncViewport();
  }

  centerGraph(padding = 80) {
    const nodes = store.getNodes();
    if (!nodes.length) {
      this.resetView();
      return;
    }

    this.zoom = 1;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((nodeData) => {
      const node = new CanvasNode(nodeData);
      minX = Math.min(minX, node.x - node.width / 2);
      minY = Math.min(minY, node.y - node.height / 2);
      maxX = Math.max(maxX, node.x + node.width / 2);
      maxY = Math.max(maxY, node.y + node.height / 2);
    });

    const graphWidth = maxX - minX;
    const graphHeight = maxY - minY;
    const targetCenterX = this.baseViewWidth / 2;
    const targetCenterY = this.baseViewHeight / 2;
    const graphCenterX = minX + graphWidth / 2;
    const graphCenterY = minY + graphHeight / 2;

    this.offsetX = graphCenterX - targetCenterX;
    this.offsetY = graphCenterY - targetCenterY;

    if (graphWidth + padding * 2 > this.baseViewWidth || graphHeight + padding * 2 > this.baseViewHeight) {
      const zoomX = this.baseViewWidth / (graphWidth + padding * 2);
      const zoomY = this.baseViewHeight / (graphHeight + padding * 2);
      this.zoom = Math.min(1, zoomX, zoomY);
      const viewWidth = this.baseViewWidth / this.zoom;
      const viewHeight = this.baseViewHeight / this.zoom;
      this.offsetX = graphCenterX - viewWidth / 2;
      this.offsetY = graphCenterY - viewHeight / 2;
    }

    this.syncViewport();
  }

  screenToWorld(clientX, clientY) {
    const rect = this.svgElement.getBoundingClientRect();
    const viewWidth = this.baseViewWidth / this.zoom;
    const viewHeight = this.baseViewHeight / this.zoom;
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;

    return {
      x: this.offsetX + (relativeX / rect.width) * viewWidth,
      y: this.offsetY + (relativeY / rect.height) * viewHeight
    };
  }

  updateCanvasCursor() {
    this.svgElement.style.cursor = this.isCanvasDragging ? 'grabbing' : 'grab';
  }

  showContextMenu(x, y) {
    this.hideContextMenu();

    const menu = document.createElement('div');
    menu.className = 'canvas-context-menu';
    menu.style.cssText = `
      position: fixed;
      top: ${y}px;
      left: ${x}px;
      background: white;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      z-index: 2000;
      min-width: 160px;
      padding: 6px 0;
    `;

    const clearItem = document.createElement('button');
    clearItem.type = 'button';
    clearItem.style.cssText = `
      display: block;
      width: 100%;
      border: none;
      background: transparent;
      text-align: left;
      padding: 10px 14px;
      font-size: 13px;
      color: #c0392b;
      cursor: pointer;
      border-radius: 0;
    `;
    clearItem.textContent = i18n.t('menu.clearCanvas');
    clearItem.onmouseover = () => {
      clearItem.style.background = '#fff2f0';
    };
    clearItem.onmouseout = () => {
      clearItem.style.background = 'transparent';
    };
    clearItem.onclick = (e) => {
      e.stopPropagation();
      this.hideContextMenu();
      this.clearCanvas();
    };

    menu.appendChild(clearItem);
    menu.addEventListener('click', (e) => e.stopPropagation());
    document.body.appendChild(menu);
  }

  hideContextMenu() {
    document.querySelector('.canvas-context-menu')?.remove();
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
