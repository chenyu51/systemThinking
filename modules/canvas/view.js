Object.assign(Canvas.prototype, {
  syncViewport() {
    const viewBox = [this.offsetX, this.offsetY, this.baseViewWidth / this.zoom, this.baseViewHeight / this.zoom];
    this.svgElement.setAttribute('viewBox', viewBox.join(' '));
    document.getElementById('zoom').textContent = i18n.t('status.zoom', { percent: Math.round(this.zoom * 100) });
  },

  resetView() {
    this.zoom = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.syncViewport();
  },

  centerGraph(padding = 80) {
    const nodes = store.getNodes();
    if (!nodes.length) return this.resetView();
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
    const graphCenterX = minX + graphWidth / 2;
    const graphCenterY = minY + graphHeight / 2;
    this.offsetX = graphCenterX - this.baseViewWidth / 2;
    this.offsetY = graphCenterY - this.baseViewHeight / 2;
    if (graphWidth + padding * 2 > this.baseViewWidth || graphHeight + padding * 2 > this.baseViewHeight) {
      this.zoom = Math.min(1, this.baseViewWidth / (graphWidth + padding * 2), this.baseViewHeight / (graphHeight + padding * 2));
      this.offsetX = graphCenterX - this.baseViewWidth / this.zoom / 2;
      this.offsetY = graphCenterY - this.baseViewHeight / this.zoom / 2;
    }
    this.syncViewport();
  },

  screenToWorld(clientX, clientY) {
    const rect = this.svgElement.getBoundingClientRect();
    const viewWidth = this.baseViewWidth / this.zoom;
    const viewHeight = this.baseViewHeight / this.zoom;
    return {
      x: this.offsetX + ((clientX - rect.left) / rect.width) * viewWidth,
      y: this.offsetY + ((clientY - rect.top) / rect.height) * viewHeight
    };
  },

  updateCanvasCursor() {
    this.svgElement.style.cursor = this.isCanvasDragging ? 'grabbing' : 'grab';
  },

  showContextMenu(x, y) {
    this.hideContextMenu();
    const menu = document.createElement('div');
    menu.className = 'canvas-context-menu';
    menu.style.cssText = `position: fixed; top: ${y}px; left: ${x}px; background: white; border: 1px solid #e0e0e0; border-radius: 8px; box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15); z-index: 2000; min-width: 160px; padding: 6px 0;`;
    const clearItem = document.createElement('button');
    clearItem.type = 'button';
    clearItem.style.cssText = 'display:block;width:100%;border:none;background:transparent;text-align:left;padding:10px 14px;font-size:13px;color:#c0392b;cursor:pointer;border-radius:0;';
    clearItem.textContent = i18n.t('menu.clearCanvas');
    clearItem.onmouseover = () => { clearItem.style.background = '#fff2f0'; };
    clearItem.onmouseout = () => { clearItem.style.background = 'transparent'; };
    clearItem.onclick = (event) => {
      event.stopPropagation();
      this.hideContextMenu();
      this.clearCanvas();
    };
    menu.appendChild(clearItem);
    menu.addEventListener('click', (event) => event.stopPropagation());
    document.body.appendChild(menu);
  },

  hideContextMenu() {
    document.querySelector('.canvas-context-menu')?.remove();
  },

  persistCanvasState() {
    Object.assign(store.data.canvas, {
      zoom: this.zoom,
      offsetX: this.offsetX,
      offsetY: this.offsetY,
      currentTool: this.currentTool,
      currentNodeType: this.currentNodeType
    });
    this.syncViewport();
    store.save();
  },

  getNodeTypeDefaults(type) {
    return {
      variable: { label: '变量', color: '#4A90E2', shape: 'rectangle' },
      stock: { label: '存量', color: '#E67E22', shape: 'rectangle' },
      flow: { label: '流量', color: '#16A085', shape: 'rectangle' }
    }[type] || { label: '变量', color: '#4A90E2', shape: 'rectangle' };
  },

  isEditingTextInput(target) {
    if (!target || !(target instanceof HTMLElement)) return false;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName);
  },

  updateStatus(message) {
    document.getElementById('status').textContent = message;
  }
});
